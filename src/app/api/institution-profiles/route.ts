import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const commune = searchParams.get("commune");
  const institutionType = searchParams.get("institutionType");
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
  if (institutionType) where.institutionType = institutionType;

  const searchWhere = search ? {
    ...where,
    OR: [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { displayName: { contains: search, mode: "insensitive" } },
      { bio: { contains: search, mode: "insensitive" } },
      { servicesOffered: { contains: search, mode: "insensitive" } },
    ],
  } : where;

  const [profiles, total] = await Promise.all([
    prisma.institutionProfile.findMany({
      where: searchWhere,
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.institutionProfile.count({ where: searchWhere }),
  ]);

  return NextResponse.json({ profiles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, displayName, phone, whatsapp, photo, bio, institutionType, servicesOffered, zones, availability, contactMode } = body;

    if (!userId || !institutionType) return NextResponse.json({ error: "userId et institutionType requis" }, { status: 400 });

    const existing = await prisma.institutionProfile.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Profil déjà créé" }, { status: 409 });

    const profile = await prisma.institutionProfile.create({
      data: {
        userId,
        displayName: displayName || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        photo: photo || null,
        bio: bio || null,
        institutionType,
        servicesOffered: JSON.stringify(servicesOffered || []),
        zones: JSON.stringify(zones || []),
        availability: availability || "available",
        contactMode: contactMode || "phone",
        status: "pending",
        isActive: false,
      },
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true } } },
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
    if (fields.institutionType !== undefined) updateData.institutionType = fields.institutionType;
    if (fields.servicesOffered !== undefined) updateData.servicesOffered = JSON.stringify(fields.servicesOffered);
    if (fields.zones !== undefined) updateData.zones = JSON.stringify(fields.zones);
    if (fields.availability !== undefined) updateData.availability = fields.availability;
    if (fields.contactMode !== undefined) updateData.contactMode = fields.contactMode;

    const profile = await prisma.institutionProfile.update({
      where: { userId },
      data: updateData,
      include: { user: { select: { id: true, name: true, avatar: true, isVerified: true } } },
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
