"use client";

import { useState, useEffect } from "react";
import { Stethoscope, Truck, Building2, Search, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw, MapPin, Shield, ShieldOff } from "lucide-react";

interface ProfessionalProfile {
  id: string;
  userId: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  vehicleType?: string;
  institutionType?: string;
  zones: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  profileType: string;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  trial: number;
}

const ROLE_ICONS: Record<string, typeof Stethoscope> = {
  veterinaire: Stethoscope,
  transporteur: Truck,
  institution: Building2,
};

const ROLE_LABELS: Record<string, string> = {
  veterinaire: "Vétérinaires",
  transporteur: "Transporteurs",
  institution: "Institutions",
};

function parseZones(zones: string): string[] {
  try { const p = JSON.parse(zones); return Array.isArray(p) ? p : []; } catch { return []; }
}

function formatZone(z: unknown): string {
  if (typeof z === "string") return z;
  if (z && typeof z === "object" && "region" in z) {
    const obj = z as { region: string; commune?: string };
    return obj.commune ? `${obj.commune}, ${obj.region}` : obj.region;
  }
  return String(z);
}

export default function ProfessionalsTab({ onAction }: { onAction?: () => void }) {
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, suspended: 0, trial: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchData = () => {
    fetch("/api/admin/professionals")
      .then(r => r.json())
      .then(data => {
        setProfiles(data.profiles || []);
        setStats(data.stats || { total: 0, pending: 0, active: 0, suspended: 0, trial: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = !searchTerm ||
      (p.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchRole = roleFilter === "all" || p.profileType === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const handleAction = async (profileType: string, profileId: string, action: string) => {
    const labels: Record<string, string> = { approve: "approuver", reject: "rejeter", suspend: "suspendre", reactivate: "réactiver", verify: "vérifier", unverify: "ne plus vérifier" };
    if (action === "reject" && !confirm(`Refuser ce profil ? Le compte sera rejeté.`)) return;

    await fetch("/api/admin/professionals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileType, profileId, action }),
    });

    if (action === "reject") {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } else if (action === "approve") {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: "active", isActive: true, isVerified: true } : p));
    } else if (action === "suspend") {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: "suspended", isActive: false } : p));
    } else if (action === "reactivate") {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: "active", isActive: true } : p));
    } else if (action === "verify") {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, isVerified: true } : p));
    } else if (action === "unverify") {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, isVerified: false } : p));
    }

    if (onAction) onAction();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-charbon-100 rounded-xl" />)}
        </div>
        <div className="h-96 bg-charbon-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charbon-500 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-baobab-500" /> Gestion des Professionnels
        </h2>
        <p className="text-sm text-charbon-300 mt-1">
          {stats.total} professionnel{stats.total !== 1 ? "s" : ""} inscrit{stats.total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", count: stats.total, color: "bg-charbon-50 text-charbon-500 border-charbon-200" },
          { label: "En attente", count: stats.pending, color: "bg-ocre-50 text-ocre-600 border-ocre-200" },
          { label: "En essai", count: stats.trial, color: "bg-ocre-50 text-ocre-600 border-ocre-200" },
          { label: "Actifs", count: stats.active, color: "bg-vertbrume-50 text-vertprofond-600 border-vertprofond-200" },
          { label: "Suspendus", count: stats.suspended, color: "bg-rougeterre-50 text-rougeterre-600 border-rougeterre-200" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`p-3 rounded-xl border ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Nom, téléphone, email..." className="input-field pl-10" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tous les rôles</option>
          <option value="veterinaire">Vétérinaires</option>
          <option value="transporteur">Transporteurs</option>
          <option value="institution">Institutions</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="trial">En essai</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charbon-100">
              <th className="text-left p-3 font-medium text-charbon-400">Nom</th>
              <th className="text-left p-3 font-medium text-charbon-400">Rôle</th>
              <th className="text-left p-3 font-medium text-charbon-400">Téléphone</th>
              <th className="text-left p-3 font-medium text-charbon-400">Zones</th>
              <th className="text-left p-3 font-medium text-charbon-400">Statut</th>
              <th className="text-left p-3 font-medium text-charbon-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-charbon-300">Aucun professionnel trouvé</td></tr>
            ) : filtered.map(prof => {
              const Icon = ROLE_ICONS[prof.profileType] || Stethoscope;
              const zones = parseZones(prof.zones);
              return (
                <tr key={prof.id} className="border-b border-charbon-50 hover:bg-charbon-50/50">
                  <td className="p-3">
                    <p className="font-medium text-charbon-500">{prof.displayName || "—"}</p>
                    <p className="text-xs text-charbon-300">{prof.email || "—"}</p>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-charbon-400">
                      <Icon className="w-3.5 h-3.5 text-baobab-500" />
                      {ROLE_LABELS[prof.profileType] || prof.profileType}
                    </span>
                  </td>
                  <td className="p-3 text-charbon-400">{prof.phone || "—"}</td>
                  <td className="p-3 text-charbon-400 text-xs">
                    {zones.length > 0 ? zones.map(formatZone).join(", ") : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      prof.status === "pending" ? "bg-ocre-100 text-ocre-600" :
                      prof.status === "active" ? "bg-vertbrume-100 text-vertprofond-600" :
                      prof.status === "trial" ? "bg-ocre-100 text-ocre-600" :
                      prof.status === "suspended" ? "bg-rougeterre-100 text-rougeterre-600" :
                      "bg-charbon-100 text-charbon-500"
                    }`}>
                      {prof.status === "active" ? <CheckCircle className="w-3 h-3" /> :
                       prof.status === "trial" ? <Clock className="w-3 h-3" /> :
                       prof.status === "suspended" ? <XCircle className="w-3 h-3" /> :
                       <AlertTriangle className="w-3 h-3" />}
                      {prof.status === "pending" ? "En attente" :
                       prof.status === "trial" ? "En essai" :
                       prof.status === "active" ? "Actif" :
                       prof.status === "suspended" ? "Suspendu" : prof.status}
                    </span>
                    {prof.isVerified && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-vertbrume-100 text-baobab-600">
                        <Shield className="w-3 h-3" /> Vérifié
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {prof.status === "pending" ? (
                        <>
                          <button onClick={() => handleAction(prof.profileType, prof.id, "approve")}
                            className="text-xs text-vertprofond-500 hover:text-vertprofond-600 p-1 rounded-lg hover:bg-vertbrume-50" title="Approuver">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction(prof.profileType, prof.id, "reject")}
                            className="text-xs text-rougeterre-500 hover:text-rougeterre-600 p-1 rounded-lg hover:bg-rougeterre-50" title="Refuser">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : prof.status === "suspended" ? (
                        <button onClick={() => handleAction(prof.profileType, prof.id, "reactivate")}
                          className="text-xs text-vertprofond-500 hover:text-vertprofond-600 p-1 rounded-lg hover:bg-vertbrume-50" title="Réactiver">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : prof.status !== "inactive" ? (
                        <>
                          <button onClick={() => handleAction(prof.profileType, prof.id, "suspend")}
                            className="text-xs text-rougeterre-500 hover:text-rougeterre-600 p-1 rounded-lg hover:bg-rougeterre-50" title="Suspendre">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          {prof.isVerified ? (
                            <button onClick={() => handleAction(prof.profileType, prof.id, "unverify")}
                              className="text-xs text-charbon-400 hover:text-charbon-600 p-1 rounded-lg hover:bg-charbon-50" title="Ne plus vérifier">
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => handleAction(prof.profileType, prof.id, "verify")}
                              className="text-xs text-baobab-500 hover:text-baobab-600 p-1 rounded-lg hover:bg-vertbrume-50" title="Vérifier">
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
