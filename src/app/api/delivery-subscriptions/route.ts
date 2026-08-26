import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const profile = await prisma.deliveryProfile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profil livreur non trouvé" }, { status: 404 });
    }

    const plan = await prisma.plan.findUnique({ where: { slug: "livreur" } });
    if (!plan) {
      return NextResponse.json({ error: "Plan livreur non trouvé" }, { status: 404 });
    }

    if (action === "start_trial") {
      if (profile.status !== "inactive" && profile.status !== "expired") {
        return NextResponse.json({ error: "Essai déjà activé ou abonnement actif" }, { status: 400 });
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: { status: "trial", trialEndsAt, isActive: true },
      });

      return NextResponse.json({ success: true, trialEndsAt, status: "trial" });
    }

    if (action === "subscribe") {
      const now = new Date();
      const subscriptionEnd = new Date(now);
      subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.durationDays);

      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: { status: "active", subscriptionEnd, isActive: true },
      });

      return NextResponse.json({ success: true, subscriptionEnd, status: "active" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      trialEndsAt: true,
      subscriptionEnd: true,
      isActive: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ subscribed: false });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: "livreur" }, select: { price: true, name: true } });

  return NextResponse.json({
    subscribed: true,
    profile,
    plan,
  });
}
