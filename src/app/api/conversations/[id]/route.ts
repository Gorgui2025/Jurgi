import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/conversations/[id]?userId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          select: { id: true, name: true, avatar: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Mark messages as read for the current user
    if (userId) {
      await prisma.message.updateMany({
        where: {
          conversationId: params.id,
          senderId: { not: userId },
          read: false,
        },
        data: { read: true },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
