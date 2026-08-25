"use client";

import Link from "next/link";
import {
  MapPin,
  Shield,
  Clock,
  BadgeCheck,
  CircleCheck,
  FileCheck,
} from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";

interface ListingCardProps {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  image?: string;
  seller: string;
  verified: boolean;
  verifiedLevel?: "phone" | "identity" | "professional";
  time: string;
  availability?: "available" | "limited" | "sold";
}

const VERIFIED_CONFIG = {
  phone: {
    label: "Numéro vérifié",
    icon: <Shield className="w-3 h-3" />,
  },
  identity: {
    label: "Identité vérifiée",
    icon: <BadgeCheck className="w-3 h-3" />,
  },
  professional: {
    label: "Professionnel vérifié",
    icon: <FileCheck className="w-3 h-3" />,
  },
};

export default function ListingCard({
  id,
  title,
  category,
  price,
  location,
  image,
  seller,
  verified,
  verifiedLevel = "phone",
  time,
  availability = "available",
}: ListingCardProps) {
  return (
    <Link
      href={`/marketplace/${id}`}
      className="card-hover group"
    >
      <div className="relative aspect-[4/3] bg-vertbrume-100 overflow-hidden">
        <ImageWithFallback
          src={image || ""}
          alt={title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <span className="badge bg-white/90 text-charbon-500 text-xs backdrop-blur-sm">
            {category}
          </span>
        </div>
        {availability === "limited" && (
          <div className="absolute top-2 right-2">
            <span className="badge bg-ambre-500/90 text-white text-[10px] backdrop-blur-sm">
              Stock limité
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-charbon-500 text-sm line-clamp-1 group-hover:text-baobab-500 transition-colors">
          {title}
        </h3>
        <p className="text-baobab-500 font-bold text-base mt-1">{price}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-charbon-300">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-charbon-200">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-beigebrume-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-vertbrume-100 flex items-center justify-center ring-1 ring-beigebrume-200">
              <span className="text-[10px] font-bold text-baobab-500">
                {seller[0]}
              </span>
            </div>
            <span className="text-xs text-charbon-400 font-medium truncate max-w-[120px]">
              {seller}
            </span>
          </div>
          {verified && (
            <span className="badge-verified text-[10px]">
              {VERIFIED_CONFIG[verifiedLevel].icon}
              {VERIFIED_CONFIG[verifiedLevel].label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
