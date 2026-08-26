import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, isVerified: true, region: true, commune: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const profile = await prisma.deliveryProfile.update({
      where: { id: params.id },
      data: body,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
      },
    });
    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
