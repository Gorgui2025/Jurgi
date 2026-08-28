import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sessionId: string = String(body.sessionId || "unknown");
  const rating: number = Number(body.rating);
  const comment: string | null = body.comment ? String(body.comment) : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide" }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    userId = (session?.user as any)?.id || null;
  } catch {
    // sans session
  }

  try {
    await prisma.secretaryFeedback.create({
      data: {
        sessionId,
        userId,
        rating,
        comment,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
