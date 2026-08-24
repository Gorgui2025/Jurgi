import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    const webhookSecret = process.env.UNITECHPAY_WEBHOOK_SECRET || "";
    if (webhookSecret) {
      const signatureHeader = request.headers.get("x-unitechpay-signature");
      if (signatureHeader) {
        const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
        if (expected !== signatureHeader) {
          return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
        }
      } else {
        const signed = `${data.event || ""}|${data.reference || ""}|${data.amount || ""}|${data.status || ""}|${data.signed_at || ""}`;
        const expected = crypto.createHmac("sha256", webhookSecret).update(signed).digest("hex");
        if (expected !== (data.signature || "")) {
          return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
        }
      }
    }

    const { event, transaction_id, reference, amount, status, method, net_amount, timestamp } = data;

    if (event === "payment_completed" && reference) {
      const payment = await prisma.payment.findFirst({
        where: { providerRef: String(reference) },
        include: { plan: true, subscription: true },
      });

      if (!payment) {
        const paymentByMeta = await prisma.payment.findFirst({
          where: { status: "pending" },
          include: { plan: true, subscription: true },
        });
        if (!paymentByMeta) {
          return NextResponse.json({ received: true, note: "Paiement non trouvé" });
        }
        await processPayment(paymentByMeta, data);
      } else {
        await processPayment(payment, data);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function processPayment(payment: any, webhookData: any) {
  if (payment.status === "completed") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "completed",
      providerStatus: "completed",
      metadata: JSON.stringify(webhookData),
    },
  });

  if (payment.subscriptionId) {
    const endDate = payment.plan.durationDays > 0
      ? new Date(Date.now() + payment.plan.durationDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "active",
        startDate: new Date(),
        endDate,
        planId: payment.planId,
      },
    });
  } else {
    const endDate = payment.plan.durationDays > 0
      ? new Date(Date.now() + payment.plan.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const sub = await prisma.subscription.create({
      data: {
        userId: payment.userId,
        planId: payment.planId,
        status: "active",
        startDate: new Date(),
        endDate,
        autoRenew: false,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: sub.id },
    });
  }

  await prisma.notification.create({
    data: {
      userId: payment.userId,
      type: "subscription",
      title: "Paiement confirmé",
      message: `Votre abonnement ${payment.plan.name} est maintenant actif.`,
      data: JSON.stringify({ paymentId: payment.id, planSlug: payment.plan.slug }),
    },
  });
}
