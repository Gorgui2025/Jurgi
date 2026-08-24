import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, content } = body;

    if (!conversationId || !senderId || !content?.trim()) {
      return NextResponse.json(
        { error: "conversationId, senderId et content requis" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } },
    });

    if (conversation) {
      const recipients = conversation.participants.filter((p) => p.id !== senderId);
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true },
      });

      for (const recipient of recipients) {
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            type: "message",
            title: "Nouveau message",
            message: `${sender?.name || "Quelqu'un"} vous a envoyé un message`,
            data: JSON.stringify({ conversationId }),
          },
        });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

// GET /api/messages?conversationId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId requis" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
