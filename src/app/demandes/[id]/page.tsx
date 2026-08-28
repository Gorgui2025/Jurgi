import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import DemandDetailClient from "./DemandDetailClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

async function getRequest(id: string) {
  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      quantity: true,
      budget: true,
      region: true,
      commune: true,
      status: true,
      visibility: true,
      category: { select: { name: true } },
    },
  });
  return request;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const request = await getRequest(params.id);
  if (!request || request.status !== "active" || request.visibility !== "public") {
    return { title: "Demande non trouvée", robots: { index: false } };
  }

  const location = request.commune ? `${request.commune}, ${request.region || "Sénégal"}` : request.region || "Sénégal";
  const category = request.category?.name ?? "Élevage";

  const title = `${request.title} — Demande d'achat ${category} au Sénégal`;
  const description = [
    request.budget ? `Budget : ${request.budget}` : "Budget sur demande",
    request.quantity ? `Quantité : ${request.quantity}` : null,
    location,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title,
    description,
    alternates: { canonical: `/demandes/${request.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE}/demandes/${request.id}`,
    },
  };
}

export default async function DemandDetailPage({ params }: Props) {
  const request = await getRequest(params.id);
  if (!request || request.status !== "active" || request.visibility !== "public") {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Demand",
            name: request.title,
            description: request.description,
            category: request.category?.name ?? "Élevage",
            areaServed: request.region || "Sénégal",
            url: `${BASE}/demandes/${request.id}`,
          }),
        }}
      />
      <DemandDetailClient />
    </>
  );
}
