import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/request-responses?requestId=xxx — responses for a demand
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "requestId requis" }, { status: 400 });
  }

  const responses = await prisma.requestResponse.findMany({
    where: { requestId },
    include: {
      user: { select: { id: true, name: true, avatar: true, isVerified: true, phone: true, whatsapp: true, phoneVisible: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(responses);
}

// POST /api/request-responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, userId, message, price, listingId } = body;

    if (!requestId || !userId || !message) {
      return NextResponse.json({ error: "requestId, userId et message requis" }, { status: 400 });
    }

    const req = await prisma.request.findUnique({ where: { id: requestId } });
    if (!req) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    if (req.userId === userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas répondre à votre propre demande" }, { status: 400 });
    }

    const response = await prisma.requestResponse.create({
      data: {
        requestId,
        userId,
        message,
        price: price ? parseFloat(price) : null,
        listingId: listingId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
      },
    });

    // Create notification for the request author
    const responder = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: req.userId,
        type: "message",
        title: "Nouvelle réponse à votre demande",
        message: `${responder?.name || "Quelqu'un"} a répondu à votre demande "${req.title}"`,
        data: JSON.stringify({ requestId }),
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/request-responses — update status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    }

    const updated = await prisma.requestResponse.update({
      where: { id },
      data: { status },
      include: { request: { select: { id: true, title: true, userId: true } } },
    });

    if (status === "accepted") {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          type: "account_approved",
          title: "Votre réponse a été acceptée !",
          message: `Votre réponse à la demande "${updated.request.title}" a été acceptée. Contactez l'acheteur pour finaliser.`,
          data: JSON.stringify({ requestId: updated.requestId }),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
