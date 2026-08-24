import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/reviews?userId=xxx — avis reçus par un utilisateur
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const agg = await prisma.review.aggregate({
    where: { userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return NextResponse.json({
    reviews,
    average: agg._avg.rating,
    count: agg._count.rating,
  });
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewerId, userId, rating, comment } = body;

    if (!reviewerId || !userId || !rating) {
      return NextResponse.json({ error: "reviewerId, userId et rating requis" }, { status: 400 });
    }

    if (reviewerId === userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous évaluer vous-même" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "La note doit être entre 1 et 5" }, { status: 400 });
    }

    const existing = await prisma.review.findFirst({
      where: { reviewerId, userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Vous avez déjà laissé un avis pour cet utilisateur" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: { reviewerId, userId, rating, comment: comment || null },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
