import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterId, targetType, targetId, reason, description } = body;

    if (!reporterId || !targetType || !targetId || !reason) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: { reporterId, targetType, targetId, reason, description: description || null },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, resolution } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        ...(resolution !== undefined && { resolution }),
        ...(status !== "pending" && { resolvedAt: new Date() }),
      },
    });

    if (status === "confirmed" && report.targetType === "listing") {
      await prisma.listing.update({
        where: { id: report.targetId },
        data: { status: "suspended" },
      }).catch(() => {});
    }

    if (status === "confirmed" && report.targetType === "user") {
      await prisma.user.update({
        where: { id: report.targetId },
        data: { accountStatus: "suspended" },
      }).catch(() => {});
    }

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
