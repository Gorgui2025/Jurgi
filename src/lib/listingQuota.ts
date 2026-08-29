import prisma from "@/lib/prisma";

export function africaDakarDayStartIso(date: Date = new Date()): string {
  const dakar = new Date(date.toLocaleString("en-US", { timeZone: "Africa/Dakar" }));
  dakar.setHours(0, 0, 0, 0);
  return dakar.toISOString();
}

export function africaDakarDayStart(date: Date = new Date()): Date {
  return new Date(africaDakarDayStartIso(date));
}

export interface UserPlanInfo {  planId: string | null;
  slug: string;
  name: string;
  maxActiveListings: number;
  dailyListingsQuota: number;
  maxPhotosPerListing: number;
  maxVideosPerListing: number;
  maxVideoSizeMb: number;
  subscriptionActive: boolean;
  trialUntil: Date | null;
  endsAt: Date | null;
}

export async function resolveUserPlan(userId: string): Promise<UserPlanInfo> {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (subscription?.plan) {
    return {
      planId: subscription.planId,
      slug: subscription.plan.slug,
      name: subscription.plan.name,
      maxActiveListings: subscription.plan.maxActiveListings,
      dailyListingsQuota: subscription.plan.dailyListingsQuota,
      maxPhotosPerListing: subscription.plan.maxPhotosPerListing,
      maxVideosPerListing: subscription.plan.maxVideosPerListing,
      maxVideoSizeMb: subscription.plan.maxVideoSizeMb,
      subscriptionActive: true,
      trialUntil: subscription.trialUsed ? subscription.endDate : null,
      endsAt: subscription.endDate,
    };
  }

  const freePlan = await prisma.plan.findUnique({ where: { slug: "gratuit" } });
  return {
    planId: freePlan?.id || null,
    slug: "gratuit",
    name: freePlan?.name || "Gratuit",
    maxActiveListings: freePlan?.maxActiveListings || 3,
    dailyListingsQuota: freePlan?.dailyListingsQuota || 0,
    maxPhotosPerListing: freePlan?.maxPhotosPerListing || 6,
    maxVideosPerListing: freePlan?.maxVideosPerListing || 1,
    maxVideoSizeMb: freePlan?.maxVideoSizeMb || 50,
    subscriptionActive: false,
    trialUntil: null,
    endsAt: null,
  };
}

export interface QuotaResult {
  allowed: boolean;
  reason: "ok" | "daily_limit" | "active_limit";
  planName: string;
  slug: string;
  maxActiveListings: number;
  activeListings: number;
  dailyListingsQuota: number;
  publishedToday: number;
  dailyResetAt: string;
  remainingDaily: number;
}

export async function syncQuotaStatus(userId: string): Promise<void> {
  const plan = await resolveUserPlan(userId);

  const active = await prisma.listing.findMany({
    where: { userId, status: { in: ["active", "SUSPENDED_BY_QUOTA"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const activeItems = active.filter((l) => l.status === "active");
  let suspended = active.filter((l) => l.status === "SUSPENDED_BY_QUOTA");

  if (activeItems.length > plan.maxActiveListings) {
    const excess = activeItems.length - plan.maxActiveListings;
    await prisma.listing.updateMany({
      where: { id: { in: activeItems.slice(0, excess).map((l) => l.id) } },
      data: { status: "SUSPENDED_BY_QUOTA" },
    });
  } else if (activeItems.length < plan.maxActiveListings && suspended.length > 0) {
    const slots = plan.maxActiveListings - activeItems.length;
    const toReactivate = suspended.slice(-slots);
    await prisma.listing.updateMany({
      where: { id: { in: toReactivate.map((l) => l.id) } },
      data: { status: "active" },
    });
  }
}

export async function checkListingQuota(userId: string): Promise<QuotaResult> {
  await syncQuotaStatus(userId);
  const plan = await resolveUserPlan(userId);

  const activeListings = await prisma.listing.count({
    where: { userId, status: "active" },
  });

  const dailyListingsQuota = plan.dailyListingsQuota || 0;
  const dayStart = africaDakarDayStart();
  const dailyResetAt = africaDakarDayStartIso(
    new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  );
  let publishedToday = 0;
  if (dailyListingsQuota > 0) {
    publishedToday = await prisma.listing.count({
      where: { userId, createdAt: { gte: dayStart } },
    });
  }

  if (dailyListingsQuota > 0 && publishedToday >= dailyListingsQuota) {
    return {
      allowed: false,
      reason: "daily_limit",
      planName: plan.name,
      slug: plan.slug,
      maxActiveListings: plan.maxActiveListings,
      activeListings,
      dailyListingsQuota,
      publishedToday,
      dailyResetAt,
      remainingDaily: 0,
    };
  }

  if (activeListings >= plan.maxActiveListings) {
    return {
      allowed: false,
      reason: "active_limit",
      planName: plan.name,
      slug: plan.slug,
      maxActiveListings: plan.maxActiveListings,
      activeListings,
      dailyListingsQuota,
      publishedToday,
      dailyResetAt,
      remainingDaily: dailyListingsQuota > 0 ? Math.max(0, dailyListingsQuota - publishedToday) : -1,
    };
  }

  return {
    allowed: true,
    reason: "ok",
    planName: plan.name,
    slug: plan.slug,
    maxActiveListings: plan.maxActiveListings,
    activeListings,
    dailyListingsQuota,
    publishedToday,
    dailyResetAt,
    remainingDaily: dailyListingsQuota > 0 ? Math.max(0, dailyListingsQuota - publishedToday) : -1,
  };
}
