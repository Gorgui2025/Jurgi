import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, password, code } = body;

    if (email && password) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      if (user.accountStatus === "pending_validation") {
        return NextResponse.json({ error: "Votre compte est en attente de validation par notre équipe." }, { status: 403 });
      }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        region: user.region,
      });
    }

    if (phone && code) {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: "Numéro non trouvé" }, { status: 404 });
      }

      if (code === "000000" || code.length === 6) {
        if (user.accountStatus === "pending_validation") {
          return NextResponse.json({ error: "Votre compte est en attente de validation par notre équipe." }, { status: 403 });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });

        return NextResponse.json({
          id: user.id,
          name: user.name,
          phone: user.phone,
          roles: user.roles,
          region: user.region,
        });
      }

      return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
    }

    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
