import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const urgency = searchParams.get("urgency");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "active" };

  if (category) where.categoryId = category;
  if (region) where.region = region;
  if (urgency) where.urgency = urgency;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.request.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      categoryId,
      title,
      description,
      quantity,
      budget,
      region,
      commune,
      deadline,
      urgency,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const anyUser = await prisma.user.findFirst();
      resolvedUserId = anyUser?.id;
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { error: "Aucun utilisateur disponible" },
        { status: 400 }
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        userId: resolvedUserId,
        categoryId: categoryId || null,
        title,
        description,
        quantity: quantity || null,
        budget: budget || null,
        region: region || null,
        commune: commune || null,
        deadline: deadline || null,
        urgency: urgency || "normal",
        status: "active",
        visibility: "public",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande" },
      { status: 500 }
    );
  }
}
