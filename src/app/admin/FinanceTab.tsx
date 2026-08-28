"use client";

import { useState, useEffect } from "react";
import { Wallet, CreditCard, Crown, CheckCircle, Clock, Ban, RefreshCw, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  slug: string;
}

interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  transactionRef: string | null;
  createdAt: string;
  plan: { name: string; slug: string } | null;
  user: { name: string | null; email: string | null; phone: string | null } | null;
}

interface FinanceData {
  plans: Plan[];
  paymentRequests: PaymentRequest[];
  stats: { totalRevenue: number; validatedPayments: number; pendingPayments: number };
}

export default function FinanceTab() {
  const [data, setData] = useState<FinanceData>({ plans: [], paymentRequests: [], stats: { totalRevenue: 0, validatedPayments: 0, pendingPayments: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    fetch("/api/admin/finance")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = data.paymentRequests.filter((p) => filter === "all" || p.status === filter);

  if (loading) {
    return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-charbon-500 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-baobab-500" /> Centre financier
        </h2>
        <button onClick={load} className="flex items-center gap-2 text-sm text-baobab-500 hover:text-baobab-600">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-charbon-300">Chiffre d&apos;affaires validé</p>
            <CheckCircle className="w-5 h-5 text-vertprofond-500" />
          </div>
          <p className="text-2xl font-bold text-vertprofond-500">{data.stats.totalRevenue.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-charbon-300">Paiements validés</p>
            <Crown className="w-5 h-5 text-ocre-500" />
          </div>
          <p className="text-2xl font-bold text-ocre-500">{data.stats.validatedPayments}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-charbon-300">En attente</p>
            <Clock className="w-5 h-5 text-rougeterre-500" />
          </div>
          <p className="text-2xl font-bold text-rougeterre-500">{data.stats.pendingPayments}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-beigebrume-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-charbon-500">Plans d&apos;abonnement</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charbon-100">
              <th className="text-left p-3 font-medium text-charbon-400">Plan</th>
              <th className="text-left p-3 font-medium text-charbon-400">Prix</th>
              <th className="text-left p-3 font-medium text-charbon-400">Durée</th>
            </tr>
          </thead>
          <tbody>
            {data.plans.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-charbon-300">Aucun plan actif</td></tr>
            ) : data.plans.map((p) => (
              <tr key={p.id} className="border-b border-charbon-50">
                <td className="p-3 font-medium text-charbon-500">{p.name}</td>
                <td className="p-3 text-charbon-400">{p.price.toLocaleString("fr-FR")} {p.currency}</td>
                <td className="p-3 text-charbon-400">{p.durationDays} jours</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-beigebrume-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-charbon-500">Transactions récentes</h3>
          <div className="flex gap-2">
            {[["all", "Toutes"], ["pending", "En attente"], ["validated", "Validées"], ["rejected", "Rejetées"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className={`text-xs px-3 py-1 rounded-lg font-medium ${filter === val ? "bg-baobab-500 text-white" : "bg-beigebrume-100 text-charbon-400"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charbon-100">
              <th className="text-left p-3 font-medium text-charbon-400">Utilisateur</th>
              <th className="text-left p-3 font-medium text-charbon-400">Plan</th>
              <th className="text-left p-3 font-medium text-charbon-400">Montant</th>
              <th className="text-left p-3 font-medium text-charbon-400">Statut</th>
              <th className="text-left p-3 font-medium text-charbon-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-charbon-300">Aucune transaction</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-b border-charbon-50">
                <td className="p-3">
                  <p className="font-medium text-charbon-500">{p.user?.name || p.user?.email || p.user?.phone || "—"}</p>
                  {p.transactionRef && <p className="text-xs text-charbon-300">Réf: {p.transactionRef}</p>}
                </td>
                <td className="p-3 text-charbon-400">{p.plan?.name || "—"}</td>
                <td className="p-3 text-charbon-400">{p.amount.toLocaleString("fr-FR")} {p.currency}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "pending" ? "bg-ocre-100 text-ocre-600" :
                    p.status === "validated" ? "bg-vertprofond-100 text-vertprofond-600" :
                    "bg-rougeterre-100 text-rougeterre-600"
                  }`}>
                    {p.status === "pending" ? <Clock className="w-3 h-3" /> :
                     p.status === "validated" ? <CheckCircle className="w-3 h-3" /> :
                     <Ban className="w-3 h-3" />}
                    {p.status === "pending" ? "En attente" : p.status === "validated" ? "Validé" : "Rejeté"}
                  </span>
                </td>
                <td className="p-3 text-charbon-300">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
