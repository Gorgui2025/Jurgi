"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Shield, X, Play, SlidersHorizontal, Grid3X3, List } from "lucide-react";

const REGIONS = ["Toutes", "Dakar", "Thiès", "Diourbel", "Kaolack", "Fatick", "Louga", "Saint-Louis", "Kolda", "Ziguinchor"];

const DOMAINS_FILTER = [
  { value: "all", label: "Tous les domaines" },
  { value: "animaux", label: "Animaux" },
  { value: "alimentation", label: "Alimentation" },
  { value: "equipement", label: "Équipements" },
  { value: "sante", label: "Santé animale" },
  { value: "service", label: "Services" },
  { value: "transport", label: "Transport" },
  { value: "formation", label: "Formation" },
  { value: "debouche", label: "Débouchés" },
];

interface CategoryItem { id: string; name: string; slug: string; domain: string; }
interface ListingItem {
  id: string; title: string; price?: number | null; priceOnDemand?: boolean;
  region?: string | null; commune?: string | null; photos?: string; videos?: string;
  availability?: string; createdAt: string;
  user?: { name?: string | null; isVerified?: boolean } | null;
  category?: { name?: string | null; domain?: string | null } | null;
}

function formatPrice(price?: number | null, priceOnDemand?: boolean): string {
  if (priceOnDemand || !price) return "Prix à la demande";
  return price.toLocaleString("fr-FR") + " FCFA";
}
function parsePhotos(photos?: string): string[] {
  if (!photos) return [];
  try { return JSON.parse(photos); } catch { return []; }
}
function parseVideos(videos?: string): string[] {
  if (!videos) return [];
  try { return JSON.parse(videos); } catch { return []; }
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function CardVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => setFailed(true);
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, [src]);
  if (failed) return <div className="w-full h-full flex items-center justify-center text-charbon-200"><span className="text-3xl">📷</span></div>;
  return <video ref={videoRef} src={src} className="w-full h-full object-contain" autoPlay muted loop playsInline preload="metadata" />;
}

