import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.deliveryProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    const formatted = drivers.map(d => ({
      id: d.id,
      name: d.user?.name || "—",
      email: d.user?.email || "—",
      phone: d.user?.phone || d.phone || "—",
      vehicleType: d.vehicleType || "—",
      zones: (() => { try { return JSON.parse(d.zones || "[]"); } catch { return []; } })(),
      status: d.status,
      isActive: d.isActive,
      createdAt: d.createdAt?.toISOString() || "",
    }));

    return NextResponse.json({ drivers: formatted });
  } catch {
    return NextResponse.json({ drivers: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, action, planInfo } = body;

    if (action === "update_plan" && planInfo) {
      const plan = await prisma.plan.findUnique({ where: { slug: "livreur" } });
      if (plan) {
        await prisma.plan.update({
          where: { id: plan.id },
          data: {
            price: planInfo.price,
            durationDays: planInfo.durationDays,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "suspend" && driverId) {
      await prisma.deliveryProfile.update({
        where: { id: driverId },
        data: { status: "suspended", isActive: false },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "reactivate" && driverId) {
      await prisma.deliveryProfile.update({
        where: { id: driverId },
        data: { status: "active", isActive: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
