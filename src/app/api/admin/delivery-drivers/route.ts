import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.deliveryProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
    });

    const formatted = drivers.map(d => ({
      id: d.id,
      name: d.user?.name || "—",
      email: d.user?.email || "—",
      phone: d.user?.phone || d.phone || "—",
      isVerified: d.user?.isVerified || false,
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

    if (action === "approve" && driverId) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await prisma.deliveryProfile.update({
        where: { id: driverId },
        data: { status: "trial", trialEndsAt, isActive: true },
      });

      const profile = await prisma.deliveryProfile.findUnique({ where: { id: driverId }, select: { userId: true } });
      if (profile) {
        await prisma.user.update({ where: { id: profile.userId }, data: { accountStatus: "active" } });
        await prisma.notification.create({
          data: {
            userId: profile.userId,
            type: "delivery_approved",
            title: "Profil livreur approuvé",
            message: "Votre profil livreur a été approuvé. Vous bénéficiez de 7 jours d'essai gratuit.",
            data: JSON.stringify({ trialEndsAt: trialEndsAt.toISOString() }),
          },
        });
      }

      return NextResponse.json({ success: true, trialEndsAt });
    }

    if (action === "reject" && driverId) {
      const profile = await prisma.deliveryProfile.findUnique({ where: { id: driverId }, select: { userId: true } });
      await prisma.deliveryProfile.delete({ where: { id: driverId } });

      if (profile) {
        await prisma.user.update({ where: { id: profile.userId }, data: { accountStatus: "rejected" } });
        await prisma.notification.create({
          data: {
            userId: profile.userId,
            type: "delivery_rejected",
            title: "Profil livreur refusé",
            message: "Votre profil livreur a été refusé. Contactez le support pour plus d'informations.",
            data: JSON.stringify({}),
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
      const profile = await prisma.deliveryProfile.findUnique({ where: { id: driverId }, select: { userId: true } });
      if (profile) {
        await prisma.notification.create({
          data: {
            userId: profile.userId,
            type: "delivery_suspended",
            title: "Profil livreur suspendu",
            message: "Votre profil livreur a été suspendu par un administrateur. Contactez le support pour plus d'informations.",
            data: JSON.stringify({ driverId }),
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "reactivate" && driverId) {
      await prisma.deliveryProfile.update({
        where: { id: driverId },
        data: { status: "active", isActive: true },
      });
      const profile = await prisma.deliveryProfile.findUnique({ where: { id: driverId }, select: { userId: true } });
      if (profile) {
        await prisma.notification.create({
          data: {
            userId: profile.userId,
            type: "delivery_reactivated",
            title: "Profil livreur réactivé",
            message: "Votre profil livreur a été réactivé par un administrateur.",
            data: JSON.stringify({ driverId }),
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if ((action === "verify" || action === "unverify") && driverId) {
      const profile = await prisma.deliveryProfile.findUnique({ where: { id: driverId }, select: { userId: true } });
      if (profile) {
        await prisma.user.update({
          where: { id: profile.userId },
          data: action === "verify" ? { isVerified: true, verifiedLevel: "professional" } : { isVerified: false, verifiedLevel: "none" },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
