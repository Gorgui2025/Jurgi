import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliveryRequest = await prisma.deliveryRequest.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, isVerified: true } },
      responses: {
        include: { deliveryProfile: { select: { id: true, displayName: true, vehicleType: true, zones: true } } },
      },
    },
  });

  if (!deliveryRequest) {
    return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
  }

  return NextResponse.json(deliveryRequest);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { deliveryProfileId, message, estimatedDelay, indicativePrice, vehicleType } = body;

    if (!deliveryProfileId) {
      return NextResponse.json({ error: "deliveryProfileId requis" }, { status: 400 });
    }

    const response = await prisma.deliveryResponse.create({
      data: {
        requestId: params.id,
        deliveryProfileId,
        message: message || null,
        estimatedDelay: estimatedDelay || null,
        indicativePrice: indicativePrice ? parseInt(indicativePrice) : null,
        vehicleType: vehicleType || null,
        status: "pending",
      },
    });

    await prisma.deliveryRequest.update({
      where: { id: params.id },
      data: { status: "responses_received" },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
