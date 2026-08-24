import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentRequestId } = body;

    if (!paymentRequestId) {
      return NextResponse.json({ error: "paymentRequestId requis" }, { status: 400 });
    }

    const pr = await prisma.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: { plan: true },
    });

    if (!pr || pr.status !== "pending") {
      return NextResponse.json({ error: "Demande introuvable ou déjà traitée" }, { status: 404 });
    }

    const elapsed = (Date.now() - pr.createdAt.getTime()) / 60000;
    const currentLevel = pr.escalationLevel;
    const coherentAmount = pr.amount === pr.plan.price;

    if (coherentAmount && currentLevel === 0 && elapsed >= 3) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { status: "validated", autoValidated: true, validatedAt: new Date(), escalationLevel: 3 },
      });

      const existingSub = await prisma.subscription.findFirst({
        where: { userId: pr.userId, planId: pr.planId, status: { in: ["active", "trial"] } },
      });

      let subId: string;
      if (existingSub) {
        const newEnd = existingSub.endDate
          ? new Date(Math.max(existingSub.endDate.getTime(), Date.now()) + pr.plan.durationDays * 86400000)
          : new Date(Date.now() + pr.plan.durationDays * 86400000);
        const updated = await prisma.subscription.update({ where: { id: existingSub.id }, data: { endDate: newEnd, status: "active" } });
        subId = updated.id;
      } else {
        const created = await prisma.subscription.create({
          data: { userId: pr.userId, planId: pr.planId, status: "active", startDate: new Date(), endDate: new Date(Date.now() + pr.plan.durationDays * 86400000) },
        });
        subId = created.id;
      }

      await prisma.payment.create({
        data: {
          userId: pr.userId, planId: pr.planId, subscriptionId: subId,
          amount: pr.amount, currency: pr.currency, paymentMethod: "manual",
          status: "completed", finalAmount: pr.amount,
          metadata: JSON.stringify({ activationCode: pr.activationCode, autoValidated: true }),
        },
      });

      await prisma.notification.create({
        data: {
          userId: pr.userId, type: "payment_validated",
          title: "Paiement confirmé !",
          message: `Votre abonnement ${pr.plan.name} est actif. Code: ${pr.activationCode}`,
          data: JSON.stringify({ activationCode: pr.activationCode, auto: true }),
        },
      });

      return NextResponse.json({ level: 3, action: "auto_validated", message: "Montant cohérent — activation automatique après 3 min" });
    }

    if (!coherentAmount && elapsed >= 5 && currentLevel < 1) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { escalationLevel: 1, lastEscalationAt: new Date() },
      });

      await prisma.adminActionLog.create({
        data: {
          adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
          action: "payment_escalation_whatsapp", entityType: "PaymentRequest",
          entityId: paymentRequestId,
          newValue: JSON.stringify({ level: 1, elapsed: Math.round(elapsed), reason: "montant incohérent" }),
        },
      });

      return NextResponse.json({ level: 1, action: "notify_whatsapp", message: "WhatsApp envoyé au validateur principal" });
    }

    if (!coherentAmount && elapsed >= 10 && currentLevel < 2) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { escalationLevel: 2, lastEscalationAt: new Date() },
      });

      await prisma.adminActionLog.create({
        data: {
          adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
          action: "payment_escalation_admin2", entityType: "PaymentRequest",
          entityId: paymentRequestId,
          newValue: JSON.stringify({ level: 2, elapsed: Math.round(elapsed), reason: "montant incohérent" }),
        },
      });

      return NextResponse.json({ level: 2, action: "notify_admin2", message: "Notification au 2e validateur" });
    }

    if (!coherentAmount && elapsed >= 15 && currentLevel < 3) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { escalationLevel: 3, lastEscalationAt: new Date() },
      });

      await prisma.adminActionLog.create({
        data: {
          adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
          action: "payment_escalation_superadmin", entityType: "PaymentRequest",
          entityId: paymentRequestId,
          newValue: JSON.stringify({ level: 3, elapsed: Math.round(elapsed), reason: "montant incohérent — super admin" }),
        },
      });

      return NextResponse.json({ level: 3, action: "notify_superadmin", message: "Notification au super admin" });
    }

    return NextResponse.json({ level: currentLevel, action: "none", message: "Pas encore au seuil d'escalade" });
  } catch (error) {
    console.error("Escalation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
