import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, usersThisWeek, usersThisMonth,
      totalListings, activeListings, suspendedListings, expiredListings,
      totalReports, pendingReports, confirmedReports,
      totalRequests,
      pendingValidations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.count({ where: { status: "suspended" } }),
      prisma.listing.count({ where: { status: "expired" } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: "pending" } }),
      prisma.report.count({ where: { status: "confirmed" } }),
      prisma.request.count(),
      prisma.user.count({ where: { accountStatus: "pending_validation" } }),
    ]);

    const insights: { level: "info" | "warning" | "critical" | "success"; title: string; detail: string; recommendation: string }[] = [];

    if (pendingReports > 0) {
      insights.push({
        level: pendingReports > 5 ? "critical" : "warning",
        title: `${pendingReports} signalements en attente`,
        detail: `${pendingReports} signalements nécessitent une intervention. ${confirmedReports} déjà traités ce mois.`,
        recommendation: "Traiter les signalements prioritaires (utilisateurs signalés) en premier.",
      });
    }

    if (pendingValidations > 0) {
      insights.push({
        level: "warning",
        title: `${pendingValidations} comptes en attente de validation`,
        detail: `${pendingValidations} inscriptions n'ont pas encore été validées.`,
        recommendation: "Valider les comptes professionnels en priorité pour fluidifier le marché.",
      });
    }

    if (suspendedListings > 10) {
      insights.push({
        level: "warning",
        title: `${suspendedListings} annonces suspendues`,
        detail: `${suspendedListings} annonces sont actuellement suspendues et nécessitent une revue.`,
        recommendation: "Vérifier si les suspensions sont justifiées ou si des réactions sont nécessaires.",
      });
    }

    if (usersThisWeek > 20) {
      insights.push({
        level: "success",
        title: `Forte croissance cette semaine`,
        detail: `${usersThisWeek} nouveaux utilisateurs cette semaine (+${usersThisMonth} ce mois).`,
        recommendation: "Capitaliser sur la croissance avec des fonctionnalités d'onboarding améliorées.",
      });
    } else if (usersThisWeek < 5) {
      insights.push({
        level: "info",
        title: `Croissance faible cette semaine`,
        detail: `${usersThisWeek} nouveaux utilisateurs cette semaine.`,
        recommendation: "Envisager des actions marketing ciblées pour stimuler l'acquisition.",
      });
    }

    const totalModeration = pendingReports + suspendedListings + pendingValidations;
    if (totalModeration > 20) {
      insights.push({
        level: "critical",
        title: `File de modération en surcharge`,
        detail: `${totalModeration} éléments en attente de modération au total.`,
        recommendation: "Prioriser les signalements critiques et les validations de comptes professionnels.",
      });
    } else if (totalModeration === 0) {
      insights.push({
        level: "success",
        title: `Modération à jour`,
        detail: "Aucun élément en attente de modération.",
        recommendation: "Continuer à surveiller les nouveaux signalements.",
      });
    }

    if (expiredListings > activeListings * 0.3) {
      insights.push({
        level: "info",
        title: `${expiredListings} annonces expirées`,
        detail: `${expiredListings} annonces ont expiré sur ${totalListings} total.`,
        recommendation: "Notifier les vendeurs pour renouveler leurs annonces actives.",
      });
    }

    if (insights.length === 0) {
      insights.push({
        level: "success",
        title: "Système sain",
        detail: "Aucun problème majeur détecté. La plateforme fonctionne normalement.",
        recommendation: "Continuer la surveillance régulière.",
      });
    }

    return NextResponse.json({
      insights,
      stats: {
        users: { total: totalUsers, thisWeek: usersThisWeek, thisMonth: usersThisMonth },
        listings: { total: totalListings, active: activeListings, suspended: suspendedListings, expired: expiredListings },
        reports: { total: totalReports, pending: pendingReports, confirmed: confirmedReports },
        requests: { total: totalRequests },
        moderation: { pendingValidations },
      },
    });
  } catch (e) {
    return NextResponse.json({ insights: [], stats: {} });
  }
}
