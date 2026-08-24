import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ROLE_LABELS: Record<string, string> = {
  veterinaire: "Vétérinaire",
  transporteur: "Transporteur",
  formateur: "Formateur",
  technicien: "Technicien",
  vendeur_aliment: "Vendeur d'aliments",
  institut: "Institution",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const proRoles = ["veterinaire", "transporteur", "formateur", "technicien", "vendeur_aliment", "institut"];

  const where: Record<string, unknown> = {
    accountStatus: "active",
  };

  if (role && role !== "all") {
    where.roles = { contains: role };
  } else {
    where.OR = proRoles.map((r) => ({ roles: { contains: r } }));
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      avatar: true,
      bio: true,
      region: true,
      commune: true,
      zones: true,
      roles: true,
      isVerified: true,
      verifiedLevel: true,
      phoneVisible: true,
      whatsapp: true,
      _count: { select: { listings: true, reviewsGiven: false } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const reviewsAgg = await prisma.review.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
    },
    select: {
      userId: true,
      rating: true,
    },
  });

  const reviewsMap = new Map<string, { total: number; count: number }>();
  for (const r of reviewsAgg) {
    const existing = reviewsMap.get(r.userId) || { total: 0, count: 0 };
    existing.total += r.rating;
    existing.count += 1;
    reviewsMap.set(r.userId, existing);
  }

  const enriched = users.map((u) => {
    const parsedRoles: string[] = JSON.parse(u.roles || "[]");
    const primaryRole = parsedRoles.find((r) => proRoles.includes(r)) || parsedRoles[0];
    const review = reviewsMap.get(u.id);

    return {
      ...u,
      primaryRole,
      primaryRoleLabel: ROLE_LABELS[primaryRole] || primaryRole,
      rating: review ? review.total / review.count : null,
      reviewCount: review?.count || 0,
      phone: u.phoneVisible ? u.phone : null,
    };
  });

  return NextResponse.json(enriched);
}
