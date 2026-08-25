"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ListingCard from "@/components/ListingCard";

interface Listing {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  image: string;
  seller: string;
  verified: boolean;
  time: string;
  hasVideo?: boolean;
}

export default function HomeListings({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) return null;

  return (
    <section className="page-container pt-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Offres récentes</h2>
        <Link
          href="/marketplace"
          className="text-sm font-medium text-baobab-500 hover:text-baobab-600 flex items-center gap-1 transition-colors"
        >
          Voir plus <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            category={listing.category}
            price={listing.price}
            location={listing.location}
            image={listing.image}
            seller={listing.seller}
            verified={listing.verified}
            time={listing.time}
            hasVideo={listing.hasVideo}
          />
        ))}
      </div>
    </section>
  );
}
