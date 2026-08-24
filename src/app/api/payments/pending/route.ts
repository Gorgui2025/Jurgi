import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const payments = await prisma.paymentRequest.findMany({
      where: { status },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fetch pending payments error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
