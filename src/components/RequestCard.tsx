"use client";

import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";

interface RequestCardProps {
  id: string;
  title: string;
  category: string;
  location: string;
  quantity: string;
  deadline: string;
  responses: number;
  postedAt: string;
  user: string;
  urgency?: "normal" | "urgent";
}

export default function RequestCard({
  id,
  title,
  category,
  location,
  quantity,
  deadline,
  responses,
  postedAt,
  user,
  urgency = "normal",
}: RequestCardProps) {
  return (
    <Link
      href={`/demandes/${id}`}
      className="card p-4 hover:border-baobab-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">
              {category}
            </span>
            {urgency === "urgent" && (
              <span className="badge bg-rougeterre-500/10 text-rougeterre-500 text-[11px]">
                Urgent
              </span>
            )}
          </div>
          <h3 className="font-semibold text-charbon-500 text-sm line-clamp-1 group-hover:text-baobab-500 transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charbon-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {location}
            </span>
            <span>📦 {quantity}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {deadline}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-beigebrume-100">
            <span className="text-[11px] text-charbon-300">
              Par <span className="font-medium text-charbon-400">{user}</span> · {postedAt}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-baobab-500 font-medium">
              <Users className="w-3 h-3" />
              {responses} réponse{responses > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
