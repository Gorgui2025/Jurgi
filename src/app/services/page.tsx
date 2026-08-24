"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Shield, Star, Phone, Clock, Stethoscope, Truck, Wrench, BookOpen, Search, Package, Building2 } from "lucide-react";

const SERVICE_TYPES = [
  { slug: "all", label: "Tous", icon: <Search className="w-5 h-5" /> },
  { slug: "veterinaire", label: "Vétérinaires", icon: <Stethoscope className="w-5 h-5" /> },
  { slug: "transporteur", label: "Transporteurs", icon: <Truck className="w-5 h-5" /> },
  { slug: "formateur", label: "Formateurs", icon: <BookOpen className="w-5 h-5" /> },
  { slug: "technicien", label: "Techniciens", icon: <Wrench className="w-5 h-5" /> },
  { slug: "vendeur_aliment", label: "Alimentation", icon: <Package className="w-5 h-5" /> },
  { slug: "institut", label: "Institutions", icon: <Building2 className="w-5 h-5" /> },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  veterinaire: { bg: "bg-vertprofond-100", text: "text-vertprofond-500" },
  transporteur: { bg: "bg-baobab-100", text: "text-baobab-500" },
  formateur: { bg: "bg-ocre-100", text: "text-ocre-500" },
  technicien: { bg: "bg-ambre-100", text: "text-ambre-500" },
  vendeur_aliment: { bg: "bg-rougeterre-100", text: "text-rougeterre-500" },
  institut: { bg: "bg-charbon-100", text: "text-charbon-400" },
};

interface ServiceUser {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  region: string | null;
  commune: string | null;
  zones: string;
  roles: string;
  isVerified: boolean;
  verifiedLevel: string;
  whatsapp: string | null;
  primaryRole: string;
  primaryRoleLabel: string;
  rating: number | null;
  reviewCount: number;
  _count: { listings: number };
}

export default function ServicesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [services, setServices] = useState<ServiceUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/services?role=${activeFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFilter]);

  const typeCounts = services.reduce((acc, s) => {
    acc[s.primaryRole] = (acc[s.primaryRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatZones = (zones: string) => {
    try {
      const parsed = JSON.parse(zones);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
    } catch {}
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Services professionnels</h1>
        <p className="text-sm text-charbon-300">
          Vétérinaires, techniciens, transporteurs et formateurs
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {SERVICE_TYPES.map((s) => (
          <button
            key={s.slug}
            onClick={() => { setActiveFilter(s.slug); setLoading(true); }}
            className={`card-hover p-3 flex flex-col items-center gap-2 border transition-colors ${
              activeFilter === s.slug
                ? "border-baobab-500 bg-baobab-50"
                : "border-beigebrume-200 hover:border-baobab-300"
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeFilter === s.slug
                ? "bg-baobab-500 text-white"
                : "bg-vertbrume-100 text-baobab-500"
            }`}>
              {s.icon}
            </div>
            <p className="text-xs font-semibold text-charbon-500 text-center">{s.label}</p>
          </button>
        ))}
      </div>

      {services.length === 0 ? (
        <div className="card p-12 text-center">
          <Stethoscope className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400 font-medium">Aucun professionnel trouvé</p>
          <p className="text-sm text-charbon-300 mt-1">
            Les professionnels apparaîtront ici une fois inscrits et validés
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-charbon-300 mb-4">
            {services.length} professionnel{services.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-4">
            {services.map((service) => {
              const zones = formatZones(service.zones);
              const colors = ROLE_COLORS[service.primaryRole] || ROLE_COLORS.veterinaire;

              return (
                <div key={service.id} className="card-hover p-5">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-baobab-500 flex items-center justify-center shrink-0">
                      {service.avatar ? (
                        <img src={service.avatar} alt={service.name || ""} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{getInitials(service.name)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-charbon-500">{service.name}</h3>
                            {service.isVerified && (
                              <span className="badge-verified text-[11px]">
                                <Shield className="w-3 h-3" /> Vérifié
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`badge text-[11px] ${colors.bg} ${colors.text}`}>
                              {service.primaryRoleLabel}
                            </span>
                            {service._count.listings > 0 && (
                              <span className="text-xs text-charbon-300">
                                {service._count.listings} annonce{service._count.listings > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {service.bio && (
                        <p className="text-sm text-charbon-300 mt-2 line-clamp-2">{service.bio}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-charbon-300">
                        {(service.region || service.commune) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {service.commune ? `${service.commune}, ` : ""}{service.region || "Sénégal"}
                          </span>
                        )}
                        {zones && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-baobab-400" />
                            {zones}
                          </span>
                        )}
                        {service.rating != null && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-ocre-500" />
                            {Number(service.rating).toFixed(1)} ({service.reviewCount} avis)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {service.phone && (
                          <a
                            href={`tel:${service.phone}`}
                            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Appeler
                          </a>
                        )}
                        {service.whatsapp && (
                          <a
                            href={`https://wa.me/${service.whatsapp.replace(/\s/g, "").replace("+", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                          >
                            WhatsApp
                          </a>
                        )}
                        <Link
                          href={`/profil/${service.id}`}
                          className="btn-outline text-xs py-2 px-4"
                        >
                          Voir profil
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
