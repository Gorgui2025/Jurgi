import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    let created = 0;

    const expiringSoon = await prisma.subscription.findMany({
      where: { status: "active", endDate: { gt: now, lte: threeDaysFromNow } },
      include: { plan: true, user: { select: { id: true, name: true } } },
    });

    for (const sub of expiringSoon) {
      if (!sub.endDate) continue;
      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const existing = await prisma.notification.findFirst({
        where: {
          userId: sub.userId,
          type: "subscription_expiring",
          data: { contains: sub.id },
        },
      });

      if (!existing) {
        const urgency = daysLeft <= 1 ? "expire demain" : `expire dans ${daysLeft} jours`;
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: "subscription_expiring",
            title: "Abonnement bientôt expiré",
            message: `Votre abonnement ${sub.plan.name} ${urgency}. Renouvelez pour conserver vos ${sub.plan.maxActiveListings} annonces.`,
            data: JSON.stringify({ subscriptionId: sub.id, planSlug: sub.plan.slug, daysLeft, endDate: sub.endDate }),
          },
        });
        created++;
      }
    }

    const expired = await prisma.subscription.findMany({
      where: { status: "active", endDate: { lte: now } },
      include: { plan: true },
    });

    for (const sub of expired) {
      const freePlan = await prisma.plan.findUnique({ where: { slug: "gratuit" } });

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      });

      const activeListings = await prisma.listing.count({
        where: { userId: sub.userId, status: "active" },
      });

      const maxFree = freePlan?.maxActiveListings || 3;
      if (activeListings > maxFree) {
        const excessListings = await prisma.listing.findMany({
          where: { userId: sub.userId, status: "active" },
          orderBy: { createdAt: "asc" },
          skip: maxFree,
        });

        for (const listing of excessListings) {
          await prisma.listing.update({
            where: { id: listing.id },
            data: { status: "suspended" },
          });
        }

        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: "quota_exceeded",
            title: "Annonces suspendues par quota",
            message: `Votre abonnement ${sub.plan.name} a expiré. ${activeListings - maxFree} annonce(s) ont été suspendues. Passez à un plan supérieur pour les réactiver.`,
            data: JSON.stringify({ subscriptionId: sub.id, suspendedCount: activeListings - maxFree }),
          },
        });
        created++;
      } else {
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: "subscription_expired",
            title: "Abonnement expiré",
            message: `Votre abonnement ${sub.plan.name} a expiré. Vous êtes revenu au plan Gratuit.`,
            data: JSON.stringify({ subscriptionId: sub.id }),
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, created, expiringCount: expiringSoon.length, expiredCount: expired.length });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [expiringSoon, expired] = await Promise.all([
    prisma.subscription.count({ where: { status: "active", endDate: { gt: now, lte: threeDays } } }),
    prisma.subscription.findMany({ where: { status: "active", endDate: { lte: now } }, include: { plan: true } }),
  ]);

  return NextResponse.json({
    expiringSoon,
    expiredCount: expired.length,
    subscriptions: expired.map(s => ({ id: s.id, userId: s.userId, plan: s.plan.name, endDate: s.endDate })),
  });
}
