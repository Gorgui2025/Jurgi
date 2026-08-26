import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const region = searchParams.get("region");
  const status = searchParams.get("status") || "published";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (region) where.region = region;
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.deliveryRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        responses: { include: { deliveryProfile: { select: { id: true, displayName: true, vehicleType: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deliveryRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      pickupLocation,
      deliveryLocation,
      region,
      commune,
      productType,
      quantity,
      needHandling,
      scheduledDate,
      scheduledSlot,
      urgency,
      budget,
      photos,
      contactMode,
      description,
    } = body;

    if (!userId || !pickupLocation || !deliveryLocation || !productType) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const deliveryRequest = await prisma.deliveryRequest.create({
      data: {
        userId,
        pickupLocation,
        deliveryLocation,
        region: region || null,
        commune: commune || null,
        productType,
        quantity: quantity || null,
        needHandling: needHandling || false,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledSlot: scheduledSlot || null,
        urgency: urgency || "normal",
        budget: budget ? parseInt(budget) : null,
        photos: JSON.stringify(photos || []),
        contactMode: contactMode || "phone",
        description: description || null,
        status: "published",
      },
    });

    return NextResponse.json(deliveryRequest, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
