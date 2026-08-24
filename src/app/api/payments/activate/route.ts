import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activationCode, userId } = body;

    if (!activationCode) {
      return NextResponse.json({ error: "Code d'activation requis" }, { status: 400 });
    }

    const pr = await prisma.paymentRequest.findFirst({
      where: { activationCode: activationCode.toUpperCase().trim() },
      include: { plan: true },
    });

    if (!pr) {
      return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    }

    if (pr.status !== "validated") {
      const statusLabel = pr.status === "pending" ? "en attente de validation" : "rejeté";
      return NextResponse.json({ error: `Ce paiement est ${statusLabel}` }, { status: 400 });
    }

    if (userId && pr.userId !== userId) {
      return NextResponse.json({ error: "Ce code ne vous appartient pas" }, { status: 403 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: pr.userId,
        planId: pr.planId,
        status: "active",
      },
      include: { plan: true },
    });

    return NextResponse.json({
      valid: true,
      planName: pr.plan.name,
      amount: pr.amount,
      currency: pr.currency,
      validatedAt: pr.validatedAt,
      subscription: subscription
        ? {
            id: subscription.id,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            plan: subscription.plan.name,
          }
        : null,
    });
  } catch (error) {
    console.error("Activate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
