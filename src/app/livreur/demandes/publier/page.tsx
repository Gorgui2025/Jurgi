"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, MapPin, Package, Calendar, Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

const REGIONS = ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"];
const PRODUCT_TYPES = ["Alimentation animale", "Équipements", "Produits & accessoires", "Documents & petits colis", "Commandes fournisseur", "Petits animaux", "Autre"];
const URGENCY = [{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }, { value: "très_urgent", label: "Très urgent" }];

export default function PublierDemandeLivraisonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    pickupLocation: "",
    deliveryLocation: "",
    region: "",
    commune: "",
    productType: "",
    quantity: "",
    needHandling: false,
    scheduledDate: "",
    scheduledSlot: "",
    urgency: "normal",
    budget: "",
    description: "",
    contactMode: "phone",
  });

  if (status === "loading") {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <AlertTriangle className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Connexion requise</h2>
        <Link href="/connexion" className="btn-primary inline-flex items-center gap-2 mt-4">Se connecter</Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/delivery-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session!.user.id,
          ...form,
          budget: form.budget ? parseInt(form.budget) : null,
          scheduledDate: form.scheduledDate || null,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/livreurs"), 2000);
      }
    } catch {}
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="card p-8">
          <CheckCircle className="w-16 h-16 text-vertprofond-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-charbon-500 mb-2">Demande publiée !</h2>
          <p className="text-sm text-charbon-300 mb-4">Les livreurs de votre zone seront notifiés.</p>
          <Link href="/livreurs" className="btn-primary inline-flex items-center gap-2">Voir les livreurs <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  const canSubmit = form.pickupLocation && form.deliveryLocation && form.productType && form.region;

  return (
    <div className="page-container max-w-2xl mx-auto py-12 px-4">
      <Link href="/livreurs" className="flex items-center gap-1 text-sm text-charbon-400 hover:text-baobab-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux livreurs
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500 flex items-center gap-2">
          <Truck className="w-6 h-6 text-baobab-500" /> Demande de livraison
        </h1>
        <p className="text-sm text-charbon-300 mt-1">Décrivez votre besoin pour trouver un livreur adapté</p>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-baobab-500" /> Trajet</h3>
          <div className="space-y-3">
            <div>
              <label className="input-label">Point de départ</label>
              <input type="text" value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} placeholder="Ex: Marché Sandaga, Dakar" className="input-field" />
            </div>
            <div>
              <label className="input-label">Destination</label>
              <input type="text" value={form.deliveryLocation} onChange={e => setForm({...form, deliveryLocation: e.target.value})} placeholder="Ex: Ferme Diallo, Thiès" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Région</label>
                <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="input-field">
                  <option value="">Choisir</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Commune</label>
                <input type="text" value={form.commune} onChange={e => setForm({...form, commune: e.target.value})} placeholder="Optionnel" className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-baobab-500" /> Colis</h3>
          <div className="space-y-3">
            <div>
              <label className="input-label">Type de produit</label>
              <select value={form.productType} onChange={e => setForm({...form, productType: e.target.value})} className="input-field">
                <option value="">Choisir</option>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Quantité / volume approximatif</label>
              <input type="text" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Ex: 2 sacs de 50 kg" className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-sm text-charbon-400 cursor-pointer">
              <input type="checkbox" checked={form.needHandling} onChange={e => setForm({...form, needHandling: e.target.checked})} className="rounded border-beigebrume-200" />
              Besoin de manutention (chargement/déchargement)
            </label>
            <div>
              <label className="input-label">Description complémentaire</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Détails sur le colis, précautions..." className="input-field min-h-[80px]" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-baobab-500" /> Planification</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Date souhaitée</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="input-label">Créneau horaire</label>
                <input type="text" value={form.scheduledSlot} onChange={e => setForm({...form, scheduledSlot: e.target.value})} placeholder="Ex: 9h-12h" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Urgence</label>
                <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="input-field">
                  {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Budget indicatif (FCFA)</label>
                <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="Optionnel" className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="btn-primary w-full flex items-center justify-center gap-2">
          {submitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publication...</span> : <>Publier la demande <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
