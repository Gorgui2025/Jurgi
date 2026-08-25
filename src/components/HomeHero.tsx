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
    <section className="relative text-white overflow-hidden min-h-[560px] sm:min-h-[560px] md:min-h-[580px] flex items-center">
      <div className="absolute inset-0">
        <img
          src="/manus-storage/jurgi-hero-ecosystem_b1b8d6c9.png"
          alt="Éleveur sénégalais au cœur de l'écosystème de l'élevage"
          className="w-full h-full object-cover object-[center_right]"
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 sm:pt-20 sm:pb-24 w-full">
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

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-20 group/marquee">
        <div className="flex animate-marquee group-hover/marquee:[animation-play-state:paused] gap-3 px-4 py-2">
          {[
            { src: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=240&h=160&fit=crop", alt: "Mouton" },
            { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=240&h=160&fit=crop", alt: "Chiens" },
            { src: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=240&h=160&fit=crop", alt: "Bovins" },
            { src: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=240&h=160&fit=crop", alt: "Poulets" },
            { src: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=240&h=160&fit=crop", alt: "Ovins" },
            { src: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=240&h=160&fit=crop", alt: "Lapins" },
            { src: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=240&h=160&fit=crop", alt: "Apiculture" },
            { src: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=240&h=160&fit=crop", alt: "Ferme" },
          ].map((img, i) => (
            <img
              key={`a-${i}`}
              src={img.src}
              alt={img.alt}
              className="h-16 w-28 object-cover rounded-lg shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          ))}
          {[
            { src: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=240&h=160&fit=crop", alt: "Mouton" },
            { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=240&h=160&fit=crop", alt: "Chiens" },
            { src: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=240&h=160&fit=crop", alt: "Bovins" },
            { src: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=240&h=160&fit=crop", alt: "Poulets" },
            { src: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=240&h=160&fit=crop", alt: "Ovins" },
            { src: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=240&h=160&fit=crop", alt: "Lapins" },
            { src: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=240&h=160&fit=crop", alt: "Apiculture" },
            { src: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=240&h=160&fit=crop", alt: "Ferme" },
          ].map((img, i) => (
            <img
              key={`b-${i}`}
              src={img.src}
              alt={img.alt}
              className="h-16 w-28 object-cover rounded-lg shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
