import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (adminId) where.adminId = adminId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.adminActionLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, adminEmail, adminRole, action, entityType, entityId, oldValue, newValue, reason } = body;

    if (!adminId || !action || !entityType) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const log = await prisma.adminActionLog.create({
      data: {
        adminId,
        adminEmail: adminEmail || "",
        adminRole: adminRole || "",
        action,
        entityType,
        entityId: entityId || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        reason: reason || null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