const PAGE_SIZE = 12;

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("Toutes");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [videoModal, setVideoModal] = useState<{ src: string; title: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  useEffect(() => {
    setSelectedCategory("all");
    const params = new URLSearchParams();
    if (selectedDomain !== "all") params.set("domain", selectedDomain);
    fetch(`/api/categories?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, [selectedDomain]);

  const fetchListings = useCallback(async (page: number, append: boolean) => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(page));
    if (selectedDomain !== "all") params.set("domain", selectedDomain);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedRegion !== "Toutes") params.set("region", selectedRegion);
    if (searchQuery) params.set("q", searchQuery);
    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      const newListings: ListingItem[] = data.listings || [];
      if (append) { setListings((prev) => [...prev, ...newListings]); }
      else { setListings(newListings); }
      setHasMore(newListings.length >= PAGE_SIZE);
    } catch { /* ignore */ }
  }, [selectedDomain, selectedCategory, selectedRegion, searchQuery]);

  useEffect(() => {
    pageRef.current = 1;
    setLoading(true);
    setHasMore(true);
    fetchListings(1, false).then(() => setLoading(false));
  }, [fetchListings]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          pageRef.current += 1;
          fetchListings(pageRef.current, true).then(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, fetchListings]);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500 mb-1">Marketplace</h1>
        <p className="text-sm text-charbon-300">Parcourez les offres d&apos;animaux, aliments, équipements et services</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-200" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher une annonce..." className="input-field pl-10 text-sm" />
        </div>
        <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="input-field text-sm sm:w-48">
          {REGIONS.map((r) => (<option key={r} value={r}>{r === "Toutes" ? "Toutes les régions" : r}</option>))}
        </select>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field text-sm sm:w-56">
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
        </select>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-outline text-sm py-2.5 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> Filtres
        </button>
        <div className="hidden sm:flex border border-beigebrume-200 rounded-xl overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-baobab-500 text-white" : "bg-white text-charbon-300 hover:bg-vertbrume-50"}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-baobab-500 text-white" : "bg-white text-charbon-300 hover:bg-vertbrume-50"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charbon-500">Filtres avancés</h3>
            <button onClick={() => setShowFilters(false)} className="text-charbon-300 hover:text-charbon-500"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAINS_FILTER.map((d) => (
              <button key={d.value} onClick={() => setSelectedDomain(d.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedDomain === d.value ? "bg-baobab-500 text-white" : "bg-vertbrume-50 text-charbon-400 hover:bg-vertbrume-100"}`}>{d.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide sm:hidden">
        {DOMAINS_FILTER.map((d) => (
          <button key={d.value} onClick={() => setSelectedDomain(d.value)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${selectedDomain === d.value ? "bg-baobab-500 text-white" : "bg-white border border-beigebrume-200 text-charbon-400"}`}>{d.label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-charbon-300">
          {loading ? "Chargement..." : `${listings.length} annonce${listings.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-charbon-300 text-sm">Chargement des annonces...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-charbon-400 mb-1">Aucune annonce trouvée</p>
          <p className="text-charbon-200 text-sm">Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3" : "flex flex-col gap-3"}>
          {listings.map((listing) => {
            const photos = parsePhotos(listing.photos);
            const videos = parseVideos(listing.videos);
            const image = photos[0] || "";
            const location = listing.commune ? `${listing.commune}, ${listing.region || "Sénégal"}` : listing.region || "Sénégal";
            return (
              <div key={listing.id} className="card-hover group flex flex-row sm:block">
                <div className="relative bg-sable-200 overflow-hidden flex items-center justify-center shrink-0 w-28 h-28 sm:w-full sm:h-auto sm:aspect-[4/3]">
                  {videos.length > 0 ? (
                    <>
                      <CardVideo src={videos[0]} />
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setVideoModal({ src: videos[0], title: listing.title }); }} className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"><Play className="w-6 h-6 text-white ml-0.5" /></span>
                      </button>
                    </>
                  ) : image ? (
                    <img src={image} alt={listing.title} className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-charbon-200"><span className="text-3xl">📷</span></div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="badge bg-white/90 text-charbon-500 text-[11px]">{listing.category?.name || ""}</span>
                    {videos.length > 0 && <span className="badge bg-charbon-500/80 text-white text-[11px] flex items-center gap-1">▶ {videos.length}</span>}
                  </div>
                </div>
                <Link href={`/marketplace/${listing.id}`} className="p-3 flex-1 block">
                  <h3 className="font-semibold text-charbon-500 text-xs line-clamp-1 group-hover:text-baobab-500 transition-colors">{listing.title}</h3>
                  <p className="text-baobab-500 font-bold text-sm mt-1">{formatPrice(listing.price, listing.priceOnDemand)}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-charbon-300 mt-1"><MapPin className="w-3 h-3" />{location}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-beigebrume-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-vertbrume-100 flex items-center justify-center"><span className="text-[9px] font-bold text-baobab-500">{(listing.user?.name || "A")[0]}</span></div>
                      <span className="text-[11px] text-charbon-400">{listing.user?.name || "Anonyme"}</span>
                      {listing.user?.isVerified && <span className="badge-verified text-[10px]"><Shield className="w-3 h-3" /> OK</span>}
                    </div>
                    <span className="text-[10px] text-charbon-200">{timeAgo(listing.createdAt)}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {videoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideoModal(null)} className="absolute -top-10 right-0 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
            <p className="text-white text-sm font-medium mb-2 truncate">{videoModal.title}</p>
            <div className="rounded-xl overflow-hidden bg-black"><video src={videoModal.src} controls playsInline autoPlay className="w-full" /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="text-center py-16"><div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-charbon-300 text-sm">Chargement...</p></div></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
