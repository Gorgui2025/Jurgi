import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [plans, paymentRequests, validatedAgg, pendingCount] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, price: true, currency: true, durationDays: true, slug: true },
      }),
      prisma.paymentRequest.findMany({
        include: {
          plan: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.paymentRequest.aggregate({
        where: { status: "validated" },
        _sum: { amount: true },
        _count: { amount: true },
      }),
      prisma.paymentRequest.count({ where: { status: "pending" } }),
    ]);

    const stats = {
      totalRevenue: validatedAgg._sum.amount || 0,
      validatedPayments: validatedAgg._count.amount || 0,
      pendingPayments: pendingCount,
    };

    return NextResponse.json({ plans, paymentRequests, stats });
  } catch {
    return NextResponse.json({ plans: [], paymentRequests: [], stats: { totalRevenue: 0, validatedPayments: 0, pendingPayments: 0 } });
  }
}
