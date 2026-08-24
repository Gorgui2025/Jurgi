import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  const where: Record<string, unknown> = {};
  if (level && level !== "Tous") {
    where.level = level;
  }

  const trainings = await prisma.training.findMany({
    where,
    include: {
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trainings);
}
