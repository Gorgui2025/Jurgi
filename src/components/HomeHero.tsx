"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Megaphone, Send, Users, Bell } from "lucide-react";
import Link from "next/link";
import HomeStats from "@/components/HomeStats";

export default function HomeHero({ stats }: { stats?: { users: number; listings: number; requests: number } }) {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");

  return (
    <section className="relative text-white overflow-hidden min-h-[460px] sm:min-h-[520px] md:min-h-[560px] flex items-center">
      <div className="absolute inset-0">
        <img
          src="/manus-storage/jurgi-hero-ecosystem_b1b8d6c9.png"
          alt="Éleveur sénégalais au cœur de l'écosystème de l'élevage"
          className="w-full h-full object-cover object-center sm:object-[center_right]"
          loading="eager"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(23,63,47,0.86) 0%, rgba(23,63,47,0.62) 38%, rgba(23,63,47,0.12) 76%, rgba(23,63,47,0) 100%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-28 w-full">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 text-balance">
            Tout l&apos;écosystème de l&apos;élevage, au même endroit
          </h1>
          <p className="text-base sm:text-lg text-baobab-100 mb-8 leading-relaxed">
            Animaux, aliments, équipements, vétérinaires, transporteurs et
            partenaires : trouvez ce dont vous avez besoin pour votre élevage.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
            <Link
              href="/marketplace"
              className="w-full sm:w-auto bg-white text-baobab-600 px-7 py-3.5 rounded-xl font-semibold hover:bg-sable-100 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              Acheter
            </Link>
            <Link
              href="/publier"
              className="w-full sm:w-auto bg-ocre-500 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-ocre-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Megaphone className="w-4 h-4" />
              Vendre
            </Link>
            <Link
              href="/demandes/publier"
              className="w-full sm:w-auto border-2 border-white/40 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              Publier un besoin
            </Link>
          </div>

          <div className="max-w-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (heroSearch.trim()) {
                  router.push(`/marketplace?q=${encodeURIComponent(heroSearch.trim())}`);
                } else {
                  router.push("/marketplace");
                }
              }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-300" />
              <input
                type="text"
                placeholder="Rechercher animaux, aliments, services..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full pl-12 pr-36 py-4 bg-white rounded-xl text-charbon-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-baobab-300 placeholder:text-charbon-300 shadow-lg"
                aria-label="Rechercher sur Jurgi"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-baobab-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-baobab-600 transition-colors">
                Rechercher
              </button>
            </form>
            <p className="text-xs text-baobab-200 mt-2.5 ml-1">
              Animaux · Aliments · Équipements · Services vétérinaires · Transport · Formation · Débouchés
            </p>
          </div>

          {stats && <HomeStats initial={stats} />}
        </div>
      </div>

    </section>
  );
}
