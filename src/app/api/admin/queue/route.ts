import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [pendingReports, pendingUsers, suspendedListings, flaggedMessages] = await Promise.all([
      prisma.report.findMany({ where: { status: "pending" }, include: { reporter: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.user.findMany({ where: { accountStatus: "pending_validation" }, select: { id: true, name: true, phone: true, email: true, roles: true, region: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.listing.findMany({ where: { status: "suspended" }, select: { id: true, title: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.contactMessage.findMany({ where: { status: "new" }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const items: { type: string; title: string; reason: string; priority: string; time: string; id: string }[] = [];

    for (const r of pendingReports) {
      items.push({
        type: "report",
        title: `Signalement : ${r.reason}`,
        reason: `Signalé par ${r.reporter?.name || "Anonyme"} — ${r.targetType}`,
        priority: r.targetType === "user" ? "critical" : "high",
        time: r.createdAt.toISOString(),
        id: r.id,
      });
    }

    for (const u of pendingUsers) {
      const roles = JSON.parse(u.roles || "[]");
      items.push({
        type: "user_validation",
        title: `Compte en attente : ${u.name}`,
        reason: `${roles.join(", ")} — ${u.region || "Région inconnue"} — ${u.phone || u.email}`,
        priority: roles.includes("professionnel") ? "high" : "normal",
        time: u.createdAt.toISOString(),
        id: u.id,
      });
    }

    for (const l of suspendedListings) {
      items.push({
        type: "listing_suspended",
        title: `Annonce suspendue : ${l.title}`,
        reason: `Par ${l.user?.name || "?"}`,
        priority: "normal",
        time: l.createdAt.toISOString(),
        id: l.id,
      });
    }

    for (const m of flaggedMessages) {
      items.push({
        type: "message",
        title: `Message : ${m.subject || "Sans sujet"}`,
        reason: `De ${m.name} — ${m.email || ""}`,
        priority: "low",
        time: m.createdAt.toISOString(),
        id: m.id,
      });
    }

    const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    items.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    return NextResponse.json({ items: [], total: 0 });
  }
}
