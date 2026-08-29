import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncQuotaStatus } from "@/lib/listingQuota";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

    const configs = await prisma.siteConfig.findMany();
    const settings: Record<string, string> = {};
    for (const c of configs) settings[c.key] = c.value;

    if (settings.trial_enabled !== "true") {
      return NextResponse.json({ error: "Essai gratuit non activé" }, { status: 403 });
    }

    if (settings.trial_one_time_only === "true") {
      const existingTrial = await prisma.subscription.findFirst({
        where: { userId, status: { in: ["active", "expired", "trialing"] }, plan: { slug: settings.trial_plan_slug || "express" } },
        include: { plan: true },
      });

      const hasUsedTrial = existingTrial && existingTrial.startDate < new Date();
      if (hasUsedTrial && existingTrial?.plan?.slug === settings.trial_plan_slug) {
        const planSubs = await prisma.subscription.findMany({
          where: { userId, plan: { slug: settings.trial_plan_slug || "express" } },
        });
        if (planSubs.length > 0) {
          return NextResponse.json({ error: "Essai gratuit déjà utilisé" }, { status: 409 });
        }
      }
    }

    const existingActive = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });
    if (existingActive) {
      return NextResponse.json({ error: "Un abonnement actif existe déjà" }, { status: 409 });
    }

    const planSlug = settings.trial_plan_slug || "express";
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) return NextResponse.json({ error: "Plan d'essai non trouvé" }, { status: 404 });

    const durationDays = parseInt(settings.trial_duration_days || "7");
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
        endDate,
        autoRenew: false,
        trialUsed: true,
      },
      include: { plan: true },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "trial",
        title: "Essai gratuit activé",
        message: `Votre essai ${plan.name} de ${durationDays} jours est actif. Expire le ${endDate.toLocaleDateString("fr-FR")}.`,
        data: JSON.stringify({ subscriptionId: sub.id, planSlug: plan.slug, durationDays }),
      },
    });

    await syncQuotaStatus(userId);

    return NextResponse.json({ subscription: sub, message: `Essai ${plan.name} activé pour ${durationDays} jours` });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
