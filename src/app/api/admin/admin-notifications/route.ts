import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;

  const notifications = await prisma.adminNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const admin = adminId
    ? await prisma.admin.findUnique({ where: { id: adminId }, select: { lastSeenNotificationsAt: true } })
    : null;

  const lastSeen = admin?.lastSeenNotificationsAt;
  const unreadCount = notifications.filter(n => !lastSeen || n.createdAt > lastSeen).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: "adminId requis" }, { status: 400 });
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: { lastSeenNotificationsAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
