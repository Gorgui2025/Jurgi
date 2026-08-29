import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncQuotaStatus } from "@/lib/listingQuota";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const secret = req.headers.get("x-cron-secret") || bearerSecret || new URL(req.url).searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results: { id: string; action: string }[] = [];

    const trialSubs = await prisma.subscription.findMany({
      where: {
        status: "active",
        trialUsed: true,
        endDate: { not: null },
      },
      include: { plan: true, user: true },
    });

    const alreadyNotified = async (userId: string, subscriptionId: string, type: string) => {
      const existing = await prisma.notification.findFirst({
        where: { userId, type, data: { contains: subscriptionId } },
      });
      return !!existing;
    };

    for (const sub of trialSubs) {
      if (!sub.endDate) continue;
      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / DAY_MS);

      if (daysLeft <= 5 && daysLeft > 0) {
        const notifType = daysLeft <= 1 ? "trial_expires_today" : "trial_reminder";
        if (await alreadyNotified(sub.userId, sub.id, notifType)) {
          results.push({ id: sub.id, action: `${notifType}_already` });
          continue;
        }
        const message =
          daysLeft <= 1
            ? `Votre essai ${sub.plan.name} se termine aujourd'hui. Après cette date, la publication de nouvelles annonces sera suspendue tant que l'offre n'est pas activée.`
            : `Votre essai ${sub.plan.name} se termine le ${sub.endDate.toLocaleDateString("fr-FR")}. Activez l'offre pour continuer à publier.`;
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: notifType,
            title: "Fin d'essai gratuite",
            message,
            data: JSON.stringify({ subscriptionId: sub.id, planSlug: sub.plan.slug, endDate: sub.endDate.toISOString() }),
          },
        });
        results.push({ id: sub.id, action: notifType });
        continue;
      }

      if (daysLeft <= 0) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "expired" },
        });
        await syncQuotaStatus(sub.userId);
        results.push({ id: sub.id, action: "expired_and_suspended" });
        continue;
      }
    }

    const paidSubs = await prisma.subscription.findMany({
      where: {
        status: "active",
        trialUsed: false,
        endDate: { not: null, lte: now },
      },
      include: { plan: true },
    });

    for (const sub of paidSubs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      });
      await syncQuotaStatus(sub.userId);
      results.push({ id: sub.id, action: "paid_expired" });
    }

    return NextResponse.json({ checked: trialSubs.length + paidSubs.length, results });
  } catch (error) {
    console.error("Cron expiry error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
