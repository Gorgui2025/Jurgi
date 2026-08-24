import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return `JURGI-${segments.join("-")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planId, transactionRef, userNote } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: "userId et planId requis" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan introuvable ou inactif" }, { status: 404 });
    }

    const pendingCount = await prisma.paymentRequest.count({
      where: { userId, status: "pending" },
    });
    if (pendingCount > 0) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande de paiement en cours" },
        { status: 409 }
      );
    }

    const activationCode = generateActivationCode();

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        transactionRef: transactionRef || null,
        userNote: userNote || null,
        activationCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });

    const admins = await prisma.admin.findMany({ where: { isActive: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId,
          type: "payment_request",
          title: "Nouvelle demande de paiement",
          message: `${plan.name} — ${plan.price} ${plan.currency}`,
          data: JSON.stringify({ paymentRequestId: paymentRequest.id, planName: plan.name, amount: plan.price }),
        },
      });
    }

    return NextResponse.json({
      id: paymentRequest.id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      expiresAt: paymentRequest.expiresAt,
    });
  } catch (error) {
    console.error("Payment request error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
