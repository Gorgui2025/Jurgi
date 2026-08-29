"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Shield,
  Edit2,
  CreditCard,
  ArrowRight,
} from "lucide-react";

interface DeliveryProfile {
  id?: string;
  userId: string;
  nom: string;
  telephone: string;
  whatsapp?: string;
  photoUrl?: string;
  presentation?: string;
  vehiculeType: string;
  capaciteTransport: string;
  zonesCouvertes: { region: string; commune: string }[];
  typesProduitsAcceptes: string[];
  typesRefuses: string[];
  disponibilite: string;
  horairesHabituels?: string;
  livraisonUrgente: boolean;
  livraisonWeekEnd: boolean;
  modeContact: string;
  tarifIndicatif?: string;
  trialEndDate?: string;
  trialStatus?: string;
}

const PRODUITS_OPTIONS = [
  "Alimentation animale",
  "Équipements",
  "Produits accessoires",
  "Documents",
  "Petits colis",
  "Commandes fournisseurs",
  "Petits animaux",
];

const VEHICULE_OPTIONS = ["Moto", "Tricycle", "Voiture", "Camion", "Vélo", "Piéton"];

const DISPONIBILITE_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "busy", label: "Occupé" },
  { value: "unavailable", label: "Indisponible" },
];

const CONTACT_OPTIONS = [
  { value: "phone", label: "Téléphone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "both", label: "Les deux" },
];

export default function LivreurProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    whatsapp: "",
    photoUrl: "",
    presentation: "",
    vehiculeType: "Moto",
    capaciteTransport: "",
    zonesCouvertes: [] as { region: string; commune: string }[],
    typesProduitsAcceptes: [] as string[],
    typesRefuses: [] as string[],
    disponibilite: "available",
    horairesHabituels: "",
    livraisonUrgente: false,
    livraisonWeekEnd: false,
    modeContact: "phone",
    tarifIndicatif: "",
  });

  const [zoneInput, setZoneInput] = useState({ region: "", commune: "" });
  const [trialInfo, setTrialInfo] = useState<{
    endDate: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfile();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  async function fetchProfile() {
    try {
      const userId = (session?.user as any)?.id || (session?.user as any)?.email;
      const res = await fetch(`/api/delivery-profiles?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const profile: DeliveryProfile = Array.isArray(data) ? data[0] : data;
        if (profile && profile.id) {
          setExistingProfileId(profile.id);
          setForm({
            nom: profile.nom || "",
            telephone: profile.telephone || "",
            whatsapp: profile.whatsapp || "",
            photoUrl: profile.photoUrl || "",
            presentation: profile.presentation || "",
            vehiculeType: profile.vehiculeType || "Moto",
            capaciteTransport: profile.capaciteTransport || "",
            zonesCouvertes: profile.zonesCouvertes || [],
            typesProduitsAcceptes: profile.typesProduitsAcceptes || [],
            typesRefuses: profile.typesRefuses || [],
            disponibilite: profile.disponibilite || "available",
            horairesHabituels: profile.horairesHabituels || "",
            livraisonUrgente: profile.livraisonUrgente || false,
            livraisonWeekEnd: profile.livraisonWeekEnd || false,
            modeContact: profile.modeContact || "phone",
            tarifIndicatif: profile.tarifIndicatif || "",
          });
          if (profile.trialEndDate) {
            const now = new Date();
            const trialEnd = new Date(profile.trialEndDate);
            const trialStatus = profile.trialStatus || (trialEnd > now ? "essai" : "expiré");
            setTrialInfo({ endDate: profile.trialEndDate, status: trialStatus });
          }
        }
      }
    } catch {
      // Profile not found — show create form
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function toggleProduit(produit: string, field: "typesProduitsAcceptes" | "typesRefuses") {
    setForm((prev) => {
      const list = prev[field];
      const updated = list.includes(produit)
        ? list.filter((p) => p !== produit)
        : [...list, produit];
      return { ...prev, [field]: updated };
    });
  }

  function addZone() {
    if (zoneInput.region.trim() && zoneInput.commune.trim()) {
      setForm((prev) => ({
        ...prev,
        zonesCouvertes: [
          ...prev.zonesCouvertes,
          { region: zoneInput.region.trim(), commune: zoneInput.commune.trim() },
        ],
      }));
      setZoneInput({ region: "", commune: "" });
    }
  }

  function removeZone(index: number) {
    setForm((prev) => ({
      ...prev,
      zonesCouvertes: prev.zonesCouvertes.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.telephone.trim()) {
      setErrorMessage("Le numéro de téléphone est obligatoire.");
      return;
    }
    if (form.zonesCouvertes.length === 0) {
      setErrorMessage("Veuillez renseigner au moins une zone couverte (région et commune). Pour cela, ajoutez une zone avec le bouton « + Ajouter ».");
      return;
    }

    setSaving(true);

    try {
      const userId = (session?.user as any)?.id || (session?.user as any)?.email;
      const payload = { ...form, userId };

      const url = existingProfileId
        ? `/api/delivery-profiles/${existingProfileId}`
        : "/api/delivery-profiles";
      const method = existingProfileId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur lors de la sauvegarde");
      }

      const saved = await res.json();
      if (saved.id && !existingProfileId) {
        setExistingProfileId(saved.id);
      }

      if (saved.trialEndDate) {
        const now = new Date();
        const trialEnd = new Date(saved.trialEndDate);
        const ts = saved.trialStatus || (trialEnd > now ? "essai" : "expiré");
        setTrialInfo({ endDate: saved.trialEndDate, status: ts });
      }

      setSuccessMessage(existingProfileId ? "Profil mis à jour !" : "Profil créé avec succès !");
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 card text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Connexion requise</h2>
        <p className="text-gray-600 mb-6">
          Vous devez être connecté pour gérer votre profil de livreur.
        </p>
        <button
          onClick={() => router.push("/auth/signin")}
          className="btn-primary"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        {existingProfileId ? (
          <Edit2 className="w-7 h-7 text-primary" />
        ) : (
          <Truck className="w-7 h-7 text-primary" />
        )}
        <h1 className="text-2xl font-bold">
          {existingProfileId ? "Modifier mon profil livreur" : "Créer mon profil livreur"}
        </h1>
      </div>

      {trialInfo && (
        <div className="card mb-6 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Statut du compte</span>
          </div>
          <p className="text-sm text-gray-600">
            Fin d&apos;essai :{" "}
            <span className="font-medium">
              {new Date(trialInfo.endDate).toLocaleDateString("fr-FR")}
            </span>
          </p>
          <span
            className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded ${
              trialInfo.status === "pending"
                ? "bg-ocre-100 text-ocre-800"
                : trialInfo.status === "essai"
                ? "bg-yellow-100 text-yellow-800"
                : trialInfo.status === "actif"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {trialInfo.status === "pending"
              ? "En attente de validation"
              : trialInfo.status === "essai"
              ? "Essai"
              : trialInfo.status === "actif"
              ? "Actif"
              : "Expiré"}
          </span>
          <a href="/livreur/payer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-baobab-500 hover:text-baobab-600">
            <CreditCard className="w-4 h-4" /> Payer l&apos;abonnement <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations personnelles */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom / nom commercial *</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.nom}
                onChange={(e) => updateField("nom", e.target.value)}
                required
                placeholder="Ex: Express Delivery Kinsasha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone *</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.telephone}
                onChange={(e) => updateField("telephone", e.target.value)}
                required
                placeholder="+243 ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp (optionnel)</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="+243 ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo URL (Cloudinary)</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.photoUrl}
                onChange={(e) => updateField("photoUrl", e.target.value)}
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Présentation</label>
            <textarea
              className="input-field w-full"
              rows={3}
              value={form.presentation}
              onChange={(e) => updateField("presentation", e.target.value)}
              placeholder="Décrivez brièvement votre activité de livraison..."
            />
          </div>
        </section>

        {/* Véhicule & Capacité */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Véhicule & Capacité
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de véhicule *</label>
              <select
                className="input-field w-full"
                value={form.vehiculeType}
                onChange={(e) => updateField("vehiculeType", e.target.value)}
                required
              >
                {VEHICULE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacité de transport *</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.capaciteTransport}
                onChange={(e) => updateField("capaciteTransport", e.target.value)}
                required
                placeholder="Ex: 200 kg, 3 sacs, 1 palette"
              />
            </div>
          </div>
        </section>

        {/* Zones couvertes */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Zones couvertes *
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              className="input-field flex-1"
              value={zoneInput.region}
              onChange={(e) => setZoneInput((p) => ({ ...p, region: e.target.value }))}
              placeholder="Région"
            />
            <input
              type="text"
              className="input-field flex-1"
              value={zoneInput.commune}
              onChange={(e) => setZoneInput((p) => ({ ...p, commune: e.target.value }))}
              placeholder="Commune"
            />
            <button
              type="button"
              onClick={addZone}
              className="btn-primary whitespace-nowrap"
            >
              + Ajouter
            </button>
          </div>

          {form.zonesCouvertes.length > 0 ? (
            <ul className="space-y-1">
              {form.zonesCouvertes.map((z, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                >
                  <span className="text-sm">
                    {z.region} — {z.commune}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeZone(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Aucune zone ajoutée. Une zone est obligatoire.</p>
          )}
        </section>

        {/* Types de produits */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4">Types de produits</h2>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Produits acceptés</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRODUITS_OPTIONS.map((p) => (
                <label key={`acc-${p}`} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.typesProduitsAcceptes.includes(p)}
                    onChange={() => toggleProduit(p, "typesProduitsAcceptes")}
                    className="rounded"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Types refusés</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRODUITS_OPTIONS.map((p) => (
                <label key={`ref-${p}`} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.typesRefuses.includes(p)}
                    onChange={() => toggleProduit(p, "typesRefuses")}
                    className="rounded"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Disponibilité & Horaires */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Disponibilité & Horaires
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Disponibilité</label>
              <select
                className="input-field w-full"
                value={form.disponibilite}
                onChange={(e) => updateField("disponibilite", e.target.value)}
              >
                {DISPONIBILITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Horaires habituels</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.horairesHabituels}
                onChange={(e) => updateField("horairesHabituels", e.target.value)}
                placeholder="Ex: 8h-18h"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
              <span className="text-sm font-medium">Livraison urgente</span>
              <button
                type="button"
                onClick={() => updateField("livraisonUrgente", !form.livraisonUrgente)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.livraisonUrgente ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.livraisonUrgente ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
              <span className="text-sm font-medium">Livraison week-end</span>
              <button
                type="button"
                onClick={() => updateField("livraisonWeekEnd", !form.livraisonWeekEnd)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.livraisonWeekEnd ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.livraisonWeekEnd ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
          </div>
        </section>

        {/* Contact & Tarif */}
        <section className="card">
          <h2 className="text-lg font-bold mb-4">Contact & Tarif</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mode de contact</label>
              <select
                className="input-field w-full"
                value={form.modeContact}
                onChange={(e) => updateField("modeContact", e.target.value)}
              >
                {CONTACT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarif indicatif</label>
              <input
                type="text"
                className="input-field w-full"
                value={form.tarifIndicatif}
                onChange={(e) => updateField("tarifIndicatif", e.target.value)}
                placeholder="Ex: Selon distance, 500 FCFA/km"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          <Save className="w-5 h-5" />
          {saving
            ? "Enregistrement..."
            : existingProfileId
            ? "Mettre à jour le profil"
            : "Créer le profil"}
        </button>
      </form>
    </div>
  );
}
