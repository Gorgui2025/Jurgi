"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Truck,
  Phone,
  MessageCircle,
  ChevronDown,
  Filter,
  X,
  Shield,
  Clock,
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

const VEHICLE_TYPES = [
  { value: "all", label: "Tous les véhicules" },
  { value: "motorcycle", label: "Moto" },
  { value: "tricycle", label: "Tricycle" },
  { value: "car", label: "Voiture" },
  { value: "truck", label: "Camion" },
  { value: "bicycle", label: "Vélo" },
  { value: "foot", label: "Piéton" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "available", label: "Disponible" },
  { value: "busy", label: "Occupé" },
  { value: "unavailable", label: "Indisponible" },
];

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto",
  tricycle: "Tricycle",
  car: "Voiture",
  truck: "Camion",
  bicycle: "Vélo",
  foot: "Piéton",
};

const AVAILABILITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-vertprofond-100", text: "text-vertprofond-500", label: "Disponible" },
  busy: { bg: "bg-ambre-100", text: "text-ambre-500", label: "Occupé" },
  unavailable: { bg: "bg-charbon-100", text: "text-charbon-400", label: "Indisponible" },
};

const PAGE_SIZE = 12;

interface DeliveryDriver {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar: string | null;
  region: string | null;
  commune: string | null;
  zones: string;
  vehicleType: string | null;
  availability: string | null;
  acceptedTypes: string;
  isVerified: boolean;
  bio: string | null;
  rating: number | null;
  reviewCount: number;
  lastSeen: string | null;
  user?: { lastSeen?: string | null };
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

function parseAcceptedTypes(types: string): string[] {
  try {
    const parsed = JSON.parse(types);
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

function LivreursContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState("Toutes");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchDrivers = async (pageNum: number, append: boolean) => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(pageNum));
    if (searchQuery) params.set("q", searchQuery);
    if (selectedRegion !== "Toutes") params.set("region", selectedRegion);
    if (selectedVehicle !== "all") params.set("vehicleType", selectedVehicle);
    if (selectedAvailability !== "all") params.set("availability", selectedAvailability);

    try {
      const res = await fetch(`/api/delivery-profiles?${params.toString()}`);
      const data = await res.json();
      const items: DeliveryDriver[] = data.drivers || data.profiles || [];
      const total_count: number = data.total || items.length;

      if (append) {
        setDrivers((prev) => [...prev, ...items]);
      } else {
        setDrivers(items);
      }
      setTotal(total_count);
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      if (!append) setDrivers([]);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setHasMore(true);
    fetchDrivers(1, false).then(() => setLoading(false));
  }, [searchQuery, selectedRegion, selectedVehicle, selectedAvailability]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDrivers(1, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [searchQuery, selectedRegion, selectedVehicle, selectedAvailability]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchDrivers(nextPage, true).then(() => setLoadingMore(false));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("Toutes");
    setSelectedVehicle("all");
    setSelectedAvailability("all");
  };

  const hasActiveFilters =
    searchQuery || selectedRegion !== "Toutes" || selectedVehicle !== "all" || selectedAvailability !== "all";

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Annuaire des livreurs</h1>
        <p className="text-sm text-charbon-300">
          Trouvez un livreur près de chez vous au Sénégal
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un livreur..."
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
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="input-field text-sm sm:w-48"
        >
          {VEHICLE_TYPES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
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
                Véhicule
              </label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setSelectedVehicle(v.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedVehicle === v.value
                        ? "bg-baobab-500 text-white"
                        : "bg-vertbrume-50 text-charbon-400 hover:bg-vertbrume-100"
                    }`}
                  >
                    {v.label}
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
          {selectedVehicle !== "all" && (
            <span className="inline-flex items-center gap-1 bg-vertbrume-100 text-charbon-500 px-2 py-1 rounded-full text-xs font-medium">
              <Truck className="w-3 h-3" />
              {VEHICLE_TYPES.find((v) => v.value === selectedVehicle)?.label}
              <button onClick={() => setSelectedVehicle("all")}>
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
            : `${total} livreur${total !== 1 ? "s" : ""} trouvé${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-charbon-300 text-sm">Recherche des livreurs...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400 font-medium text-lg mb-2">Aucun livreur trouvé</p>
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
          {drivers.map((driver) => {
            const availability = AVAILABILITY_BADGE[driver.availability || "available"];
            const vehicleLabel = VEHICLE_LABELS[driver.vehicleType || "motorcycle"];
            const acceptedTypes = parseAcceptedTypes(driver.acceptedTypes);
            const zones = parseZones(driver.zones);
            const location = driver.commune
              ? `${driver.commune}, ${driver.region || "Sénégal"}`
              : driver.region || "Sénégal";

            return (
              <div
                key={driver.id}
                className="bg-white rounded-xl border border-beigebrume-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-baobab-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {driver.avatar ? (
                      <img
                        src={driver.avatar}
                        alt={driver.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(driver.name)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charbon-500 truncate">
                        {driver.name || "Livreur"}
                      </h3>
                      <OnlineBadge lastSeen={driver.user?.lastSeen || null} className="ml-1" />
                      {driver.isVerified && (
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
                      <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">
                        {vehicleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-charbon-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                  {zones.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-baobab-400 shrink-0" />
                      <span className="truncate">{zones.join(", ")}</span>
                    </div>
                  )}
                  {acceptedTypes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Accepte : {acceptedTypes.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-beigebrume-100">
                  {driver.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Appeler
                    </a>
                  )}
                  {driver.whatsapp && (
                    <a
                      href={`https://wa.me/${driver.whatsapp.replace(/\s/g, "").replace("+", "")}`}
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

      {!loading && hasMore && drivers.length > 0 && (
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

      {!loading && !hasMore && drivers.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-xs text-charbon-200">
            Tous les livreurs ont été affichés
          </p>
        </div>
      )}
    </div>
  );
}

export default function LivreursPage() {
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
      <LivreursContent />
    </Suspense>
  );
}
