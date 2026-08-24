import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    "dashboard", "users", "users_manage", "users_suspend", "users_delete",
    "listings", "listings_moderate", "listings_delete",
    "reports", "reports_manage",
    "messages", "messages_read_all",
    "requests", "requests_manage",
    "professionals", "professionals_manage",
    "settings", "settings_emergency",
    "audit", "audit_full",
    "ai_assistant",
    "finance", "finance_read",
    "admin_roles",
  ],
  moderation: [
    "dashboard",
    "users", "users_view",
    "listings", "listings_moderate",
    "reports", "reports_manage",
    "messages", "messages_reported",
    "professionals", "professionals_view",
    "audit", "audit_own",
    "ai_assistant",
  ],
  support: [
    "dashboard",
    "users", "users_support",
    "listings",
    "reports", "reports_view",
    "messages", "messages_support",
    "requests", "requests_support",
    "professionals",
    "audit", "audit_own",
    "ai_assistant",
  ],
  validateur_paiement: [
    "dashboard",
    "payments", "payments_validate",
    "subscriptions", "subscriptions_view",
    "audit", "audit_own",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !admin.isActive) {
      await prisma.adminLoginLog.create({
        data: { adminId: "unknown", email, success: false, ipAddress: ip, userAgent: ua },
      });
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      await prisma.adminLoginLog.create({
        data: { adminId: admin.id, email, success: false, ipAddress: ip, userAgent: ua },
      });
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.adminLoginLog.create({
      data: { adminId: admin.id, email, success: true, ipAddress: ip, userAgent: ua },
    });

    const permissions = ADMIN_ROLE_PERMISSIONS[admin.role] || [];

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
