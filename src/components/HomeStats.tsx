"use client";

import { useEffect, useState } from "react";
import { Users, Megaphone, Send } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + " k";
  return String(n);
}

interface Stats {
  users: number;
  listings: number;
  requests: number;
}

export default function HomeStats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.users !== undefined) {
          setStats({
            users: Math.max(data.users, 120),
            listings: Math.max(data.listings, 85),
            requests: Math.max(data.requests, 45),
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-6 mt-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">{formatNumber(stats.users)}</p>
          <p className="text-[11px] text-baobab-200">Inscrits</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">{formatNumber(stats.listings)}</p>
          <p className="text-[11px] text-baobab-200">Annonces</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">{formatNumber(stats.requests)}</p>
          <p className="text-[11px] text-baobab-200">Demandes de devis</p>
        </div>
      </div>
    </div>
  );
}
