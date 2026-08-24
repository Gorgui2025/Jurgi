import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const req = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, isVerified: true, createdAt: true, _count: { select: { listings: true } } } },
      category: { select: { name: true, slug: true } },
      _count: { select: { responses: true } },
    },
  });

  if (!req) {
    return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
  }

  // Increment views
  await prisma.request.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json(req);
}
