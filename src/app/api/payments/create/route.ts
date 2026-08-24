import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createWavePayment, createOrangeOM, createOrangeQR, createOrangeMaxIt } from "@/lib/unitechpay";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, method, customerNumber } = await request.json();

    if (!paymentId || !method) {
      return NextResponse.json({ error: "paymentId et method requis" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true, user: true, promotion: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    if (payment.status !== "pending") {
      return NextResponse.json({ error: "Ce paiement a déjà été traité" }, { status: 409 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const callbackSuccess = `${baseUrl}/abonnement?payment=success`;
    const callbackCancel = `${baseUrl}/abonnement?payment=cancelled`;
    const description = `Jurgi ${payment.plan.name} — ${payment.finalAmount} FCFA`;

    let result;
    const phone = customerNumber || payment.user.phone || "";

    switch (method) {
      case "wave":
        result = await createWavePayment(payment.finalAmount, phone, description, callbackSuccess, callbackCancel);
        break;
      case "orange_om":
        result = await createOrangeOM(payment.finalAmount, phone, description, callbackSuccess, callbackCancel);
        break;
      case "orange_qr":
        result = await createOrangeQR(payment.finalAmount, payment.id, description, callbackSuccess, callbackCancel);
        break;
      case "orange_maxit":
        result = await createOrangeMaxIt(payment.finalAmount, phone, description, callbackSuccess, callbackCancel);
        break;
      default:
        return NextResponse.json({ error: "Méthode de paiement invalide" }, { status: 400 });
    }

    if (!result?.success) {
      return NextResponse.json({ error: result?.message || "Erreur UnitechPay" }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentMethod: method,
        providerRef: String(result.data?.reference || result.data?.transaction_id || ""),
        providerStatus: "pending",
        metadata: JSON.stringify(result.data),
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: result.data?.payment_url || null,
      qrCode: result.data?.qr_code || null,
      deepLinks: result.data?.deep_links || null,
      reference: result.data?.reference || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
