"use client";

import { useState, useEffect } from "react";
import { Truck, Search, CheckCircle, XCircle, Clock, AlertTriangle, Eye, RotateCcw, Phone, MapPin } from "lucide-react";

interface DeliveryDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  zones: string[];
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface DeliveryRequest {
  id: string;
  pickupLocation: string;
  deliveryLocation: string;
  productType: string;
  status: string;
  urgency: string;
  budget: number | null;
  createdAt: string;
  user: { name: string; phone: string };
}

interface PlanInfo {
  price: number;
  durationDays: number;
  trialDays: number;
}

export default function DeliveryDriversTab() {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ price: 1500, durationDays: 30, trialDays: 7 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [editingPlan, setEditingPlan] = useState(false);
  const [subTab, setSubTab] = useState<"drivers" | "requests">("drivers");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/delivery-drivers").then(r => r.json()),
      fetch("/api/admin/delivery-requests").then(r => r.json()),
    ]).then(([d, r]) => {
      setDrivers(d.drivers || []);
      setRequests(r.requests || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusCounts = {
    trial: drivers.filter(d => d.status === "trial").length,
    active: drivers.filter(d => d.status === "active").length,
    expired: drivers.filter(d => d.status === "expired").length,
    inactive: drivers.filter(d => d.status === "inactive").length,
    suspended: drivers.filter(d => d.status === "suspended").length,
  };

  const filteredDrivers = drivers.filter(d => {
    const matchSearch = !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.phone?.includes(searchTerm) || (Array.isArray(d.zones) && d.zones.some((z: string) => z.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchVehicle = vehicleFilter === "all" || d.vehicleType === vehicleFilter;
    return matchSearch && matchStatus && matchVehicle;
  });

  const handleSuspend = async (driverId: string, suspend: boolean) => {
    await fetch("/api/admin/delivery-drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, action: suspend ? "suspend" : "reactivate" }),
    });
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: suspend ? "suspended" : "active", isActive: !suspend } : d));
  };

  const handleUpdatePlan = async () => {
    await fetch("/api/admin/delivery-drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_plan", planInfo }),
    });
    setEditingPlan(false);
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
          <Truck className="w-5 h-5 text-baobab-500" /> Gestion des Livreurs
        </h2>
        <p className="text-sm text-charbon-300 mt-1">
          {drivers.length} livreur{drivers.length !== 1 ? "s" : ""} inscrit{drivers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Essai", count: statusCounts.trial, color: "bg-ocre-50 text-ocre-600 border-ocre-200" },
          { label: "Actifs", count: statusCounts.active, color: "bg-vertbrume-50 text-vertprofond-600 border-vertprofond-200" },
          { label: "Expirés", count: statusCounts.expired, color: "bg-rougeterre-50 text-rougeterre-600 border-rougeterre-200" },
          { label: "Inactifs", count: statusCounts.inactive, color: "bg-charbon-50 text-charbon-500 border-charbon-200" },
          { label: "Suspendus", count: statusCounts.suspended, color: "bg-rougeterre-50 text-rougeterre-600 border-rougeterre-200" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`p-3 rounded-xl border ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-charbon-100 pb-1">
        {(["drivers", "requests"] as const).map(tab => (
          <button key={tab} onClick={() => setSubTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === tab ? "bg-baobab-500 text-white" : "text-charbon-400 hover:text-charbon-500"}`}>
            {tab === "drivers" ? `Livreurs (${drivers.length})` : `Demandes (${requests.length})`}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => setEditingPlan(!editingPlan)} className="text-xs text-baobab-500 hover:text-baobab-600 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Modifier le plan
          </button>
        </div>
      </div>

      {editingPlan && (
        <div className="card p-4 border-baobab-200">
          <h4 className="font-medium text-charbon-500 mb-3">Plan Jurgi Livreur</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-charbon-400">Prix (FCFA/mois)</label>
              <input type="number" value={planInfo.price} onChange={e => setPlanInfo({...planInfo, price: parseInt(e.target.value)})} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs text-charbon-400">Durée (jours)</label>
              <input type="number" value={planInfo.durationDays} onChange={e => setPlanInfo({...planInfo, durationDays: parseInt(e.target.value)})} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs text-charbon-400">Essai gratuit (jours)</label>
              <input type="number" value={planInfo.trialDays} onChange={e => setPlanInfo({...planInfo, trialDays: parseInt(e.target.value)})} className="input-field mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleUpdatePlan} className="btn-primary text-xs py-1.5">Enregistrer</button>
            <button onClick={() => setEditingPlan(false)} className="btn-secondary text-xs py-1.5">Annuler</button>
          </div>
        </div>
      )}

      {subTab === "drivers" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nom, téléphone, zone..." className="input-field pl-10" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Tous les statuts</option>
              <option value="trial">Essai</option>
              <option value="active">Actif</option>
              <option value="expired">Expiré</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
            <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Tous les véhicules</option>
              <option value="moto">Moto</option>
              <option value="tricycle">Tricycle</option>
              <option value="voiture">Voiture</option>
              <option value="camion">Camion</option>
              <option value="vélo">Vélo</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charbon-100">
                  <th className="text-left p-3 font-medium text-charbon-400">Nom</th>
                  <th className="text-left p-3 font-medium text-charbon-400">Téléphone</th>
                  <th className="text-left p-3 font-medium text-charbon-400">Véhicule</th>
                  <th className="text-left p-3 font-medium text-charbon-400">Zones</th>
                  <th className="text-left p-3 font-medium text-charbon-400">Statut</th>
                  <th className="text-left p-3 font-medium text-charbon-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-charbon-300">Aucun livreur trouvé</td></tr>
                ) : filteredDrivers.map(driver => (
                  <tr key={driver.id} className="border-b border-charbon-50 hover:bg-charbon-50/50">
                    <td className="p-3">
                      <p className="font-medium text-charbon-500">{driver.name}</p>
                      <p className="text-xs text-charbon-300">{driver.email}</p>
                    </td>
                    <td className="p-3 text-charbon-400">{driver.phone || "—"}</td>
                    <td className="p-3 text-charbon-400 capitalize">{driver.vehicleType || "—"}</td>
                    <td className="p-3 text-charbon-400 text-xs">{Array.isArray(driver.zones) ? driver.zones.join(", ") : "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        driver.status === "active" ? "bg-vertbrume-100 text-vertprofond-600" :
                        driver.status === "trial" ? "bg-ocre-100 text-ocre-600" :
                        driver.status === "suspended" ? "bg-rougeterre-100 text-rougeterre-600" :
                        "bg-charbon-100 text-charbon-500"
                      }`}>
                        {driver.status === "active" ? <CheckCircle className="w-3 h-3" /> :
                         driver.status === "trial" ? <Clock className="w-3 h-3" /> :
                         driver.status === "suspended" ? <XCircle className="w-3 h-3" /> :
                         <AlertTriangle className="w-3 h-3" />}
                        {driver.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {driver.status === "suspended" ? (
                          <button onClick={() => handleSuspend(driver.id, false)}
                            className="text-xs text-vertprofond-500 hover:text-vertprofond-600 p-1 rounded-lg hover:bg-vertbrume-50">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : driver.status !== "inactive" ? (
                          <button onClick={() => handleSuspend(driver.id, true)}
                            className="text-xs text-rougeterre-500 hover:text-rougeterre-600 p-1 rounded-lg hover:bg-rougeterre-50">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                        <a href={`/livreurs/${driver.id}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-baobab-500 hover:text-baobab-600 p-1 rounded-lg hover:bg-baobab-50">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {subTab === "requests" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charbon-100">
                <th className="text-left p-3 font-medium text-charbon-400">Client</th>
                <th className="text-left p-3 font-medium text-charbon-400">Trajet</th>
                <th className="text-left p-3 font-medium text-charbon-400">Type</th>
                <th className="text-left p-3 font-medium text-charbon-400">Urgence</th>
                <th className="text-left p-3 font-medium text-charbon-400">Budget</th>
                <th className="text-left p-3 font-medium text-charbon-400">Statut</th>
                <th className="text-left p-3 font-medium text-charbon-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-charbon-300">Aucune demande</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} className="border-b border-charbon-50 hover:bg-charbon-50/50">
                  <td className="p-3">
                    <p className="font-medium text-charbon-500">{req.user?.name || "—"}</p>
                    <p className="text-xs text-charbon-300 flex items-center gap-1"><Phone className="w-3 h-3" />{req.user?.phone || "—"}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-charbon-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-baobab-500" />{req.pickupLocation}</p>
                    <p className="text-charbon-300 text-xs flex items-center gap-1 ml-4">→ {req.deliveryLocation}</p>
                  </td>
                  <td className="p-3 text-charbon-400 text-xs">{req.productType}</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      req.urgency === "très_urgent" ? "bg-rougeterre-100 text-rougeterre-600" :
                      req.urgency === "urgent" ? "bg-ocre-100 text-ocre-600" :
                      "bg-charbon-100 text-charbon-500"
                    }`}>{req.urgency}</span>
                  </td>
                  <td className="p-3 text-charbon-400 text-xs">{req.budget ? `${req.budget.toLocaleString("fr-FR")} F` : "—"}</td>
                  <td className="p-3 text-xs text-charbon-400 capitalize">{req.status}</td>
                  <td className="p-3 text-xs text-charbon-300">{new Date(req.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
