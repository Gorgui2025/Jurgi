import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import DemandDetailClient, { type RequestDetail } from "./DemandDetailClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

async function getRequest(id: string): Promise<RequestDetail> {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { listings: true } },
        },
      },
      category: { select: { name: true, slug: true } },
      _count: { select: { responses: true } },
    },
  });
  return request as unknown as RequestDetail;
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
      <DemandDetailClient initialDemand={request} />
    </>
  );
}
