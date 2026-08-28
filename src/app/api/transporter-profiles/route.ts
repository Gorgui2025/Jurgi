import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (userId) {
    const profile = await prisma.transporterProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } } },
    });
    return NextResponse.json(profile);
  }

  const region = searchParams.get("region");
  const commune = searchParams.get("commune");
  const vehicleType = searchParams.get("vehicleType");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isActive: true,
    OR: [{ status: "active" }, { status: "trial" }],
  };

  if (region) where.zones = { contains: region };
  if (commune) where.zones = { contains: commune };
  if (vehicleType) where.vehicleType = vehicleType;

  const searchWhere = search ? {
    ...where,
    OR: [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { displayName: { contains: search, mode: "insensitive" } },
      { bio: { contains: search, mode: "insensitive" } },
      { zones: { contains: search, mode: "insensitive" } },
    ],
  } : where;

  const [profiles, total] = await Promise.all([
    prisma.transporterProfile.findMany({
      where: searchWhere,
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transporterProfile.count({ where: searchWhere }),
  ]);

  const userIds = profiles.map((p) => p.userId).filter(Boolean);
  const reviewAggs = userIds.length
    ? await prisma.review.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];

  const reviewMap = new Map<string, { avg: number; count: number }>();
  for (const agg of reviewAggs) {
    reviewMap.set(agg.userId, { avg: Number(agg._avg.rating || 0), count: agg._count.rating });
  }

  const enriched = profiles.map((p) => ({
    ...p,
    rating: reviewMap.get(p.userId)?.avg ?? null,
    reviewCount: reviewMap.get(p.userId)?.count ?? 0,
  }));

  return NextResponse.json({ profiles: enriched, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, displayName, phone, whatsapp, photo, bio, vehicleType, vehicleCapacity, zones, acceptedTypes, availability, hourlySchedule, indicativePrice, contactMode } = body;

    if (!userId || !vehicleType) return NextResponse.json({ error: "userId et vehicleType requis" }, { status: 400 });

    const existing = await prisma.transporterProfile.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Profil déjà créé" }, { status: 409 });

    const profile = await prisma.transporterProfile.create({
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
        availability: availability || "available",
        hourlySchedule: hourlySchedule || null,
        indicativePrice: indicativePrice || null,
        contactMode: contactMode || "phone",
        status: "pending",
        isActive: false,
      },
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } } },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...fields } = body;

    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (fields.displayName !== undefined) updateData.displayName = fields.displayName;
    if (fields.phone !== undefined) updateData.phone = fields.phone;
    if (fields.whatsapp !== undefined) updateData.whatsapp = fields.whatsapp;
    if (fields.photo !== undefined) updateData.photo = fields.photo;
    if (fields.bio !== undefined) updateData.bio = fields.bio;
    if (fields.vehicleType !== undefined) updateData.vehicleType = fields.vehicleType;
    if (fields.vehicleCapacity !== undefined) updateData.vehicleCapacity = fields.vehicleCapacity;
    if (fields.zones !== undefined) updateData.zones = JSON.stringify(fields.zones);
    if (fields.acceptedTypes !== undefined) updateData.acceptedTypes = JSON.stringify(fields.acceptedTypes);
    if (fields.availability !== undefined) updateData.availability = fields.availability;
    if (fields.hourlySchedule !== undefined) updateData.hourlySchedule = fields.hourlySchedule;
    if (fields.indicativePrice !== undefined) updateData.indicativePrice = fields.indicativePrice;
    if (fields.contactMode !== undefined) updateData.contactMode = fields.contactMode;

    const profile = await prisma.transporterProfile.update({
      where: { userId },
      data: updateData,
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true, lastSeen: true } } },
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
