import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [users, listings, requests, reports, messages] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, name: true, phone: true, email: true, roles: true, region: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.listing.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, title: true, status: true, createdAt: true, userId: true, user: { select: { name: true } }, category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.request.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, title: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.report.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, reason: true, status: true, createdAt: true, reporter: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.contactMessage.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, name: true, subject: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const activities: { id: string; type: string; label: string; detail: string; time: string }[] = [];

    for (const u of users) {
      activities.push({
        id: `u-${u.id}`,
        type: "user",
        label: "Nouvel inscrit",
        detail: `${u.name || "Anonyme"} — ${u.phone || u.email || "?"} — ${u.region || ""}`,
        time: u.createdAt.toISOString(),
      });
    }

    for (const l of listings) {
      activities.push({
        id: `l-${l.id}`,
        type: "listing",
        label: "Nouvelle annonce",
        detail: `${l.title} — ${l.user?.name || "?"} — ${l.category?.name || "?"}`,
        time: l.createdAt.toISOString(),
      });
    }

    for (const r of requests) {
      activities.push({
        id: `r-${r.id}`,
        type: "request",
        label: "Nouvelle demande",
        detail: `${r.title} — ${r.user?.name || "?"}`,
        time: r.createdAt.toISOString(),
      });
    }

    for (const rp of reports) {
      activities.push({
        id: `rp-${rp.id}`,
        type: "report",
        label: "Signalement",
        detail: `${rp.reason} — ${rp.reporter?.name || "?"} — ${rp.status}`,
        time: rp.createdAt.toISOString(),
      });
    }

    for (const m of messages) {
      activities.push({
        id: `m-${m.id}`,
        type: "message",
        label: "Message de contact",
        detail: `${m.name} — ${m.subject}`,
        time: m.createdAt.toISOString(),
      });
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch (e) {
    console.error("[ACTIVITY]", e);
    return NextResponse.json({ activities: [] });
  }
}
