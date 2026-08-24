import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendMail, buildResetEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return NextResponse.json({ error: "Email ou téléphone requis" }, { status: 400 });
    }

    // Always return success to prevent user enumeration
    const notFoundResponse = {
      success: true,
      message: "Si un compte correspond, un lien de réinitialisation a été envoyé.",
    };

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(notFoundResponse);
    }

    if (!user.email) {
      return NextResponse.json({
        success: false,
        error: "Aucun email associé à ce compte. Contactez le support pour réinitialiser votre mot de passe.",
      }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const emailContent = buildResetEmail(token, baseUrl);

    const mailResult = await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("[FORGOT-PWD] Email sent:", mailResult, "to:", user.email);

    return NextResponse.json(notFoundResponse);
  } catch (e) {
    console.error("[FORGOT-PWD] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
