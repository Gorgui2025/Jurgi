import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/conversations?userId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { id: userId } },
    },
    include: {
      participants: {
        select: { id: true, name: true, avatar: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

// POST /api/conversations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, receiverIds, name, isGroup } = body;

    const participantIds: string[] = [];

    if (isGroup && receiverIds?.length) {
      // Group conversation
      participantIds.push(senderId, ...receiverIds);
    } else if (receiverId) {
      // 1-to-1
      participantIds.push(senderId, receiverId);
    } else {
      return NextResponse.json({ error: "receiverId ou receiverIds requis" }, { status: 400 });
    }

    // For 1-to-1, check existing
    if (!isGroup && receiverId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { id: senderId } } },
            { participants: { some: { id: receiverId } } },
          ],
        },
        include: {
          participants: { select: { id: true, name: true, avatar: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      });
      if (existing) return NextResponse.json(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? name || null : null,
        isGroup: isGroup || false,
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
