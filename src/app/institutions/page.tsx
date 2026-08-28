"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Building2,
  Phone,
  MessageCircle,
  ChevronDown,
  Filter,
  X,
  Shield,
  Clock,
  Star,
} from "lucide-react";
import OnlineBadge from "@/components/OnlineBadge";

const REGIONS = [
  "Toutes",
  "Dakar",
  "Thiès",
  "Diourbel",
  "Kaolack",
  "Fatick",
  "Louga",
  "Saint-Louis",
  "Kolda",
  "Ziguinchor",
];

const INSTITUTION_TYPES = [
  { value: "all", label: "Toutes les types" },
  { value: "ONG", label: "ONG" },
  { value: "Coopérative", label: "Coopérative" },
  { value: "Entreprise", label: "Entreprise" },
  { value: "Gouvernement", label: "Gouvernement" },
  { value: "Autre", label: "Autre" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "available", label: "Disponible" },
  { value: "busy", label: "Occupé" },
  { value: "unavailable", label: "Indisponible" },
];

const AVAILABILITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-vertprofond-100", text: "text-vertprofond-500", label: "Disponible" },
  busy: { bg: "bg-ambre-100", text: "text-ambre-500", label: "Occupé" },
  unavailable: { bg: "bg-charbon-100", text: "text-charbon-400", label: "Indisponible" },
};

const PAGE_SIZE = 12;

