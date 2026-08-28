import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const commune = searchParams.get("commune");
  const vehicleType = searchParams.get("vehicleType");
  const availability = searchParams.get("availability");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { status: "trial" },
      { status: "active" },
    ],
  };

  if (region) where.zones = { contains: region };
  if (commune) where.zones = { contains: commune };
  if (vehicleType) where.vehicleType = vehicleType;
  if (availability) where.availability = availability;

  if (search) {
    const profiles = await prisma.deliveryProfile.findMany({
      where: {
        ...where,
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
          { zones: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.deliveryProfile.count({
      where: {
        ...where,
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
          { zones: { contains: search, mode: "insensitive" } },
        ],
      },
    });

    const enriched = await attachReviews(profiles);
    return NextResponse.json({ profiles: enriched, total, page, pages: Math.ceil(total / limit) });
  }

  const [profiles, total] = await Promise.all([
    prisma.deliveryProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deliveryProfile.count({ where }),
  ]);

  const enriched = await attachReviews(profiles);
  return NextResponse.json({ profiles: enriched, total, page, pages: Math.ceil(total / limit) });
}

async function attachReviews(profiles: { userId: string }[]) {
  const userIds = profiles.map((p) => p.userId).filter(Boolean);
  const algs = userIds.length
    ? await prisma.review.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];
  const reviewMap = new Map<string, { avg: number; count: number }>();
  for (const agg of algs) {
    reviewMap.set(agg.userId, { avg: Number(agg._avg.rating || 0), count: agg._count.rating });
  }
  return profiles.map((p) => ({
    ...p,
    rating: reviewMap.get(p.userId)?.avg ?? null,
    reviewCount: reviewMap.get(p.userId)?.count ?? 0,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      displayName,
      phone,
      whatsapp,
      photo,
      bio,
      vehicleType,
      vehicleCapacity,
      zones,
      acceptedTypes,
      refusedTypes,
      availability,
      hourlySchedule,
      urgentDelivery,
      weekendDelivery,
      contactMode,
      indicativePrice,
    } = body;

    if (!userId || !vehicleType) {
      return NextResponse.json({ error: "userId et vehicleType requis" }, { status: 400 });
    }

    const existing = await prisma.deliveryProfile.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "Profil livreur déjà créé" }, { status: 409 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isAdminValidated = user.accountStatus === "active";
    const profileStatus = isAdminValidated ? "trial" : "pending";
    const trialEndsAt = isAdminValidated ? (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })() : null;

    const profile = await prisma.deliveryProfile.create({
      data: {
        userId,
        displayName: displayName || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        photo: photo || null,
        bio: bio || null,
        vehicleType,
        vehicleCapacity: vehicleCapacity || null,
        zones: JSON.stringify(zones || []),
        acceptedTypes: JSON.stringify(acceptedTypes || []),
        refusedTypes: JSON.stringify(refusedTypes || []),
        availability: availability || "available",
        hourlySchedule: hourlySchedule || null,
        urgentDelivery: urgentDelivery || false,
        weekendDelivery: weekendDelivery || false,
        contactMode: contactMode || "phone",
        indicativePrice: indicativePrice || null,
        status: profileStatus,
        trialEndsAt,
        isActive: isAdminValidated,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } },
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
