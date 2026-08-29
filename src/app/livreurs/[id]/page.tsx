import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LivreurDetailClient, { type DeliveryProfile } from "./LivreurDetailClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

const PUBLIC_STATUSES = ["active", "trial"];

function parseJson(value: string | null, fallback: unknown[] = []): string[] {
  if (!value) return fallback as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback as string[];
  } catch {
    return fallback as string[];
  }
}

interface RawProfile {
  id: string;
  userId: string;
  displayName: string | null;
  photo: string | null;
  bio: string | null;
  vehicleType: string;
  vehicleCapacity: string | null;
  zones: string;
  acceptedTypes: string;
  refusedTypes: string;
  availability: string;
  hourlySchedule: string | null;
  urgentDelivery: boolean;
  weekendDelivery: boolean;
  indicativePrice: string | null;
  status: string;
  isActive: boolean;
  user: { name: string | null; isVerified: boolean; phone: string | null; whatsapp: string | null };
}

async function getRawProfile(id: string): Promise<RawProfile | null> {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      displayName: true,
      photo: true,
      bio: true,
      vehicleType: true,
      vehicleCapacity: true,
      zones: true,
      acceptedTypes: true,
      refusedTypes: true,
      availability: true,
      hourlySchedule: true,
      urgentDelivery: true,
      weekendDelivery: true,
      indicativePrice: true,
      status: true,
      isActive: true,
      user: { select: { name: true, isVerified: true, phone: true, whatsapp: true } },
    },
  });
  return profile as unknown as RawProfile | null;
}

function toDeliveryProfile(p: RawProfile): DeliveryProfile {
  const zones = parseJson(p.zones);
  return {
    id: p.id,
    userId: p.userId,
    name: p.displayName || p.user?.name || "Livreur",
    photo: p.photo,
    zone: zones[0] || "",
    vehicleType: p.vehicleType,
    availability: p.availability,
    verified: p.user?.isVerified ?? false,
    bio: p.bio || "",
    capacity: p.vehicleCapacity || "",
    zones,
    acceptedTypes: parseJson(p.acceptedTypes),
    refusedTypes: parseJson(p.refusedTypes),
    schedule: p.hourlySchedule || "",
    tariff: p.indicativePrice || "",
    urgentDelivery: p.urgentDelivery,
    weekendDelivery: p.weekendDelivery,
    phone: p.user?.phone ?? null,
    whatsapp: p.user?.whatsapp ?? null,
  };
}

function isPublic(p: { status: string; isActive: boolean } | null) {
  return !!p && p.isActive && PUBLIC_STATUSES.includes(p.status);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getRawProfile(params.id);
  if (!isPublic(profile)) {
    return { title: "Livreur non trouvé", robots: { index: false } };
  }

  const delivery = toDeliveryProfile(profile!);
  const zone = delivery.zone || delivery.zones.join(", ") || "Sénégal";
  const name = delivery.name;

  const title = `${name} — Livreur de bétail (${delivery.vehicleType}) | Jurgi`;
  const description = [
    delivery.bio.trim() || `Livreur de bétail proposant le transport avec ${delivery.vehicleType}.`,
    `Zones desservies : ${zone}`,
  ].join(" ");

  return {
    title,
    description,
    alternates: { canonical: `/livreurs/${delivery.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE}/livreurs/${delivery.id}`,
    },
  };
}

export default async function LivreurDetailPage({ params }: Props) {
  const profile = await getRawProfile(params.id);
  if (!isPublic(profile)) {
    notFound();
  }

  const delivery = toDeliveryProfile(profile!);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: delivery.name,
            description: delivery.bio,
            areaServed: "Sénégal",
            url: `${BASE}/livreurs/${delivery.id}`,
          }),
        }}
      />
      <LivreurDetailClient initialProfile={delivery} />
    </>
  );
}
