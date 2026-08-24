import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const secret = req.headers.get("x-cron-secret") || bearerSecret || new URL(req.url).searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await prisma.paymentRequest.findMany({
      where: { status: "pending" },
      include: { plan: true },
    });

    const results = [];

    for (const pr of pending) {
      const elapsed = (Date.now() - pr.createdAt.getTime()) / 60000;
      const currentLevel = pr.escalationLevel;
      const coherentAmount = pr.amount === pr.plan.price;

      if (coherentAmount && currentLevel === 0 && elapsed >= 10) {
        await prisma.paymentRequest.update({
          where: { id: pr.id },
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

        results.push({ id: pr.id, action: "auto_validated", level: 3 });
        continue;
      }

      if (!coherentAmount && elapsed >= 5 && currentLevel < 1) {
        await prisma.paymentRequest.update({ where: { id: pr.id }, data: { escalationLevel: 1, lastEscalationAt: new Date() } });
        await prisma.adminActionLog.create({
          data: {
            adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
            action: "payment_escalation_whatsapp", entityType: "PaymentRequest", entityId: pr.id,
            newValue: JSON.stringify({ level: 1, elapsed: Math.round(elapsed), reason: "montant incohérent" }),
          },
        });
        results.push({ id: pr.id, action: "escalated_1", level: 1 });
        continue;
      }

      if (!coherentAmount && elapsed >= 10 && currentLevel < 2) {
        await prisma.paymentRequest.update({ where: { id: pr.id }, data: { escalationLevel: 2, lastEscalationAt: new Date() } });
        await prisma.adminActionLog.create({
          data: {
            adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
            action: "payment_escalation_admin2", entityType: "PaymentRequest", entityId: pr.id,
            newValue: JSON.stringify({ level: 2, elapsed: Math.round(elapsed), reason: "montant incohérent" }),
          },
        });
        results.push({ id: pr.id, action: "escalated_2", level: 2 });
        continue;
      }

      if (!coherentAmount && elapsed >= 15 && currentLevel < 3) {
        await prisma.paymentRequest.update({ where: { id: pr.id }, data: { escalationLevel: 3, lastEscalationAt: new Date() } });
        await prisma.adminActionLog.create({
          data: {
            adminId: "system", adminEmail: "system@jurgi.sn", adminRole: "system",
            action: "payment_escalation_superadmin", entityType: "PaymentRequest", entityId: pr.id,
            newValue: JSON.stringify({ level: 3, elapsed: Math.round(elapsed), reason: "montant incohérent — super admin" }),
          },
        });
        results.push({ id: pr.id, action: "escalated_3", level: 3 });
        continue;
      }

      results.push({ id: pr.id, action: "none", level: currentLevel, elapsed: Math.round(elapsed) });
    }

    return NextResponse.json({ checked: pending.length, results });
  } catch (error) {
    console.error("Cron escalate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
