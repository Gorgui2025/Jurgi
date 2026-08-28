import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const flat = conversations.map((c) => ({
      id: c.id,
      name: c.name,
      isGroup: c.isGroup,
      updatedAt: c.updatedAt,
      participants: c.participants,
      messages: c.messages,
      messageCount: c.messages.length,
    }));

    return NextResponse.json({ conversations: flat });
  } catch {
    return NextResponse.json({ conversations: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }
    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
