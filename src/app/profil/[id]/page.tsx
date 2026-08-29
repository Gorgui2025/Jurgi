import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import SellerProfileClient, { type SellerProfile } from "./SellerProfileClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      region: true,
      commune: true,
      roles: true,
      accountStatus: true,
      isVerified: true,
      verifiedLevel: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });
  return user as (typeof user & { accountStatus: string }) | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUser(params.id);
  if (!user || user.accountStatus !== "active") {
    return { title: "Profil non trouvé", robots: { index: false } };
  }

  const location = user.commune ? `${user.commune}, ${user.region || "Sénégal"}` : user.region || "Sénégal";
  const name = user.name || "Éleveur";

  const title = `${name} — Profil éleveur ${location} | Jurgi`;
  const description = user.bio?.trim() || `Profil d'éleveur situé à ${location} sur la plateforme Jurgi (élevage au Sénégal).`;

  return {
    title,
    description,
    alternates: { canonical: `/profil/${user.id}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${BASE}/profil/${user.id}`,
    },
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const user = await getUser(params.id);
  if (!user || user.accountStatus !== "active") {
    notFound();
  }
  const profile = user as unknown as SellerProfile;
  return <SellerProfileClient initialSeller={profile} />;
}
