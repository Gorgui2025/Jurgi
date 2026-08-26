import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: now, isOnline: true },
    });

    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    await prisma.user.updateMany({
      where: {
        isOnline: true,
        lastSeen: { lt: fiveMinAgo },
      },
      data: { isOnline: false },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
