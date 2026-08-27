import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const urgency = searchParams.get("urgency");
  const category = searchParams.get("category");
  const search = searchParams.get("q");

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (category) where.categoryId = category;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [requests, total, pending, active, closed, expired] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.request.count({ where }),
    prisma.request.count({ where: { status: "pending" } }),
    prisma.request.count({ where: { status: "active" } }),
    prisma.request.count({ where: { status: "closed" } }),
    prisma.request.count({ where: { status: "expired" } }),
  ]);

  return NextResponse.json({
    requests,
    stats: { total, pending, active, closed, expired },
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, reason } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId et action requis" }, { status: 400 });
    }

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    switch (action) {
      case "close":
        await prisma.request.update({ where: { id: requestId }, data: { status: "closed" } });
        break;
      case "reopen":
        await prisma.request.update({ where: { id: requestId }, data: { status: "active" } });
        break;
      case "flag":
        await prisma.request.update({ where: { id: requestId }, data: { status: "flagged" } });
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: "request_flagged",
            title: "Demande signalée",
            message: `Votre demande "${existing.title}" a été signalée${reason ? ` : ${reason}` : ""}.`,
          },
        });
        break;
      case "unflag":
        await prisma.request.update({ where: { id: requestId }, data: { status: "active" } });
        break;
      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
