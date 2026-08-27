"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DeliveryDriversTab from "./DeliveryDriversTab";
import ProfessionalsTab from "./ProfessionalsTab";
import RequestsTab from "./RequestsTab";
import {
  Users, FileText, Flag, BarChart3, Settings, Shield, CheckCircle, XCircle,
  Ban, AlertTriangle, Clock, Globe, Mail, Phone, ShieldCheck, Key, LogOut,
  Inbox, MessageSquare, FileSearch, Activity, Search, Building2, Wallet, Bot,
  ArrowUpRight, Calendar, MessageCircle, Loader2, RefreshCw, Power,
  Zap, AlertOctagon, CheckSquare, Eye, Crown, CreditCard, Bell, Truck,
} from "lucide-react";
import { AdminUser } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

const SUPER_ADMIN_EMAIL = "admin@jurgi.sn";

function hasPerm(admin: AdminUser | null, perm: string): boolean {
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  return admin.permissions.includes(perm);
}

const ALL_TABS = [
  { id: "dashboard", label: "Tableau de bord", icon: "BarChart3", perm: "dashboard" },
  { id: "queue", label: "À traiter", icon: "AlertTriangle", perm: "dashboard" },
  { id: "payments", label: "Paiements", icon: "CreditCard", perm: "payments" },
  { id: "users", label: "Utilisateurs", icon: "Users", perm: "users" },
  { id: "listings", label: "Annonces", icon: "FileText", perm: "listings" },
  { id: "reports", label: "Signalements", icon: "Flag", perm: "reports" },
  { id: "requests", label: "Demandes", icon: "Inbox", perm: "requests" },
  { id: "professionals", label: "Professionnels", icon: "Building2", perm: "professionals" },
  { id: "deliveryDrivers", label: "Livreurs", icon: "Truck", perm: "professionals" },
  { id: "messages", label: "Messages", icon: "MessageSquare", perm: "messages" },
  { id: "audit", label: "Journal", icon: "FileSearch", perm: "audit" },
  { id: "settings", label: "Paramètres", icon: "Settings", perm: "settings" },
  { id: "subscriptions", label: "Abonnements", icon: "Crown", perm: "finance" },
  { id: "finance", label: "Finance", icon: "Wallet", perm: "finance" },
  { id: "ai", label: "Assistant IA", icon: "Bot", perm: "ai_assistant" },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Flag: <Flag className="w-4 h-4" />,
  Inbox: <Inbox className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  FileSearch: <FileSearch className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />,
  Bot: <Bot className="w-4 h-4" />,
  Crown: <Crown className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  moderation: "Modération et confiance",
  support: "Support et opérations",
  validateur_paiement: "Validateur de paiements",
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-baobab-100 text-baobab-600",
  moderation: "bg-vertprofond-100 text-vertprofond-600",
  support: "bg-ocre-100 text-ocre-600",
  validateur_paiement: "bg-blue-100 text-blue-600",
};

