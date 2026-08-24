import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const all = searchParams.get("all");

  if (userId) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: status || "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const activeListings = await prisma.listing.count({
      where: { userId, status: "active" },
    });

    let planQuotas = null;
    if (subscription?.plan) {
      planQuotas = {
        maxActiveListings: subscription.plan.maxActiveListings,
        maxPhotosPerListing: subscription.plan.maxPhotosPerListing,
        maxVideosPerListing: subscription.plan.maxVideosPerListing,
        maxVideoSizeMb: subscription.plan.maxVideoSizeMb,
        activeListings,
        remainingListings: Math.max(0, subscription.plan.maxActiveListings - activeListings),
      };
    } else {
      const freePlan = await prisma.plan.findUnique({ where: { slug: "gratuit" } });
      planQuotas = {
        maxActiveListings: freePlan?.maxActiveListings || 3,
        maxPhotosPerListing: freePlan?.maxPhotosPerListing || 6,
        maxVideosPerListing: freePlan?.maxVideosPerListing || 1,
        maxVideoSizeMb: freePlan?.maxVideoSizeMb || 50,
        activeListings,
        remainingListings: Math.max(0, (freePlan?.maxActiveListings || 3) - activeListings),
      };
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      include: { plan: true, promotion: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ subscription, quotas: planQuotas, payments });
  }

  if (all) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, plan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ subscriptions });
  }

  return NextResponse.json({ error: "userId ou all requis" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const { userId, planSlug, promotionCode } = await request.json();

    if (!userId || !planSlug) {
      return NextResponse.json({ error: "userId et planSlug requis" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan non trouvé ou inactif" }, { status: 404 });
    }

    const existingSub = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });
    if (existingSub) {
      return NextResponse.json({ error: "Un abonnement actif existe déjà" }, { status: 409 });
    }

    let finalAmount = plan.price;
    let promotionId: string | null = null;

    if (promotionCode && plan.price > 0) {
      const promo = await prisma.promotion.findFirst({
        where: {
          code: promotionCode,
          planId: plan.id,
          status: "active",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });

      if (promo) {
        const usageCount = await prisma.promotionUsage.count({ where: { promotionId: promo.id } });
        if (!promo.maxTotalUses || usageCount < promo.maxTotalUses) {
          const userUsage = await prisma.promotionUsage.count({ where: { promotionId: promo.id, userId } });
          if (userUsage < promo.maxUsesPerUser) {
            finalAmount = promo.promotionalPrice;
            promotionId = promo.id;
          }
        }
      }
    }

    if (plan.price === 0) {
      const sub = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          startDate: new Date(),
          endDate: null,
          autoRenew: false,
        },
      });
      return NextResponse.json({ subscription: sub, requiresPayment: false });
    }

    const sub = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "pending_payment",
        startDate: new Date(),
        endDate: plan.durationDays > 0 ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000) : null,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: sub.id,
        planId: plan.id,
        amount: plan.price,
        finalAmount,
        promotionId: promotionId,
        promoDiscount: promotionId ? plan.price - finalAmount : null,
        status: "pending",
      },
    });

    if (promotionId) {
      const existing = await prisma.promotionUsage.findUnique({
        where: { promotionId_userId: { promotionId, userId } },
      });
      if (!existing) {
        await prisma.promotionUsage.create({ data: { promotionId, userId, paymentId: payment.id } });
      }
    }

    return NextResponse.json({
      subscription: sub,
      payment: { id: payment.id, amount: payment.amount, finalAmount: payment.finalAmount, currency: payment.currency },
      requiresPayment: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
