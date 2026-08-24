import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pending = await prisma.paymentRequest.count({ where: { status: "pending" } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validatedToday = await prisma.paymentRequest.count({
      where: { status: "validated", validatedAt: { gte: today } },
    });

    return NextResponse.json({ pending, validatedToday });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
