import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.deliveryRequest.findMany({
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = requests.map(r => ({
      id: r.id,
      pickupLocation: r.pickupLocation,
      deliveryLocation: r.deliveryLocation,
      productType: r.productType,
      status: r.status,
      urgency: r.urgency,
      budget: r.budget,
      createdAt: r.createdAt?.toISOString() || "",
      user: r.user,
    }));

    return NextResponse.json({ requests: formatted });
  } catch {
    return NextResponse.json({ requests: [] });
  }
}
