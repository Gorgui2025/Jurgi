import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const responses = await prisma.deliveryResponse.findMany({
    where: { requestId: params.id },
    include: {
      deliveryProfile: {
        include: {
          user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ responses });
}
