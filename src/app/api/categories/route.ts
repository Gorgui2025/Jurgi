import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  const where: Record<string, unknown> = { isActive: true };
  if (domain && domain !== "all") where.domain = domain;

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  const grouped = categories.reduce(
    (acc, cat) => {
      if (!acc[cat.domain]) acc[cat.domain] = [];
      acc[cat.domain].push(cat);
      return acc;
    },
    {} as Record<string, typeof categories>
  );

  return NextResponse.json({ categories, grouped });
}
