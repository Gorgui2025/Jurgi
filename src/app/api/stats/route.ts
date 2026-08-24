import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [usersCount, listingsCount, requestsCount, pendingReportsCount] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.request.count(),
      prisma.report.count({ where: { status: "pending" } }),
    ]);

    return NextResponse.json({
      users: usersCount,
      listings: listingsCount,
      requests: requestsCount,
      pendingReports: pendingReportsCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