interface InstitutionProfile {
  id: string;
  displayName: string | null;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar: string | null;
  region: string | null;
  commune: string | null;
  zones: string;
  institutionType: string | null;
  servicesOffered: string;
  availability: string | null;
  isVerified: boolean;
  lastSeen: string | null;
  user?: { lastSeen?: string | null };
  rating: number | null;
  reviewCount: number;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseServicesOffered(services: string): string[] {
  try {
    const parsed = JSON.parse(services);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function parseZones(zones: string): string[] {
  try {
    const parsed = JSON.parse(zones);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function InstitutionsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [profiles, setProfiles] = useState<InstitutionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState("Toutes");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProfiles = async (pageNum: number, append: boolean) => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(pageNum));
    if (searchQuery) params.set("q", searchQuery);
    if (selectedRegion !== "Toutes") params.set("region", selectedRegion);
    if (selectedType !== "all") params.set("institutionType", selectedType);
    if (selectedAvailability !== "all") params.set("availability", selectedAvailability);

    try {
      const res = await fetch(`/api/institution-profiles?${params.toString()}`);
      const data = await res.json();
      const items: InstitutionProfile[] = data.profiles || [];
      const total_count: number = data.total || items.length;

      if (append) {
        setProfiles((prev) => [...prev, ...items]);
      } else {
        setProfiles(items);
      }
      setTotal(total_count);
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      if (!append) setProfiles([]);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setHasMore(true);
    fetchProfiles(1, false).then(() => setLoading(false));
  }, [searchQuery, selectedRegion, selectedType, selectedAvailability]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfiles(1, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [searchQuery, selectedRegion, selectedType, selectedAvailability]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchProfiles(nextPage, true).then(() => setLoadingMore(false));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("Toutes");
    setSelectedType("all");
    setSelectedAvailability("all");
  };

  const hasActiveFilters =
    searchQuery || selectedRegion !== "Toutes" || selectedType !== "all" || selectedAvailability !== "all";

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Annuaire des institutions</h1>
        <p className="text-sm text-charbon-300">
          Trouvez une institution près de chez vous au Sénégal
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une institution..."
            className="input-field pl-10 text-sm"
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="input-field text-sm sm:w-48"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === "Toutes" ? "Toutes les régions" : r}
            </option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="input-field text-sm sm:w-48"
        >
          {INSTITUTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-outline text-sm py-2.5 flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charbon-500">Filtres avancés</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-charbon-300 hover:text-charbon-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-charbon-400 mb-2 block">
                Type d&apos;institution
              </label>
              <div className="flex flex-wrap gap-2">
                {INSTITUTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedType === t.value
                        ? "bg-baobab-500 text-white"
                        : "bg-vertbrume-50 text-charbon-400 hover:bg-vertbrume-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-charbon-400 mb-2 block">
                Disponibilité
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setSelectedAvailability(a.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedAvailability === a.value
                        ? "bg-baobab-500 text-white"
                        : "bg-vertbrume-50 text-charbon-400 hover:bg-vertbrume-100"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-charbon-300">Filtres actifs :</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-baobab-50 text-baobab-500 px-2 py-1 rounded-full text-xs font-medium">
              &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedRegion !== "Toutes" && (
            <span className="inline-flex items-center gap-1 bg-vertbrume-100 text-charbon-500 px-2 py-1 rounded-full text-xs font-medium">
              <MapPin className="w-3 h-3" />
              {selectedRegion}
              <button onClick={() => setSelectedRegion("Toutes")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedType !== "all" && (
            <span className="inline-flex items-center gap-1 bg-vertbrume-100 text-charbon-500 px-2 py-1 rounded-full text-xs font-medium">
              <Building2 className="w-3 h-3" />
              {INSTITUTION_TYPES.find((t) => t.value === selectedType)?.label}
              <button onClick={() => setSelectedType("all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedAvailability !== "all" && (
            <span className="inline-flex items-center gap-1 bg-vertbrume-100 text-charbon-500 px-2 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              {AVAILABILITY_OPTIONS.find((a) => a.value === selectedAvailability)?.label}
              <button onClick={() => setSelectedAvailability("all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-baobab-500 hover:text-baobab-600 font-medium"
          >
            Tout effacer
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-charbon-300">
          {loading
            ? "Chargement..."
            : `${total} institution${total !== 1 ? "s" : ""} trouvée${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-charbon-300 text-sm">Recherche des institutions...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400 font-medium text-lg mb-2">Aucune institution trouvée</p>
          <p className="text-charbon-200 text-sm">
            Essayez de modifier vos filtres ou votre recherche.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-primary mt-4 text-sm inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          {profiles.map((profile) => {
            const availability = AVAILABILITY_BADGE[profile.availability || "available"];
            const services = parseServicesOffered(profile.servicesOffered);
            const zones = parseZones(profile.zones);
            const displayName = profile.displayName || profile.name || "Institution";

            return (
              <div
                key={profile.id}
                className="bg-white rounded-xl border border-beigebrume-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-baobab-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(displayName)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charbon-500 truncate">
                        {displayName}
                      </h3>
                      <OnlineBadge lastSeen={profile.user?.lastSeen || null} className="ml-1" />
                      {profile.isVerified && (
                        <span className="badge-verified text-[11px] shrink-0">
                          <Shield className="w-3 h-3" /> Vérifié
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`badge text-[11px] ${availability.bg} ${availability.text}`}
                      >
                        {availability.label}
                      </span>
                      {profile.institutionType && (
                        <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">
                          <Building2 className="w-3 h-3 mr-1 inline" />
                          {profile.institutionType}
                        </span>
                      )}
                    </div>

                    {profile.rating != null && profile.reviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= Math.round(profile.rating!)
                                  ? "text-ocre-500 fill-ocre-500"
                                  : "text-charbon-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-charbon-500">
                          {Number(profile.rating).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-charbon-300">
                          ({profile.reviewCount} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-charbon-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile.region || "Sénégal"}</span>
                  </div>
                  {zones.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-baobab-400 shrink-0" />
                      <span className="truncate">{zones.join(", ")}</span>
                    </div>
                  )}
                  {services.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Services : {services.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-beigebrume-100">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Appeler
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace(/\s/g, "").replace("+", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && hasMore && profiles.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn-outline text-sm py-2.5 px-6 inline-flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Charger plus
              </>
            )}
          </button>
        </div>
      )}

      {!loading && !hasMore && profiles.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-xs text-charbon-200">
            Toutes les institutions ont été affichées
          </p>
        </div>
      )}
    </div>
  );
}

export default function InstitutionsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container">
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-charbon-300 text-sm">Chargement...</p>
          </div>
        </div>
      }
    >
      <InstitutionsContent />
    </Suspense>
  );
}
