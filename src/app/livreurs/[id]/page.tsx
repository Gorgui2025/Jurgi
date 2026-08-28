import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LivreurDetailClient from "./LivreurDetailClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

const PUBLIC_STATUSES = ["active", "trial"];

async function getProfile(id: string) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      bio: true,
      zones: true,
      vehicleType: true,
      availability: true,
      status: true,
      isActive: true,
      user: { select: { name: true } },
    },
  });
  return profile;
}

function isPublic(profile: { status: string; isActive: boolean } | null) {
  return !!profile && profile.isActive && PUBLIC_STATUSES.includes(profile.status);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile(params.id);
  if (!isPublic(profile)) {
    return { title: "Livreur non trouvé", robots: { index: false } };
  }

  const name = profile!.displayName || profile!.user?.name || "Livreur";
  let zones: string[] = [];
  try {
    zones = JSON.parse(profile!.zones || "[]");
  } catch {
    zones = [];
  }
  const zone = zones.length > 0 ? zones.join(", ") : "Sénégal";

  const title = `${name} — Livreur de bétail (${profile!.vehicleType}) | Jurgi`;
  const description = [
    profile!.bio?.trim() || `Livreur de bétail proposant le transport avec ${profile!.vehicleType}.`,
    `Zones desservies : ${zone}`,
  ].join(" ");

  return {
    title,
    description,
    alternates: { canonical: `/livreurs/${profile!.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE}/livreurs/${profile!.id}`,
    },
  };
}

export default async function LivreurDetailPage({ params }: Props) {
  const profile = await getProfile(params.id);
  if (!isPublic(profile)) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: profile!.displayName || profile!.user?.name || "Livreur",
            description: profile!.bio,
            areaServed: "Sénégal",
            url: `${BASE}/livreurs/${profile!.id}`,
          }),
        }}
      />
      <LivreurDetailClient />
    </>
  );
}
