import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, description, price, durationDays, maxActiveListings, maxPhotosPerListing, maxVideosPerListing, maxVideoSizeMb, autoRenew, isTrialEligible, commercialMessage, createdByAdminId } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug et name requis" }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        slug,
        name,
        description: description || null,
        price: price || 0,
        durationDays: durationDays || 0,
        maxActiveListings: maxActiveListings || 3,
        maxPhotosPerListing: maxPhotosPerListing || 6,
        maxVideosPerListing: maxVideosPerListing || 1,
        maxVideoSizeMb: maxVideoSizeMb || 50,
        autoRenew: autoRenew || false,
        isTrialEligible: isTrialEligible || false,
        commercialMessage: commercialMessage || null,
        createdByAdminId: createdByAdminId || null,
      },
    });

    await prisma.planVersion.create({
      data: {
        planId: plan.id,
        version: 1,
        snapshot: JSON.stringify(plan),
        changeReason: "Création initiale",
        changedByAdminId: createdByAdminId || null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, changeReason, changedByAdminId, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });

    const latestVersion = await prisma.planVersion.findFirst({
      where: { planId: id },
      orderBy: { version: "desc" },
    });

    const plan = await prisma.plan.update({ where: { id }, data: updates });

    await prisma.planVersion.create({
      data: {
        planId: id,
        version: (latestVersion?.version || 0) + 1,
        snapshot: JSON.stringify(plan),
        oldSnapshot: JSON.stringify(existing),
        changeReason: changeReason || "Modification par super admin",
        changedByAdminId: changedByAdminId || null,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
