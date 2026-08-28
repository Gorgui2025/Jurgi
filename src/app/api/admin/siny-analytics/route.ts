import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const INTENT_LABELS: Record<string, string> = {
  greeting: "Salutations",
  how_publish: "Publication / Vente",
  how_register: "Créer un compte",
  how_login: "Connexion",
  about: "À propos / Plateforme",
  contact: "Contact / Support",
  payment: "Paiement",
  plans: "Abonnements / Tarifs",
  how_video: "Vidéos",
  find_listing: "Recherche produits/animaux",
  find_vet: "Vétérinaires",
  find_transporter: "Transporteurs",
  find_livreur: "Livreurs",
  find_institution: "Institutions",
  post_request: "Poster une demande",
  fallback: "Sans réponse (fallback)",
  error: "Erreur",
};

export async function GET() {
  const totalQuestions = await prisma.secretaryLog.count().catch(() => 0);
  const conversations = await prisma.secretaryLog
    .groupBy({ by: ["sessionId"], _count: { _all: true } })
    .then((rows) => rows.length)
    .catch(() => 0);
  const unanswered = await prisma.secretaryLog
    .count({ where: { answered: false } })
    .catch(() => 0);
  const answered = totalQuestions - unanswered;

  const mostFrequent = await prisma.secretaryLog
    .groupBy({ by: ["question"], _count: { _all: true }, orderBy: { _count: { question: "desc" } }, take: 10 })
    .then((rows) => rows.map((r) => ({ question: r.question, count: r._count._all })))
    .catch(() => []);

  const byIntent = await prisma.secretaryLog
    .groupBy({ by: ["intent"], _count: { _all: true }, orderBy: { _count: { intent: "desc" } } })
    .then((rows) =>
      rows.map((r) => ({ intent: r.intent, label: INTENT_LABELS[r.intent] || r.intent, count: r._count._all }))
    )
    .catch(() => []);

  const byRegion = await prisma.secretaryLog
    .groupBy({ by: ["region"], _count: { _all: true }, orderBy: { _count: { region: "desc" } } })
    .then((rows) => rows.filter((r) => r.region).map((r) => ({ region: r.region, count: r._count._all })))
    .catch(() => []);

  const feedbackAll = await prisma.secretaryFeedback
    .aggregate({ _avg: { rating: true }, _count: { rating: true } })
    .catch(() => ({ _avg: { rating: 0 }, _count: { rating: 0 } }));
  const satisfaction = {
    average: feedbackAll._avg?.rating ? Number(feedbackAll._avg.rating.toFixed(2)) : 0,
    count: feedbackAll._count?.rating || 0,
    distribution: await prisma.secretaryFeedback
      .groupBy({ by: ["rating"], _count: { _all: true } })
      .then((rows) => rows.map((r) => ({ rating: r.rating, count: r._count._all })))
      .catch(() => []),
    comments: await prisma.secretaryFeedback
      .findMany({ where: { comment: { not: null } }, orderBy: { createdAt: "desc" }, take: 20, select: { comment: true, rating: true, createdAt: true } })
      .catch(() => []),
  };

  const recentLogs = await prisma.secretaryLog
    .findMany({ orderBy: { createdAt: "desc" }, take: 5000, select: { createdAt: true } })
    .then((rows) => rows.map((r) => r.createdAt))
    .catch(() => [] as Date[]);

  const dailyMap: Record<string, number> = {};
  const weeklyMap: Record<string, number> = {};
  recentLogs.forEach((iso) => {
    const d = iso;
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
    const start = new Date(d);
    const dow = (d.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    start.setHours(0, 0, 0, 0);
    const weekKey = start.toISOString().slice(0, 10);
    weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + 1;
  });

  const daily = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
  const weekly = Object.entries(weeklyMap)
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-8);

  return NextResponse.json({
    stats: {
      totalQuestions,
      conversations,
      answered,
      unanswered,
      satisfaction,
    },
    topQuestions: mostFrequent,
    byIntent,
    byRegion,
    daily,
    weekly,
  });
}
