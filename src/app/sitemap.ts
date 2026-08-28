import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://jurgi.vercel.app";

const STATIC_ROUTES: { path: string; priority: number; changefreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changefreq: "daily" },
  { path: "/marketplace", priority: 0.9, changefreq: "daily" },
  { path: "/veterinaires", priority: 0.9, changefreq: "weekly" },
  { path: "/transporteurs", priority: 0.9, changefreq: "weekly" },
  { path: "/institutions", priority: 0.8, changefreq: "weekly" },
  { path: "/livreurs", priority: 0.8, changefreq: "weekly" },
  { path: "/demandes", priority: 0.8, changefreq: "daily" },
  { path: "/a-propos", priority: 0.6, changefreq: "monthly" },
  { path: "/abonnement", priority: 0.7, changefreq: "monthly" },
  { path: "/services", priority: 0.7, changefreq: "monthly" },
  { path: "/formation", priority: 0.5, changefreq: "monthly" },
  { path: "/contact", priority: 0.5, changefreq: "yearly" },
  { path: "/conditions", priority: 0.2, changefreq: "yearly" },
  { path: "/confidentialite", priority: 0.2, changefreq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changefreq,
    priority: r.priority,
  }));

  let detailEntries: MetadataRoute.Sitemap = [];

  try {
    const [listings, livreurs, requests] = await Promise.all([
      prisma.listing.findMany({ where: { status: "active" }, select: { id: true, updatedAt: true }, take: 1000 }),
      prisma.deliveryProfile.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true }, take: 500 }),
      prisma.request.findMany({ where: { status: "active", visibility: "public" }, select: { id: true, updatedAt: true }, take: 500 }),
    ]);

    detailEntries = [
      ...listings.map((l) => ({ url: `${BASE}/marketplace/${l.id}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...livreurs.map((d) => ({ url: `${BASE}/livreurs/${d.id}`, lastModified: d.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...requests.map((r) => ({ url: `${BASE}/demandes/${r.id}`, lastModified: r.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
    ];
  } catch {
    // si la DB est indisponible, on renvoie au moins le sitemap statique
  }

  return [...staticEntries, ...detailEntries];
}
