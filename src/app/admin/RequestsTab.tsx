"use client";

import { useState, useEffect } from "react";
import { FileText, Search, CheckCircle, XCircle, AlertTriangle, RefreshCcw, Clock, MapPin, Phone, MessageSquare, Tag } from "lucide-react";

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  quantity: string | null;
  region: string | null;
  commune: string | null;
  urgency: string;
  status: string;
  visibility: string;
  views: number;
  createdAt: string;
  user: { id: string; name: string | null; phone: string | null; avatar: string | null };
  category: { name: string; slug: string } | null;
  _count: { responses: number };
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  closed: number;
  expired: number;
}

const URGENCY_LABELS: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgent",
  tres_urgent: "Très urgent",
  very_urgent: "Très urgent",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-ocre-100 text-ocre-600", text: "", label: "En attente" },
  active: { bg: "bg-vertbrume-100 text-vertprofond-600", text: "", label: "Active" },
  closed: { bg: "bg-charbon-100 text-charbon-500", text: "", label: "Clôturée" },
  expired: { bg: "bg-charbon-100 text-charbon-400", text: "", label: "Expirée" },
  flagged: { bg: "bg-rougeterre-100 text-rougeterre-600", text: "", label: "Signalée" },
};

export default function RequestsTab() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, closed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = () => {
    fetch("/api/admin/requests")
      .then(r => r.json())
      .then(data => {
        setRequests(data.requests || []);
        setStats(data.stats || { total: 0, pending: 0, active: 0, closed: 0, expired: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = requests.filter(r => {
    const matchSearch = !searchTerm ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchUrgency = urgencyFilter === "all" || r.urgency === urgencyFilter;
    return matchSearch && matchStatus && matchUrgency;
  });

  const handleAction = async (requestId: string, action: string) => {
    if (action === "flag" && !confirm("Signaler cette demande ? L'utilisateur sera notifié.")) return;
    await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    fetchData();
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
          <FileText className="w-5 h-5 text-baobab-500" /> Demandes d'achat
        </h2>
        <p className="text-sm text-charbon-300 mt-1">
          {stats.total} demande{stats.total !== 1 ? "s" : ""} publiée{stats.total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", count: stats.total, color: "bg-charbon-50 text-charbon-500 border-charbon-200" },
          { label: "En attente", count: stats.pending, color: "bg-ocre-50 text-ocre-600 border-ocre-200" },
          { label: "Actives", count: stats.active, color: "bg-vertbrume-50 text-vertprofond-600 border-vertprofond-200" },
          { label: "Clôturées", count: stats.closed, color: "bg-charbon-100 text-charbon-500 border-charbon-200" },
          { label: "Expirées", count: stats.expired, color: "bg-charbon-100 text-charbon-400 border-charbon-200" },
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
            placeholder="Titre, description, auteur..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="active">Active</option>
          <option value="closed">Clôturée</option>
          <option value="expired">Expirée</option>
          <option value="flagged">Signalée</option>
        </select>
        <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Toutes urgences</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="tres_urgent">Très urgent</option>
          <option value="very_urgent">Très urgent</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-charbon-50">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-charbon-300">Aucune demande trouvée</div>
          ) : filtered.map(req => {
            const badge = STATUS_BADGE[req.status] || STATUS_BADGE.active;
            const urgencyLabel = URGENCY_LABELS[req.urgency] || req.urgency;
            return (
              <div key={req.id} className="p-4 hover:bg-charbon-50/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-charbon-500 truncate">{req.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        req.urgency === "tres_urgent" || req.urgency === "very_urgent" ? "bg-rougeterre-100 text-rougeterre-600" :
                        req.urgency === "urgent" ? "bg-ocre-100 text-ocre-600" :
                        "bg-charbon-100 text-charbon-400"
                      }`}>
                        <AlertTriangle className="w-3 h-3" /> {urgencyLabel}
                      </span>
                    </div>
                    <p className="text-sm text-charbon-300 mt-1 line-clamp-1">{req.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charbon-300">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{req.user.name || "Anonyme"}{req.user.phone ? ` (${req.user.phone})` : ""}</span>
                      {(req.region || req.commune) && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{req.commune ? `${req.commune}, ` : ""}{req.region || ""}</span>
                      )}
                      {req.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{req.category.name}</span>}
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{req._count.responses} réponse{req._count.responses !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString("fr-FR")}</span>
                      {req.budget && <span className="flex items-center gap-1">Budget : {req.budget}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {req.status === "active" && (
                      <button onClick={() => handleAction(req.id, "flag")}
                        className="text-xs text-rougeterre-500 hover:text-rougeterre-600 p-1.5 rounded-lg hover:bg-rougeterre-50" title="Signaler">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {req.status === "flagged" && (
                      <button onClick={() => handleAction(req.id, "unflag")}
                        className="text-xs text-vertprofond-500 hover:text-vertprofond-600 p-1.5 rounded-lg hover:bg-vertbrume-50" title="Réactiver">
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {req.status === "active" || req.status === "flagged" ? (
                      <button onClick={() => handleAction(req.id, "close")}
                        className="text-xs text-charbon-400 hover:text-charbon-500 p-1.5 rounded-lg hover:bg-charbon-100" title="Clôturer">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    ) : req.status === "closed" ? (
                      <button onClick={() => handleAction(req.id, "reopen")}
                        className="text-xs text-vertprofond-500 hover:text-vertprofond-600 p-1.5 rounded-lg hover:bg-vertbrume-50" title="Rouvrir">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                      className="text-xs text-baobab-500 hover:text-baobab-600 p-1.5 rounded-lg hover:bg-baobab-50">
                      {expanded === req.id ? "Réduire" : "Voir"}
                    </button>
                  </div>
                </div>
                {expanded === req.id && (
                  <div className="mt-3 p-3 bg-vertbrume-50 rounded-lg text-sm text-charbon-400">
                    <p className="whitespace-pre-wrap">{req.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      {req.quantity && <span>Quantité : {req.quantity}</span>}
                      {req.budget && <span>Budget : {req.budget}</span>}
                      <span>Vues : {req.views}</span>
                      <span>Visibilité : {req.visibility}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