/* ────── DASHBOARD ────── */
function DashboardTab({ admin }: { admin: AdminUser }) {
  const [stats, setStats] = useState({ users: 0, listings: 0, requests: 0, pendingReports: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => setStats(prev => ({ ...prev, ...d }))).catch(() => {});
    fetch("/api/admin/activity").then(r => r.json()).then(d => setActivities(d.activities || [])).catch(() => {});
    fetch("/api/admin/queue").then(r => r.json()).then(d => setQueue(d.items || [])).catch(() => {});
  }, []);

  const STAT_CARDS = [
    { label: "Utilisateurs", value: stats.users, color: "text-baobab-500", icon: <Users className="w-5 h-5" /> },
    { label: "Annonces actives", value: stats.listings, color: "text-vertprofond-500", icon: <FileText className="w-5 h-5" /> },
    { label: "Demandes", value: stats.requests, color: "text-ocre-500", icon: <Inbox className="w-5 h-5" /> },
    { label: "Signalements en attente", value: stats.pendingReports, color: "text-rougeterre-500", icon: <Flag className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-charbon-300">{s.label}</p>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {queue.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rougeterre-500" /> À traiter maintenant
          </h3>
          <div className="space-y-2">
            {queue.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-beigebrume-50 rounded-lg">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.priority === "critical" ? "bg-rougeterre-500" : item.priority === "high" ? "bg-ocre-500" : "bg-baobab-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500 truncate">{item.title}</p>
                  <p className="text-xs text-charbon-300">{item.reason}</p>
                </div>
                <span className="text-[10px] text-charbon-200 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-baobab-500" /> Activité récente
        </h3>
        {activities.length === 0 ? (
          <p className="text-sm text-charbon-300 text-center py-4">Aucune activité</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {activities.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-beigebrume-50">
                <div className="w-8 h-8 rounded-lg bg-vertbrume-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-charbon-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500 truncate">{a.label}</p>
                  <p className="text-xs text-charbon-300 truncate">{a.detail}</p>
                </div>
                <span className="text-[10px] text-charbon-200 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── QUEUE ────── */
function QueueTab({ admin }: { admin: AdminUser }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/queue").then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-charbon-500">Files à traiter</h2>
      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle className="w-10 h-10 text-vertprofond-400 mx-auto mb-2" />
          <p className="text-charbon-400 font-medium">Rien à traiter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="card p-4">
              <div className="flex items-start gap-3">
                <span className={`w-3 h-3 rounded-full shrink-0 mt-1 ${item.priority === "critical" ? "bg-rougeterre-500" : item.priority === "high" ? "bg-ocre-500" : item.priority === "normal" ? "bg-baobab-500" : "bg-charbon-200"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500">{item.title}</p>
                  <p className="text-xs text-charbon-300 mt-0.5">{item.reason}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.priority === "critical" ? "bg-rougeterre-100 text-rougeterre-600" :
                      item.priority === "high" ? "bg-ocre-100 text-ocre-600" :
                      "bg-beigebrume-100 text-charbon-400"
                    }`}>{item.priority}</span>
                    <span className="text-[10px] text-charbon-200">{item.type}</span>
                    <span className="text-[10px] text-charbon-200">{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── USERS ────── */
function UsersTab({ admin, onAction }: { admin: AdminUser; onAction?: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [resetResult, setResetResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => { setUsers(Array.isArray(d) ? d : d.users || []); setLoading(false); }).catch(() => setLoading(false));
    const interval = setInterval(() => {
      fetch("/api/users").then(r => r.json()).then(d => { setUsers(Array.isArray(d) ? d : d.users || []); }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users
    .filter(u => filter === "all" || u.accountStatus === filter)
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search));

  const handleStatus = async (userId: string, status: string) => {
    const reason = prompt("Motif de la modification de statut :");
    if (reason === null) return;
    await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId, accountStatus: status }) });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: status } : u));
    if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, `user_${status}`, "user", userId, undefined, status, reason);
    if (onAction) onAction();
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Réinitialiser le mot de passe ?")) return;
    const res = await fetch("/api/admin/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const data = await res.json();
    if (data.success) {
      const u = users.find(u => u.id === userId);
      setResetResult({ userId, password: data.newPassword, phone: u?.phone, name: u?.name });
      if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, "password_reset", "user", userId);
    }
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-semibold text-charbon-500">Utilisateurs</h2>
        <div className="flex gap-2 flex-wrap">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field text-sm w-48" />
          {["all", "active", "pending_validation", "suspended"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full font-medium ${filter === f ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
              {f === "all" ? "Tous" : f === "active" ? "Actifs" : f === "pending_validation" ? "En attente" : "Suspendus"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-charbon-300 text-center py-4">Aucun utilisateur trouvé</p>}
        {filtered.map(u => {
          const roles = JSON.parse(u.roles || "[]");
          return (
            <div key={u.id} className="card p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-charbon-500">{u.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      u.accountStatus === "active" ? "bg-vertprofond-100 text-vertprofond-600" :
                      u.accountStatus === "pending_validation" ? "bg-ocre-100 text-ocre-600" :
                      "bg-rougeterre-100 text-rougeterre-600"
                    }`}>{u.accountStatus === "active" ? "Actif" : u.accountStatus === "pending_validation" ? "En attente" : u.accountStatus}</span>
                  </div>
                  <p className="text-xs text-charbon-300">{u.email || u.phone} {u.region ? `• ${u.region}` : ""}</p>
                  <div className="flex gap-1 mt-1">
                    {roles.map((r: string) => <span key={r} className="text-[10px] bg-vertbrume-100 text-baobab-600 px-1.5 py-0.5 rounded-full">{r}</span>)}
                  </div>
                  {resetResult?.userId === u.id && (
                    <div className="mt-2 p-2 bg-ocre-50 border border-ocre-200 rounded-lg">
                      <p className="text-xs text-ocre-700">Nouveau mot de passe : <code className="font-bold">{resetResult.password}</code></p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {u.accountStatus === "pending_validation" && hasPerm(admin, "users_suspend") && (
                    <>
                      <button onClick={() => handleStatus(u.id, "active")} className="p-2 bg-vertprofond-50 text-vertprofond-500 rounded-lg hover:bg-vertprofond-100"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => handleStatus(u.id, "rejected")} className="p-2 bg-rougeterre-50 text-rougeterre-500 rounded-lg hover:bg-rougeterre-100"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                  {u.accountStatus === "active" && hasPerm(admin, "users_suspend") && (
                    <button onClick={() => handleStatus(u.id, "suspended")} className="p-2 bg-rougeterre-50 text-rougeterre-500 rounded-lg hover:bg-rougeterre-100"><Ban className="w-4 h-4" /></button>
                  )}
                  {u.accountStatus === "suspended" && hasPerm(admin, "users_suspend") && (
                    <button onClick={() => handleStatus(u.id, "active")} className="p-2 bg-vertprofond-50 text-vertprofond-500 rounded-lg hover:bg-vertprofond-100"><CheckCircle className="w-4 h-4" /></button>
                  )}
                  {hasPerm(admin, "users_manage") && (
                    <button onClick={() => handleResetPassword(u.id)} className="p-2 bg-ocre-50 text-ocre-500 rounded-lg hover:bg-ocre-100"><Key className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────── LISTINGS ────── */
function ListingsTab({ admin }: { admin: AdminUser }) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/listings?allStatuses=true").then(r => r.json()).then(d => {
      let all = d.listings || [];
      if (filter !== "all") all = all.filter((l: any) => l.status === filter);
      setListings(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  const handleStatus = async (id: string, status: string) => {
    let reason = "";
    if (status === "suspended" || status === "archived") {
      const r = prompt("Motif :");
      if (r === null) return;
      reason = r;
    }
    await fetch(`/api/listings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, `listing_${status}`, "listing", id, undefined, status, reason);
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-semibold text-charbon-500">Annonces</h2>
        <div className="flex gap-2 flex-wrap">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field text-sm w-48" />
          {["all", "active", "suspended", "expired"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full font-medium ${filter === f ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
              {f === "all" ? "Toutes" : f === "active" ? "Actives" : f === "suspended" ? "Suspendues" : "Expirées"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {listings.filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase())).map(l => (
          <div key={l.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <a href={`/marketplace/${l.id}`} target="_blank" className="text-sm font-medium text-charbon-500 hover:text-baobab-500 truncate">{l.title}</a>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  l.status === "active" ? "bg-vertprofond-100 text-vertprofond-600" :
                  l.status === "suspended" ? "bg-rougeterre-100 text-rougeterre-600" :
                  "bg-beigebrume-200 text-charbon-400"
                }`}>{l.status}</span>
              </div>
              <p className="text-xs text-charbon-300 mt-0.5">{l.user?.name || "?"} • {l.category?.name || "?"} • {l.views || 0} vues</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {hasPerm(admin, "listings_moderate") && l.status === "active" && (
                <button onClick={() => handleStatus(l.id, "suspended")} className="p-2 bg-rougeterre-50 text-rougeterre-500 rounded-lg hover:bg-rougeterre-100" title="Suspendre"><Ban className="w-4 h-4" /></button>
              )}
              {hasPerm(admin, "listings_moderate") && l.status === "suspended" && (
                <button onClick={() => handleStatus(l.id, "active")} className="p-2 bg-vertprofond-50 text-vertprofond-500 rounded-lg hover:bg-vertprofond-100" title="Réactiver"><CheckCircle className="w-4 h-4" /></button>
              )}
              {hasPerm(admin, "listings_delete") && (
                <button onClick={() => handleStatus(l.id, "archived")} className="p-2 bg-beigebrume-100 text-charbon-400 rounded-lg hover:bg-beigebrume-200" title="Archiver"><Ban className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────── REPORTS ────── */
function ReportsTab({ admin }: { admin: AdminUser }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const url = filter === "all" ? "/api/reports" : `/api/reports?status=${filter}`;
    fetch(url).then(r => r.json()).then(d => { setReports(d.reports || []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  const handleResolve = async (id: string, status: string) => {
    const reason = prompt("Motif :");
    if (reason === null) return;
    const resolution = status === "confirmed" ? "Contenu sanctionné" : "Signalement non fondé";
    await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, resolution: resolution + " — " + reason }) });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, `report_${status}`, "report", id, undefined, status, reason);
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-charbon-500">Signalements</h2>
        <div className="flex gap-2">
          {["all", "pending", "confirmed", "dismissed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full font-medium ${filter === f ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
              {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "confirmed" ? "Confirmés" : "Rejetés"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {reports.length === 0 && <p className="text-sm text-charbon-300 text-center py-4">Aucun signalement</p>}
        {reports.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${r.status === "pending" ? "bg-rougeterre-50" : "bg-vertbrume-100"}`}>
                <Flag className={`w-5 h-5 ${r.status === "pending" ? "text-rougeterre-400" : "text-vertprofond-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-charbon-500">{r.reason}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.status === "pending" ? "bg-ocre-100 text-ocre-600" : r.status === "confirmed" ? "bg-rougeterre-100 text-rougeterre-600" : "bg-vertprofond-100 text-vertprofond-600"}`}>
                    {r.status === "pending" ? "En attente" : r.status === "confirmed" ? "Confirmé" : "Rejeté"}
                  </span>
                </div>
                <p className="text-xs text-charbon-300 mt-0.5">{r.targetType === "listing" ? "Annonce" : "Utilisateur"} • Signalé par {r.reporter?.name || "Anonyme"}</p>
                {r.description && <p className="text-xs text-charbon-400 mt-1 bg-beigebrume-50 rounded-lg p-2">{r.description}</p>}
              </div>
            </div>
            {r.status === "pending" && hasPerm(admin, "reports_manage") && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-beigebrume-100">
                <button onClick={() => handleResolve(r.id, "confirmed")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100 font-medium"><Ban className="w-3 h-3" /> Confirmer</button>
                <button onClick={() => handleResolve(r.id, "dismissed")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-vertprofond-50 text-vertprofond-600 hover:bg-vertprofond-100 font-medium"><CheckCircle className="w-3 h-3" /> Rejeter</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────── AI ASSISTANT ────── */
function AiTab({ admin }: { admin: AdminUser }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetch("/api/admin/ai").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const LEVEL_CONFIG: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
    critical: { bg: "bg-rougeterre-50", border: "border-rougeterre-200", icon: <AlertOctagon className="w-5 h-5 text-rougeterre-500" />, label: "Critique" },
    warning: { bg: "bg-ocre-50", border: "border-ocre-200", icon: <AlertTriangle className="w-5 h-5 text-ocre-500" />, label: "Attention" },
    info: { bg: "bg-vertbrume-50", border: "border-vertbrume-200", icon: <ArrowUpRight className="w-5 h-5 text-baobab-500" />, label: "Info" },
    success: { bg: "bg-vertprofond-50", border: "border-vertprofond-200", icon: <CheckSquare className="w-5 h-5 text-vertprofond-500" />, label: "OK" },
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /><p className="text-sm text-charbon-300 mt-2">Analyse en cours...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-charbon-500 flex items-center gap-2"><Bot className="w-5 h-5 text-baobab-500" /> Assistant IA</h2>
        <button onClick={refresh} className="flex items-center gap-2 text-sm text-baobab-500 hover:text-baobab-600"><RefreshCw className="w-4 h-4" /> Actualiser</button>
      </div>

      {data?.insights?.length > 0 && (
        <div className="space-y-3">
          {data.insights.map((insight: any, i: number) => {
            const cfg = LEVEL_CONFIG[insight.level] || LEVEL_CONFIG.info;
            return (
              <div key={i} className={`card p-5 border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{cfg.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-charbon-500">{insight.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        insight.level === "critical" ? "bg-rougeterre-100 text-rougeterre-600" :
                        insight.level === "warning" ? "bg-ocre-100 text-ocre-600" :
                        insight.level === "success" ? "bg-vertprofond-100 text-vertprofond-600" :
                        "bg-beigebrume-100 text-charbon-400"
                      }`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-charbon-400 mt-1">{insight.detail}</p>
                    <div className="mt-2 p-2 bg-white/60 rounded-lg">
                      <p className="text-xs text-baobab-600 font-medium">Recommandation : {insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.stats && (
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 mb-3">Vue d&apos;ensemble</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-beigebrume-50 rounded-lg">
              <p className="text-[10px] text-charbon-300 uppercase">Utilisateurs</p>
              <p className="text-lg font-bold text-baobab-500">{data.stats.users?.total || 0}</p>
              <p className="text-[10px] text-charbon-200">+{data.stats.users?.thisWeek || 0} cette semaine</p>
            </div>
            <div className="p-3 bg-beigebrume-50 rounded-lg">
              <p className="text-[10px] text-charbon-300 uppercase">Annonces</p>
              <p className="text-lg font-bold text-vertprofond-500">{data.stats.listings?.active || 0} actives</p>
              <p className="text-[10px] text-charbon-200">{data.stats.listings?.suspended || 0} suspendues</p>
            </div>
            <div className="p-3 bg-beigebrume-50 rounded-lg">
              <p className="text-[10px] text-charbon-300 uppercase">Signalements</p>
              <p className="text-lg font-bold text-rougeterre-500">{data.stats.reports?.pending || 0} en attente</p>
              <p className="text-[10px] text-charbon-200">{data.stats.reports?.confirmed || 0} confirmés</p>
            </div>
            <div className="p-3 bg-beigebrume-50 rounded-lg">
              <p className="text-[10px] text-charbon-300 uppercase">Modération</p>
              <p className="text-lg font-bold text-ocre-500">{data.stats.moderation?.pendingValidations || 0} validations</p>
              <p className="text-[10px] text-charbon-200">{data.stats.requests?.total || 0} demandes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── SETTINGS + EMERGENCY ────── */
function SettingsTab({ admin }: { admin: AdminUser }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => { setSettings(d.settings || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
    setSaving(false);
    if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, "settings_update", "settings", undefined, undefined, JSON.stringify(settings));
  };

  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));

  const handleEmergency = async (command: string, value?: boolean) => {
    const label = {
      maintenance_mode: "activer/désactiver le mode maintenance",
      disable_registration: "désactiver les inscriptions",
      disable_publications: "désactiver les publications",
      suspend_all_listings: "suspendre toutes les annonces",
      reactivate_all_listings: "réactiver les annonces suspendues",
    }[command] || command;

    if (!confirm(`Confirmer : ${label} ?`)) return;
    const res = await fetch("/api/admin/emergency", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command, value, adminId: admin.id, adminEmail: admin.email }) });
    const data = await res.json();
    if (data.success) {
      setEmergencyResult(data.description);
      setTimeout(() => setEmergencyResult(null), 3000);
      if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, `emergency_${command}`, "system", undefined, undefined, data.description);
    }
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-charbon-500">Paramètres</h2>
        {hasPerm(admin, "settings") && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-baobab-500 text-white hover:bg-baobab-600 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        )}
      </div>

      {emergencyResult && (
        <div className="card p-3 bg-vertprofond-50 border border-vertprofond-200">
          <p className="text-sm text-vertprofond-600 font-medium">{emergencyResult}</p>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-charbon-500"><Globe className="w-4 h-4 text-baobab-500 inline mr-2" />Général</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-charbon-300 mb-1 block">Nom de la plateforme</label>
            <input value={settings.platform_name || ""} onChange={e => setSettings(p => ({ ...p, platform_name: e.target.value }))} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs text-charbon-300 mb-1 block">Email contact</label>
            <input value={settings.contact_email || ""} onChange={e => setSettings(p => ({ ...p, contact_email: e.target.value }))} className="input-field text-sm" />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-charbon-500"><ShieldCheck className="w-4 h-4 text-vertprofond-500 inline mr-2" />Modération</h3>
        {[
          { key: "maintenance_mode", label: "Mode maintenance" },
          { key: "new_registration_enabled", label: "Inscriptions ouvertes" },
          { key: "publications_enabled", label: "Publications activées" },
          { key: "videos_enabled", label: "Vidéos activées" },
          { key: "auto_suspend_on_report", label: "Suspension auto. sur signalement" },
          { key: "require_professional_validation", label: "Validation pro. requise" },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between py-2 border-b border-beigebrume-100 last:border-0">
            <p className="text-sm font-medium text-charbon-500">{item.label}</p>
            <button onClick={() => toggle(item.key)} className={`relative w-11 h-6 rounded-full transition-colors ${settings[item.key] === "true" ? "bg-baobab-500" : "bg-beigebrume-300"}`}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: settings[item.key] === "true" ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-charbon-500"><Zap className="w-4 h-4 text-ocre-500 inline mr-2" />Essai gratuit</h3>
        <div className="flex items-center justify-between py-2 border-b border-beigebrume-100">
          <p className="text-sm font-medium text-charbon-500">Essai gratuit activé</p>
          <button onClick={() => toggle("trial_enabled")} className={`relative w-11 h-6 rounded-full transition-colors ${settings.trial_enabled === "true" ? "bg-baobab-500" : "bg-beigebrume-300"}`}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: settings.trial_enabled === "true" ? "translateX(22px)" : "translateX(2px)" }} />
          </button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-beigebrume-100">
          <p className="text-sm font-medium text-charbon-500">Une seule fois par utilisateur</p>
          <button onClick={() => toggle("trial_one_time_only")} className={`relative w-11 h-6 rounded-full transition-colors ${settings.trial_one_time_only === "true" ? "bg-baobab-500" : "bg-beigebrume-300"}`}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: settings.trial_one_time_only === "true" ? "translateX(22px)" : "translateX(2px)" }} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-charbon-300 mb-1 block">Plan d&apos;essai</label>
            <select value={settings.trial_plan_slug || "express"} onChange={e => setSettings(p => ({ ...p, trial_plan_slug: e.target.value }))} className="input-field text-sm">
              <option value="express">Jurgi Express (7j)</option>
              <option value="pro">Jurgi Pro (30j)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-charbon-300 mb-1 block">Durée (jours)</label>
            <input type="number" value={settings.trial_duration_days || "7"} onChange={e => setSettings(p => ({ ...p, trial_duration_days: e.target.value }))} className="input-field text-sm" min="1" max="30" />
          </div>
        </div>
      </div>

      {hasPerm(admin, "settings_emergency") && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-rougeterre-600"><Zap className="w-4 h-4 inline mr-2" />Commandes d&apos;urgence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => handleEmergency("maintenance_mode", settings.maintenance_mode !== "true")} className="flex items-center gap-2 p-3 rounded-lg border border-rougeterre-200 bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100 text-sm font-medium">
              <Power className="w-4 h-4" /> {settings.maintenance_mode === "true" ? "Désactiver maintenance" : "Activer maintenance"}
            </button>
            <button onClick={() => handleEmergency("disable_registration")} className="flex items-center gap-2 p-3 rounded-lg border border-rougeterre-200 bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100 text-sm font-medium">
              <Ban className="w-4 h-4" /> Désactiver inscriptions
            </button>
            <button onClick={() => handleEmergency("disable_publications")} className="flex items-center gap-2 p-3 rounded-lg border border-rougeterre-200 bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100 text-sm font-medium">
              <Ban className="w-4 h-4" /> Désactiver publications
            </button>
            <button onClick={() => handleEmergency("suspend_all_listings")} className="flex items-center gap-2 p-3 rounded-lg border border-rougeterre-200 bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100 text-sm font-medium">
              <AlertOctagon className="w-4 h-4" /> Suspendre toutes les annonces
            </button>
            <button onClick={() => handleEmergency("reactivate_all_listings")} className="flex items-center gap-2 p-3 rounded-lg border border-vertprofond-200 bg-vertprofond-50 text-vertprofond-600 hover:bg-vertprofond-100 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Réactiver toutes les annonces
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── AUDIT ────── */
function AuditTab({ admin }: { admin: AdminUser }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit").then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-charbon-500">Journal d&apos;audit</h2>
      {logs.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-charbon-300">Aucune action enregistrée</p></div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-beigebrume-100 flex items-center justify-center shrink-0"><FileSearch className="w-4 h-4 text-charbon-300" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500">{log.action} <span className="text-charbon-300">sur</span> {log.entityType}</p>
                  <p className="text-xs text-charbon-300">{log.adminEmail} ({log.adminRole})</p>
                  {log.reason && <p className="text-xs text-charbon-400 mt-1 italic">Motif : {log.reason}</p>}
                  <p className="text-[10px] text-charbon-200 mt-1">{new Date(log.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── PAYMENTS ────── */
function PaymentsTab({ admin }: { admin: AdminUser }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "validated" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  const load = () => {
    setLoading(true);
    fetch(`/api/payments/pending?status=${filter}`)
      .then(r => r.json())
      .then(d => { setPayments(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/admin/payment-notifications")
      .then(r => r.json())
      .then(d => setNotifCount(d.pending || 0))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleValidate = async (prId: string) => {
    setProcessing(prId);
    try {
      const res = await fetch("/api/payments/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRequestId: prId, adminId: admin.id, action: "validate" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Validé ! Code: ${data.activationCode}`);
        load();
      } else {
        alert(data.error || "Erreur");
      }
    } catch { alert("Erreur réseau"); }
    setProcessing(null);
  };

  const handleReject = async (prId: string) => {
    const reason = prompt("Raison du rejet:");
    if (!reason) return;
    setProcessing(prId);
    try {
      const res = await fetch("/api/payments/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRequestId: prId, adminId: admin.id, action: "reject", rejectionReason: reason }),
      });
      if (res.ok) load();
    } catch {}
    setProcessing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-charbon-500">Paiements manuels</h2>
          <p className="text-xs text-charbon-300">{notifCount} en attente</p>
        </div>
        <div className="flex gap-2">
          {(["pending", "validated", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === s ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
              {s === "pending" ? "En attente" : s === "validated" ? "Validés" : "Rejetés"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center text-sm text-charbon-300">
          {filter === "pending" ? "Aucun paiement en attente" : "Aucun résultat"}
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(pr => (
            <div key={pr.id} className={`card p-4 ${pr.status === "pending" ? "border-l-4 border-ocre" : pr.status === "validated" ? "border-l-4 border-vertprofond" : "border-l-4 border-rougeterre"}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-beigebrume-100 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-charbon-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-charbon-500">{pr.user?.name || pr.user?.email || pr.user?.phone || "?"}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      pr.status === "pending" ? "bg-ocre-100 text-ocre-600" :
                      pr.status === "validated" ? "bg-vertprofond-100 text-vertprofond-600" :
                      "bg-rougeterre-100 text-rougeterre-600"
                    }`}>{pr.status === "pending" ? "En attente" : pr.status === "validated" ? "Validé" : "Rejeté"}</span>
                    {pr.autoValidated && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">Auto-validé</span>}
                    {pr.escalationLevel > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">Escalade L{pr.escalationLevel}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-charbon-300">
                    <span>Plan: <strong>{pr.plan?.name}</strong></span>
                    <span>{pr.amount?.toLocaleString()} {pr.currency}</span>
                    <span>{new Date(pr.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  {pr.transactionRef && <p className="text-xs text-charbon-200 mt-1">Réf: {pr.transactionRef}</p>}
                  {pr.activationCode && pr.status === "validated" && (
                    <div className="mt-2 bg-vertprofond/5 rounded-lg p-2 inline-block">
                      <span className="text-xs text-charbon-300">Code: </span>
                      <code className="text-sm font-mono font-bold text-baobab">{pr.activationCode}</code>
                    </div>
                  )}
                  {pr.rejectionReason && <p className="text-xs text-rougeterre-400 mt-1">Raison: {pr.rejectionReason}</p>}
                </div>
                {pr.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleValidate(pr.id)}
                      disabled={processing === pr.id}
                      className="px-3 py-1.5 bg-vertprofond text-white rounded-lg text-xs font-medium hover:bg-vertprofond/90 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Valider
                    </button>
                    <button
                      onClick={() => handleReject(pr.id)}
                      disabled={processing === pr.id}
                      className="px-3 py-1.5 bg-rougeterre text-white rounded-lg text-xs font-medium hover:bg-rougeterre/90 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── PROMOTIONS ────── */
function PromotionsPanel({ admin, plans }: { admin: AdminUser; plans: any[] }) {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "inactive">("all");
  const [form, setForm] = useState({
    name: "", code: "", planId: "", discountType: "fixed",
    promotionalPrice: "", startDate: "", endDate: "",
    maxTotalUses: "", maxUsesPerUser: "1",
    newUsersOnly: false, compatibleWithTrial: false,
    displayMessage: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = () => {
    fetch("/api/promotions?all=true").then(r => r.json()).then(d => { setPromos(d.promotions || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = promos.filter(p => {
    if (filter === "active") return p.status === "active" && new Date(p.endDate) >= new Date();
    if (filter === "expired") return new Date(p.endDate) < new Date();
    if (filter === "inactive") return p.status === "inactive";
    return true;
  });

  const selectedPlan = plans.find(p => p.id === form.planId);
  const maxPrice = selectedPlan?.price || 0;

  const handleCreate = async () => {
    setFormError(""); setFormSuccess("");
    if (!form.name || !form.planId || !form.startDate || !form.endDate || !form.promotionalPrice) {
      setFormError("Remplis tous les champs obligatoires"); return;
    }
    const price = parseInt(form.promotionalPrice);
    if (isNaN(price) || price < 0 || price > maxPrice) {
      setFormError(`Le prix doit être entre 0 et ${maxPrice.toLocaleString()} FCFA`); return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError("La date de fin doit être après la date de début"); return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code || null,
          planId: form.planId,
          discountType: form.discountType,
          discountValue: maxPrice - price,
          promotionalPrice: price,
          startDate: form.startDate,
          endDate: form.endDate,
          maxTotalUses: form.maxTotalUses ? parseInt(form.maxTotalUses) : null,
          maxUsesPerUser: parseInt(form.maxUsesPerUser) || 1,
          newUsersOnly: form.newUsersOnly,
          compatibleWithTrial: form.compatibleWithTrial,
          displayMessage: form.displayMessage || null,
          createdByAdminId: admin.id,
        }),
      });
      if (res.ok) {
        setFormSuccess("Promotion créée !");
        load();
        setTimeout(() => { setShowCreate(false); setFormSuccess(""); setForm({ name: "", code: "", planId: "", discountType: "fixed", promotionalPrice: "", startDate: "", endDate: "", maxTotalUses: "", maxUsesPerUser: "1", newUsersOnly: false, compatibleWithTrial: false, displayMessage: "" }); }, 1200);
      } else {
        const data = await res.json();
        setFormError(data.error || "Erreur");
      }
    } catch { setFormError("Erreur réseau"); }
    setCreating(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      load();
    } catch {}
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "active", "expired", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === f ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
              {f === "all" ? "Toutes" : f === "active" ? "Actives" : f === "expired" ? "Expirées" : "Inactives"}
              <span className="ml-1 text-[10px] opacity-70">
                ({f === "all" ? promos.length : promos.filter(p => f === "active" ? (p.status === "active" && new Date(p.endDate) >= new Date()) : f === "expired" ? new Date(p.endDate) < new Date() : p.status === "inactive").length})
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="text-xs px-4 py-2 rounded-lg font-medium bg-baobab-500 text-white hover:bg-baobab-600">
          + Nouvelle promo
        </button>
      </div>

      {formSuccess && <div className="p-3 bg-vertprofond-50 border border-vertprofond-200 rounded-xl"><p className="text-sm text-vertprofond-600">{formSuccess}</p></div>}

      {showCreate && (
        <div className="card p-5 space-y-4 border-2 border-baobab-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-charbon-500">Créer une promotion</h4>
            <button onClick={() => setShowCreate(false)} className="text-charbon-300 hover:text-charbon-500 text-xs">Annuler</button>
          </div>
          {formError && <div className="p-2 bg-rougeterre-50 border border-rougeterre-200 rounded-lg"><p className="text-xs text-rougeterre-600">{formError}</p></div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Nom *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field text-sm" placeholder="Ex: Promo Tabaski" />
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Code promo</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="input-field text-sm" placeholder="Ex: TABASKI2026" />
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Plan *</label>
              <select value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))} className="input-field text-sm">
                <option value="">— Choisir —</option>
                {plans.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()} FCFA)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Prix promo (FCFA) *</label>
              <input type="number" value={form.promotionalPrice} onChange={e => setForm(p => ({ ...p, promotionalPrice: e.target.value }))} className="input-field text-sm" placeholder={selectedPlan ? `Max: ${maxPrice}` : "Choisir un plan d'abord"} min={0} max={maxPrice} />
              {selectedPlan && form.promotionalPrice && (
                <p className="text-[10px] text-baobab-500 mt-0.5">
                  Réduction: {maxPrice > 0 ? Math.round((1 - parseInt(form.promotionalPrice || "0") / maxPrice) * 100) : 0}% (-{(maxPrice - parseInt(form.promotionalPrice || "0")).toLocaleString()} FCFA)
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Date début *</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Date fin *</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Utilisations max (total)</label>
              <input type="number" value={form.maxTotalUses} onChange={e => setForm(p => ({ ...p, maxTotalUses: e.target.value }))} className="input-field text-sm" placeholder="Illimité" min={1} />
            </div>
            <div>
              <label className="text-xs text-charbon-300 mb-1 block">Max par utilisateur</label>
              <input type="number" value={form.maxUsesPerUser} onChange={e => setForm(p => ({ ...p, maxUsesPerUser: e.target.value }))} className="input-field text-sm" min={1} />
            </div>
          </div>
          <div>
            <label className="text-xs text-charbon-300 mb-1 block">Message affiché aux utilisateurs</label>
            <input value={form.displayMessage} onChange={e => setForm(p => ({ ...p, displayMessage: e.target.value }))} className="input-field text-sm" placeholder="Ex: Offre spéciale Kaws" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.newUsersOnly} onChange={e => setForm(p => ({ ...p, newUsersOnly: e.target.checked }))} className="rounded" />
              <span className="text-xs text-charbon-500">Nouveaux utilisateurs uniquement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.compatibleWithTrial} onChange={e => setForm(p => ({ ...p, compatibleWithTrial: e.target.checked }))} className="rounded" />
              <span className="text-xs text-charbon-500">Compatible avec l'essai gratuit</span>
            </label>
          </div>
          <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 bg-baobab-500 text-white rounded-xl text-sm font-medium hover:bg-baobab-600 disabled:opacity-50">
            {creating ? "Création..." : "Créer la promotion"}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-charbon-300 text-center py-6">Aucune promotion {filter !== "all" ? `(${filter})` : ""}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const isExpired = new Date(p.endDate) < new Date();
            const usageCount = p._count?.usages || 0;
            const maxUses = p.maxTotalUses;
            const plan = plans.find(pl => pl.id === p.planId);
            const pct = maxUses ? Math.round((usageCount / maxUses) * 100) : null;

            return (
              <div key={p.id} className={`card p-4 ${isExpired ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-charbon-500">{p.name}</p>
                    {p.code && <span className="text-[10px] px-2 py-0.5 bg-baobab-50 text-baobab-600 rounded-full font-mono font-medium">{p.code}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isExpired ? "bg-beigebrume-200 text-charbon-400" :
                      p.status === "active" ? "bg-vertprofond-100 text-vertprofond-600" :
                      "bg-beigebrume-200 text-charbon-400"
                    }`}>
                      {isExpired ? "Expirée" : p.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {!isExpired && (
                    <button onClick={() => toggleStatus(p.id, p.status)} className={`text-[10px] px-3 py-1 rounded-lg font-medium ${p.status === "active" ? "bg-rougeterre-50 text-rougeterre-600 hover:bg-rougeterre-100" : "bg-vertprofond-50 text-vertprofond-600 hover:bg-vertprofond-100"}`}>
                      {p.status === "active" ? "Désactiver" : "Activer"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-charbon-300">
                  <span>{plan?.name || "?"}</span>
                  <span className="text-baobab-600 font-medium">{p.promotionalPrice.toLocaleString()} FCFA</span>
                  {plan && <span className="line-through text-charbon-200">{plan.price.toLocaleString()} FCFA</span>}
                  {plan && <span className="text-vertprofond-500">-{Math.round((1 - p.promotionalPrice / plan.price) * 100)}%</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-[10px] text-charbon-200">
                  <span>{new Date(p.startDate).toLocaleDateString("fr-FR")} → {new Date(p.endDate).toLocaleDateString("fr-FR")}</span>
                  <span>Usages: {usageCount}{maxUses ? `/${maxUses}` : ""}</span>
                  {pct !== null && (
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-beigebrume-200 rounded-full overflow-hidden">
                        <div className="h-full bg-baobab-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  )}
                  <span>Max/user: {p.maxUsesPerUser}</span>
                  {p.newUsersOnly && <span className="text-ocre-500">Nouveaux</span>}
                  {p.compatibleWithTrial && <span className="text-vertprofond-500">+Essai</span>}
                </div>
                {p.displayMessage && <p className="text-[10px] text-charbon-300 mt-1 italic">"{p.displayMessage}"</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────── SUBSCRIPTIONS ────── */
function SubscriptionsTab({ admin }: { admin: AdminUser }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscriptions" | "plans" | "promotions">("subscriptions");
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const isSuperAdmin = admin.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    fetch("/api/plans").then(r => r.json()).then(d => { setPlans(d.plans || []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/subscriptions?all=true").then(r => r.json()).then(d => { setSubs(d.subscriptions || []); }).catch(() => {});
  }, []);

  const startEdit = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      durationDays: plan.durationDays,
      maxActiveListings: plan.maxActiveListings,
      maxPhotosPerListing: plan.maxPhotosPerListing,
      maxVideosPerListing: plan.maxVideosPerListing,
      maxVideoSizeMb: plan.maxVideoSizeMb,
      autoRenew: plan.autoRenew,
      isTrialEligible: plan.isTrialEligible,
      isVisible: plan.isVisible,
      isActive: plan.isActive,
      commercialMessage: plan.commercialMessage || "",
      changeReason: "",
    });
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan.id,
          ...editForm,
          price: parseInt(editForm.price),
          durationDays: parseInt(editForm.durationDays),
          maxActiveListings: parseInt(editForm.maxActiveListings),
          maxPhotosPerListing: parseInt(editForm.maxPhotosPerListing),
          maxVideosPerListing: parseInt(editForm.maxVideosPerListing),
          maxVideoSizeMb: parseInt(editForm.maxVideoSizeMb),
          changedByAdminId: admin.id,
        }),
      });
      if (res.ok) {
        setSaveMsg("Plan mis à jour avec succès");
        if (hasPerm(admin, "audit")) logAdminAction(admin.id, admin.email, admin.role, "plan_update", "plan", editingPlan.id, JSON.stringify(editingPlan), JSON.stringify(editForm), editForm.changeReason || "Modification plan");
        fetch("/api/plans").then(r => r.json()).then(d => setPlans(d.plans || []));
        setTimeout(() => { setEditingPlan(null); setSaveMsg(""); }, 1500);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["subscriptions", "plans", "promotions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-4 py-2 rounded-lg font-medium ${tab === t ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
            {t === "subscriptions" ? "Abonnements" : t === "plans" ? "Plans" : "Promotions"}
          </button>
        ))}
      </div>

      {tab === "subscriptions" && (
        <div className="space-y-2">
          {subs.length === 0 && <p className="text-sm text-charbon-300 text-center py-4">Aucun abonnement</p>}
          {subs.map(s => (
            <div key={s.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-charbon-500">{s.user?.name || "?"}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    s.status === "active" ? "bg-vertprofond-100 text-vertprofond-600" :
                    s.status === "pending_payment" ? "bg-ocre-100 text-ocre-600" :
                    "bg-beigebrume-200 text-charbon-400"
                  }`}>{s.status}</span>
                </div>
                <p className="text-xs text-charbon-300">{s.user?.email || s.user?.phone} • {s.plan?.name} • {s.startDate ? new Date(s.startDate).toLocaleDateString("fr-FR") : "?"}</p>
                {s.endDate && <p className="text-xs text-charbon-200">Expire le {new Date(s.endDate).toLocaleDateString("fr-FR")}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-3">
          {plans.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-charbon-500">{p.name}</p>
                  <p className="text-xs text-charbon-300">{p.price.toLocaleString()} FCFA / {p.durationDays || "illimité"}j</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.isActive ? "bg-vertprofond-100 text-vertprofond-600" : "bg-beigebrume-200 text-charbon-400"}`}>
                    {p.isActive ? "Actif" : "Inactif"}
                  </span>
                  {isSuperAdmin && (
                    <button onClick={() => startEdit(p)} className="text-xs px-3 py-1.5 rounded-lg bg-baobab-50 text-baobab-600 hover:bg-baobab-100 font-medium">
                      Modifier
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-beigebrume-50 rounded-lg">
                  <p className="text-lg font-bold text-baobab-500">{p.maxActiveListings}</p>
                  <p className="text-[10px] text-charbon-300">annonces</p>
                </div>
                <div className="p-2 bg-beigebrume-50 rounded-lg">
                  <p className="text-lg font-bold text-baobab-500">{p.maxPhotosPerListing}</p>
                  <p className="text-[10px] text-charbon-300">photos</p>
                </div>
                <div className="p-2 bg-beigebrume-50 rounded-lg">
                  <p className="text-lg font-bold text-baobab-500">{p.maxVideosPerListing}</p>
                  <p className="text-[10px] text-charbon-300">vidéos</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "promotions" && (
        <PromotionsPanel admin={admin} plans={plans} />
      )}

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlan(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charbon-500">Modifier {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-charbon-300 hover:text-charbon-500"><XCircle className="w-5 h-5" /></button>
            </div>

            {saveMsg && <div className="mb-3 p-2 bg-vertprofond-50 border border-vertprofond-200 rounded-lg"><p className="text-sm text-vertprofond-600">{saveMsg}</p></div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Nom</label>
                  <input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Prix (FCFA)</label>
                  <input type="number" value={editForm.price || 0} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Durée (jours, 0 = illimité)</label>
                  <input type="number" value={editForm.durationDays || 0} onChange={e => setEditForm(p => ({ ...p, durationDays: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Max annonces actives</label>
                  <input type="number" value={editForm.maxActiveListings || 0} onChange={e => setEditForm(p => ({ ...p, maxActiveListings: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Max photos/annonce</label>
                  <input type="number" value={editForm.maxPhotosPerListing || 0} onChange={e => setEditForm(p => ({ ...p, maxPhotosPerListing: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Max vidéos/annonce</label>
                  <input type="number" value={editForm.maxVideosPerListing || 0} onChange={e => setEditForm(p => ({ ...p, maxVideosPerListing: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-charbon-300 mb-1 block">Taille max vidéo (Mo)</label>
                  <input type="number" value={editForm.maxVideoSizeMb || 0} onChange={e => setEditForm(p => ({ ...p, maxVideoSizeMb: e.target.value }))} className="input-field text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-charbon-300 mb-1 block">Description</label>
                <textarea value={editForm.description || ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="input-field text-sm" rows={2} />
              </div>

              <div>
                <label className="text-xs text-charbon-300 mb-1 block">Message commercial</label>
                <input value={editForm.commercialMessage || ""} onChange={e => setEditForm(p => ({ ...p, commercialMessage: e.target.value }))} className="input-field text-sm" />
              </div>

              <div className="space-y-2">
                {[
                  { key: "isActive", label: "Plan actif" },
                  { key: "isVisible", label: "Visible pour les utilisateurs" },
                  { key: "autoRenew", label: "Renouvellement autorisé" },
                  { key: "isTrialEligible", label: "Éligible à l'essai gratuit" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <p className="text-xs text-charbon-500">{item.label}</p>
                    <button onClick={() => setEditForm(p => ({ ...p, [item.key]: !p[item.key] }))} className={`relative w-10 h-5 rounded-full transition-colors ${editForm[item.key] ? "bg-baobab-500" : "bg-beigebrume-300"}`}>
                      <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: editForm[item.key] ? "translateX(20px)" : "translateX(2px)" }} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-charbon-300 mb-1 block">Motif du changement (obligatoire)</label>
                <input value={editForm.changeReason || ""} onChange={e => setEditForm(p => ({ ...p, changeReason: e.target.value }))} className="input-field text-sm" placeholder="Ex: ajustement prix après étude marché" />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingPlan(null)} className="flex-1 py-2 rounded-lg border border-beigebrume-200 text-sm text-charbon-400 hover:bg-beigebrume-50">Annuler</button>
                <button onClick={savePlan} disabled={saving || !editForm.changeReason} className="flex-1 py-2 rounded-lg bg-baobab-500 text-white text-sm font-medium hover:bg-baobab-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>

              <p className="text-[10px] text-charbon-300 text-center">Les abonnements déjà payés conservent les conditions originales. Seules les nouvelles souscriptions seront impactées.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── PLACEHOLDER ────── */
function PlaceholderTab({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card p-8 text-center">
      <div className="w-16 h-16 bg-beigebrume-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-charbon-200" />
      </div>
      <h3 className="font-semibold text-charbon-500 mb-2">{title}</h3>
      <p className="text-sm text-charbon-300">{desc}</p>
    </div>
  );
}

/* ────── MAIN PAGE ────── */
export default function AdminPage({ admin: serverAdmin }: { admin: { id: string; email: string; name: string; role: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<{ id: string; type: string; title: string; message: string; createdAt: string; read: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const adminId = serverAdmin.id;

  const fetchNotifications = useCallback(() => {
    fetch(`/api/admin/admin-notifications?adminId=${adminId}`)
      .then(r => r.json())
      .then(d => {
        setAdminNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }, [adminId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsSeen = () => {
    fetch("/api/admin/admin-notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    }).then(() => {
      setUnreadCount(0);
    }).catch(() => {});
  };

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [
      "dashboard","users","users_manage","users_suspend","users_delete",
      "listings","listings_moderate","listings_delete",
      "reports","reports_manage",
      "messages","messages_read_all",
      "requests","requests_manage",
      "professionals","professionals_manage",
      "settings","settings_emergency",
      "audit","audit_full",
      "ai_assistant","finance","finance_read","admin_roles",
      "subscriptions","subscriptions_view","payments","payments_validate",
    ],
    moderation: [
      "dashboard","users","users_view","listings","listings_moderate",
      "reports","reports_manage","messages","messages_reported",
      "professionals","professionals_view","audit","audit_own","ai_assistant",
    ],
    support: [
      "dashboard","users","users_support","listings",
      "reports","reports_view","messages","messages_support",
      "requests","requests_support","professionals","audit","audit_own","ai_assistant",
    ],
    validateur_paiement: [
      "dashboard","payments","payments_validate","subscriptions","subscriptions_view",
      "audit","audit_own",
    ],
  };

  const admin: AdminUser = {
    ...serverAdmin,
    role: serverAdmin.role as AdminUser["role"],
    permissions: ROLE_PERMISSIONS[serverAdmin.role] || [],
  };

  const logout = () => {
    document.cookie = "jurgi_admin_token=; path=/admin; max-age=0";
    localStorage.removeItem("jurgi_admin");
    window.location.href = "/admin/login";
  };

  const visibleTabs = ALL_TABS.filter(t => hasPerm(admin, t.perm));

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charbon-500 flex items-center gap-2">
            <Shield className="w-6 h-6 text-baobab-500" /> Administration Jurgi
          </h1>
          <p className="text-sm text-charbon-300">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[admin.role]}`}>{ROLE_LABELS[admin.role]}</span>
            <span className="ml-2">{admin.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markAsSeen(); }} className="flex items-center gap-2 text-sm text-charbon-400 hover:text-baobab-500 transition-colors relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rougeterre-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-beigebrume-200 shadow-lg z-50 py-1 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-beigebrume-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-charbon-500">Notifications</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-baobab-100 text-baobab-600 font-medium">{adminNotifications.length}</span>
                  </div>
                  {adminNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-charbon-300">Aucune notification</p>
                    </div>
                  ) : (
                    adminNotifications.slice(0, 15).map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-beigebrume-50 last:border-0 ${!n.read ? "bg-vertbrume-50/50" : ""}`}>
                        <p className="text-sm font-medium text-charbon-500">{n.title}</p>
                        <p className="text-xs text-charbon-300 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-charbon-200 mt-1">{new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-charbon-400 hover:text-rougeterre-500 transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-baobab-500 text-white" : "text-charbon-400 hover:bg-vertbrume-50"}`}>
                {TAB_ICONS[tab.icon]} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "dashboard" && <DashboardTab admin={admin} />}
          {activeTab === "queue" && <QueueTab admin={admin} />}
          {activeTab === "users" && <UsersTab admin={admin} onAction={fetchNotifications} />}
          {activeTab === "listings" && <ListingsTab admin={admin} />}
          {activeTab === "reports" && <ReportsTab admin={admin} />}
          {activeTab === "audit" && <AuditTab admin={admin} />}
          {activeTab === "settings" && <SettingsTab admin={admin} />}
          {activeTab === "subscriptions" && <SubscriptionsTab admin={admin} />}
          {activeTab === "payments" && <PaymentsTab admin={admin} />}
          {activeTab === "ai" && <AiTab admin={admin} />}
          {activeTab === "requests" && <RequestsTab />}
          {activeTab === "professionals" && <ProfessionalsTab onAction={fetchNotifications} />}
          {activeTab === "deliveryDrivers" && <DeliveryDriversTab onAction={fetchNotifications} />}
          {activeTab === "messages" && <PlaceholderTab title="Messages signalés" desc="Conversations nécessitant une intervention" />}
          {activeTab === "finance" && <PlaceholderTab title="Centre financier" desc="Paiement automatique non activé" />}
        </div>
      </div>
    </div>
  );
}
