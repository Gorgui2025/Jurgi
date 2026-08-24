import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const all = searchParams.get("all");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (!all && !status) {
    where.status = "active";
    where.startDate = { lte: new Date() };
    where.endDate = { gte: new Date() };
  }

  const promotions = await prisma.promotion.findMany({
    where,
    include: { plan: { select: { name: true, slug: true } }, _count: { select: { usages: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, code, planId, discountType, discountValue, promotionalPrice,
      startDate, endDate, maxTotalUses, maxUsesPerUser,
      newUsersOnly, existingUsersOnly, compatibleWithTrial, applyToRenewal,
      displayMessage, createdByAdminId,
    } = body;

    if (!name || !planId || !startDate || !endDate || promotionalPrice === undefined) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });

    if (promotionalPrice < 0 || promotionalPrice > plan.price) {
      return NextResponse.json({ error: "Prix promotionnel invalide" }, { status: 400 });
    }

    const promo = await prisma.promotion.create({
      data: {
        name,
        code: code || null,
        planId,
        discountType: discountType || "fixed",
        discountValue: discountValue || 0,
        promotionalPrice,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxTotalUses: maxTotalUses || null,
        maxUsesPerUser: maxUsesPerUser || 1,
        newUsersOnly: newUsersOnly || false,
        existingUsersOnly: existingUsersOnly || false,
        compatibleWithTrial: compatibleWithTrial || false,
        applyToRenewal: applyToRenewal || false,
        status: "active",
        displayMessage: displayMessage || null,
        createdByAdminId: createdByAdminId || null,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const promo = await prisma.promotion.update({
      where: { id },
      data: { ...updates, ...(status && { status }) },
    });

    return NextResponse.json(promo);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
