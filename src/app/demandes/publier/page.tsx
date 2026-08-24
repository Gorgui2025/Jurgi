"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Camera, X, Send } from "lucide-react";

const CATEGORIES = [
  "Bovins", "Ovins", "Caprins", "Volailles", "Alimentation",
  "Équipements", "Transport", "Santé animale", "Autre",
];

const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack",
  "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis",
  "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

export default function PublierDemandePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    quantity: "",
    budget: "",
    region: "",
    commune: "",
    deadline: "",
    urgency: "normal",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => router.push("/demandes"), 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/demandes" className="text-charbon-300 hover:text-charbon-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charbon-500">Publier une demande</h1>
          <p className="text-sm text-charbon-300">
            Décrivez votre besoin et recevez des propositions
          </p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="input-label">Titre de la demande *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Recherche 10 bœufs pour engraissement"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="input-label">Description détaillée *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez votre besoin précis, les quantités, qualités attendues, conditions..."
            className="input-field min-h-[120px] resize-y"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field text-sm"
            >
              <option value="">Choisir</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Quantité souhaitée</label>
            <input
              type="text"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Ex: 10 têtes"
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Budget indicatif</label>
            <input
              type="text"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="Ex: 300 000 FCFA / tête"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="input-label">Délai souhaité</label>
            <input
              type="text"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              placeholder="Ex: 15 jours"
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Région *</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Choisir</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Commune</label>
            <input
              type="text"
              value={form.commune}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
              placeholder="Ex: Pikine"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Urgence</label>
          <div className="flex gap-3">
            {[
              { value: "normal", label: "Normal" },
              { value: "urgent", label: "Urgent" },
            ].map((u) => (
              <button
                key={u.value}
                onClick={() => setForm({ ...form, urgency: u.value })}
                className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.urgency === u.value
                    ? u.value === "urgent"
                      ? "border-rougeterre-500 bg-rougeterre-50 text-rougeterre-600"
                      : "border-baobab-500 bg-baobab-50 text-baobab-600"
                    : "border-beigebrume-200 text-charbon-400 hover:border-baobab-200"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-beigebrume-100">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-vertprofond-500" />
              </div>
              <p className="text-lg font-semibold text-charbon-500 mb-1">Demande publiée !</p>
              <p className="text-sm text-charbon-300 mb-4">Redirection vers les demandes...</p>
              <div className="w-6 h-6 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/requests", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: form.title,
                        description: form.description,
                        category: form.category || null,
                        quantity: form.quantity || null,
                        budget: form.budget || null,
                        region: form.region || null,
                        commune: form.commune || null,
                        deadline: form.deadline || null,
                        urgency: form.urgency,
                      }),
                    });
                    if (res.ok) {
                      setSubmitted(true);
                    } else {
                      const data = await res.json();
                      alert(data.error || "Erreur lors de la publication");
                    }
                  } catch {
                    alert("Erreur réseau");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="btn-primary w-full"
                disabled={submitting || !form.title || !form.description}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publication...
                  </span>
                ) : (
                  "Publier la demande"
                )}
              </button>
              <p className="text-xs text-charbon-200 text-center mt-2">
                Votre demande sera visible pendant 30 jours. Les fournisseurs correspondants recevront une notification.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
