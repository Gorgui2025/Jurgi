import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const newPassword = "Jurgi" + crypto.randomBytes(4).toString("hex");
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      newPassword,
      message: `Mot de passe réinitialisé pour ${user.name || user.phone || user.email}`,
    });
  } catch (e) {
    console.error("[ADMIN-RESET]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
