import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentRequestId, adminId, action, rejectionReason } = body;

    if (!paymentRequestId || !adminId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!["validate", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Admin introuvable" }, { status: 404 });
    }

    const pr = await prisma.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: { plan: true, user: true },
    });
    if (!pr) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }
    if (pr.status !== "pending") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 409 });
    }

    if (action === "reject") {
      const existingPayment = await prisma.payment.findFirst({
        where: { userId: pr.userId, planId: pr.planId, status: "completed" },
      });

      if (existingPayment) {
        await prisma.payment.delete({ where: { id: existingPayment.id } });

        const sub = await prisma.subscription.findFirst({
          where: { userId: pr.userId, planId: pr.planId, status: { in: ["active", "trial"] } },
        });
        if (sub) {
          await prisma.subscription.delete({ where: { id: sub.id } });
        }
      }

      const updated = await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "rejected",
          validatedByAdminId: adminId,
          validatedAt: new Date(),
          rejectionReason: rejectionReason || "Paiement non confirmé",
        },
      });

      await prisma.notification.create({
        data: {
          userId: pr.userId,
          type: "payment_rejected",
          title: "Paiement refusé",
          message: `Votre demande de paiement pour ${pr.plan.name} a été refusée. ${rejectionReason || ""}`,
          data: JSON.stringify({ paymentRequestId, rejectionReason }),
        },
      });

      await prisma.adminActionLog.create({
        data: {
          adminId,
          adminEmail: admin.email,
          adminRole: admin.role,
          action: "payment_reject",
          entityType: "PaymentRequest",
          entityId: paymentRequestId,
          newValue: JSON.stringify({ rejectionReason, rolledBackPayment: !!existingPayment }),
        },
      });

      return NextResponse.json({ status: "rejected", id: updated.id, rolledBack: !!existingPayment });
    }

    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId: pr.userId,
        planId: pr.planId,
        status: { in: ["active", "trial"] },
      },
    });

    let subscriptionId: string;
    if (existingSub) {
      const newEnd = existingSub.endDate
        ? new Date(Math.max(existingSub.endDate.getTime(), Date.now()) + pr.plan.durationDays * 86400000)
        : new Date(Date.now() + pr.plan.durationDays * 86400000);

      const updatedSub = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { endDate: newEnd, status: "active" },
      });
      subscriptionId = updatedSub.id;
    } else {
      const newSub = await prisma.subscription.create({
        data: {
          userId: pr.userId,
          planId: pr.planId,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + pr.plan.durationDays * 86400000),
        },
      });
      subscriptionId = newSub.id;
    }

    await prisma.payment.create({
      data: {
        userId: pr.userId,
        planId: pr.planId,
        subscriptionId,
        amount: pr.amount,
        currency: pr.currency,
        paymentMethod: "manual",
        providerRef: pr.transactionRef || undefined,
        status: "completed",
        finalAmount: pr.amount,
        metadata: JSON.stringify({ activationCode: pr.activationCode, validatedBy: adminId }),
      },
    });

    const updated = await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: "validated",
        validatedByAdminId: adminId,
        validatedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: pr.userId,
        type: "payment_validated",
        title: "Paiement confirmé !",
        message: `Votre abonnement ${pr.plan.name} est maintenant actif. Code: ${pr.activationCode}`,
        data: JSON.stringify({ activationCode: pr.activationCode, planName: pr.plan.name }),
      },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId,
        adminEmail: admin.email,
        adminRole: admin.role,
        action: "payment_validate",
        entityType: "PaymentRequest",
        entityId: paymentRequestId,
        newValue: JSON.stringify({ planName: pr.plan.name, amount: pr.amount, activationCode: pr.activationCode }),
      },
    });

    if (pr.plan.slug === "livreur") {
      const deliveryProfile = await prisma.deliveryProfile.findUnique({ where: { userId: pr.userId } });
      if (deliveryProfile) {
        const subscriptionEnd = new Date(Date.now() + pr.plan.durationDays * 86400000);
        await prisma.deliveryProfile.update({
          where: { id: deliveryProfile.id },
          data: { status: "active", subscriptionEnd, isActive: true },
        });
      }
    }

    return NextResponse.json({
      status: "validated",
      id: updated.id,
      activationCode: pr.activationCode,
      subscriptionId,
    });
  } catch (error) {
    console.error("Payment validate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
