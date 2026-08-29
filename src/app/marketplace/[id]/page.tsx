import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ListingDetailClient, { type Listing } from "./ListingDetailClient";

const BASE = "https://jurgi.vercel.app";

interface Props {
  params: { id: string };
}

async function getListing(id: string): Promise<Listing> {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          phone: true,
          whatsapp: true,
          isVerified: true,
          verifiedLevel: true,
          createdAt: true,
          region: true,
          phoneVisible: true,
          _count: { select: { listings: true } },
        },
      },
      category: {
        select: { name: true, slug: true, domain: true },
      },
    },
  });
  return listing as unknown as Listing;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing(params.id);
  if (!listing || listing.status !== "active") {
    return { title: "Annonce non trouvée", robots: { index: false } };
  }

  const photos = JSON.parse(listing.photos || "[]") as string[];
  const location = listing.commune ? `${listing.commune}, ${listing.region || "Sénégal"}` : listing.region || "Sénégal";
  const price =
    listing.priceOnDemand || listing.price == null
      ? "Prix à la demande"
      : `${listing.price.toLocaleString("fr-FR")} ${listing.currency || "FCFA"}`;

  const title = `${listing.title} — ${listing.price != null && !listing.priceOnDemand ? `${listing.price.toLocaleString("fr-FR")} ${listing.currency || "FCFA"}` : "Prix à la demande"} | Jurgi Sénégal`;
  const description = [
    listing.breed || listing.species ? `Espèce : ${listing.species || "n.d."}` : "Annonce d'élevage",
    location,
    price,
  ].join(" · ");

  const imageUrl = photos.length > 0 ? photos[0] : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/marketplace/${listing.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE}/marketplace/${listing.id}`,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: listing.title }] } : {}),
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListing(params.id);
  if (!listing || listing.status !== "active") {
    notFound();
  }

  const photos = JSON.parse(listing.photos || "[]") as string[];
  const location = listing.commune ? `${listing.commune}, ${listing.region || "Sénégal"}` : listing.region || "Sénégal";
  const hasPrice = listing.price != null && !listing.priceOnDemand;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    ...(listing.category?.name ? { category: listing.category.name } : {}),
    ...(listing.species ? { additionalProperty: [{ "@type": "PropertyValue", name: "Espèce", value: listing.species }] } : {}),
    ...(photos.length > 0 ? { image: photos } : {}),
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            price: listing.price as number,
            priceCurrency: "XOF",
            availability: "https://schema.org/InStock",
            url: `${BASE}/marketplace/${listing.id}`,
          },
          areaServed: location,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailClient initialListing={listing} />
    </>
  );
}
