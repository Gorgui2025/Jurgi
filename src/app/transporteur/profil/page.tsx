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
} from "lucide-react";

interface TransporterProfile {
  id?: string;
  userId: string;
  displayName: string;
  phone: string;
  whatsapp?: string;
  photo?: string;
  bio?: string;
  vehicleType: string;
  vehicleCapacity: string;
  zones: { region: string; commune: string }[];
  acceptedTypes: string[];
  availability: string;
  hourlySchedule?: string;
  indicativePrice?: string;
  contactMode: string;
  status?: string;
}

const PRODUITS_OPTIONS = [
  "Alimentation animale",
  "Équipements",
  "Produits accessoires",
  "Documents",
  "Petits colis",
  "Commandes fournisseurs",
  "Petits animaux",
  "Bétail",
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

export default function TransporteurProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    whatsapp: "",
    photo: "",
    bio: "",
    vehicleType: "Moto",
    vehicleCapacity: "",
    zones: [] as { region: string; commune: string }[],
    acceptedTypes: [] as string[],
    availability: "available",
    hourlySchedule: "",
    indicativePrice: "",
    contactMode: "phone",
  });

  const [zoneInput, setZoneInput] = useState({ region: "", commune: "" });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfile();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  async function fetchProfile() {
    try {
      const userId = (session?.user as any)?.id;
      const res = await fetch(`/api/transporter-profiles?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setHasProfile(true);
          setProfileStatus(data.status || "pending");
          setForm({
            displayName: data.displayName || "",
            phone: data.phone || "",
            whatsapp: data.whatsapp || "",
            photo: data.photo || "",
            bio: data.bio || "",
            vehicleType: data.vehicleType || "Moto",
            vehicleCapacity: data.vehicleCapacity || "",
            zones: parseJsonArray(data.zones),
            acceptedTypes: parseJsonArray(data.acceptedTypes),
            availability: data.availability || "available",
            hourlySchedule: data.hourlySchedule || "",
            indicativePrice: data.indicativePrice || "",
            contactMode: data.contactMode || "phone",
          });
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function parseJsonArray(value: string | undefined): any[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function toggleAcceptedType(type: string) {
    setForm((prev) => {
      const list = prev.acceptedTypes;
      const updated = list.includes(type)
        ? list.filter((t) => t !== type)
        : [...list, type];
      return { ...prev, acceptedTypes: updated };
    });
  }

  function addZone() {
    if (zoneInput.region.trim() && zoneInput.commune.trim()) {
      setForm((prev) => ({
        ...prev,
        zones: [
          ...prev.zones,
          { region: zoneInput.region.trim(), commune: zoneInput.commune.trim() },
        ],
      }));
      setZoneInput({ region: "", commune: "" });
    }
  }

  function removeZone(index: number) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const userId = (session?.user as any)?.id;
      const payload = { userId, ...form };

      const res = await fetch("/api/transporter-profiles", {
        method: hasProfile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Erreur lors de la sauvegarde");
      }

      const saved = await res.json();
      if (saved.id && !hasProfile) {
        setHasProfile(true);
      }
      if (saved.status) {
        setProfileStatus(saved.status);
      }

      setSuccessMessage(hasProfile ? "Profil mis à jour !" : "Profil créé avec succès !");
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-baobab-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 card text-center">
        <AlertTriangle className="w-12 h-12 text-ocre-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Connexion requise</h2>
        <p className="text-charbon-400 mb-6">
          Vous devez être connecté pour gérer votre profil de transporteur.
        </p>
        <button onClick={() => router.push("/connexion")} className="btn-primary">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-charbon-400 hover:text-baobab-500 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        {hasProfile ? (
          <Edit2 className="w-7 h-7 text-baobab-500" />
        ) : (
          <Truck className="w-7 h-7 text-baobab-500" />
        )}
        <h1 className="text-2xl font-bold text-charbon-500">
          {hasProfile ? "Modifier mon profil transporteur" : "Créer mon profil transporteur"}
        </h1>
      </div>

      {profileStatus === "pending" && (
        <div className="card mb-6 border-l-4 border-l-ocre-500">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-ocre-500" />
            <span className="font-semibold text-charbon-500">Validation en cours</span>
          </div>
          <p className="text-sm text-charbon-400">
            Votre profil est en attente de validation par un administrateur.
          </p>
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
        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-baobab-500" />
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Nom / nom commercial *
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                required
                placeholder="Ex: Express Transport Kinshasa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Téléphone *
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
                placeholder="+243 ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                WhatsApp (optionnel)
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="+243 ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Photo URL (Cloudinary)
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.photo}
                onChange={(e) => updateField("photo", e.target.value)}
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-charbon-400 mb-1">
              Présentation
            </label>
            <textarea
              className="input-field w-full"
              rows={3}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Décrivez brièvement votre activité de transport..."
            />
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-baobab-500" />
            Véhicule & Capacité
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Type de véhicule *
              </label>
              <select
                className="input-field w-full"
                value={form.vehicleType}
                onChange={(e) => updateField("vehicleType", e.target.value)}
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
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Capacité de transport
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.vehicleCapacity}
                onChange={(e) => updateField("vehicleCapacity", e.target.value)}
                placeholder="Ex: 200 kg, 3 sacs"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-baobab-500" />
            Zones couvertes
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
            <button type="button" onClick={addZone} className="btn-primary whitespace-nowrap">
              + Ajouter
            </button>
          </div>

          {form.zones.length > 0 ? (
            <ul className="space-y-1">
              {form.zones.map((z, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-vertbrume-100/60 px-3 py-2 rounded"
                >
                  <span className="text-sm text-charbon-500">
                    {z.region} — {z.commune}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeZone(i)}
                    className="text-ocre-600 hover:text-ocre-700 text-sm"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charbon-300">Aucune zone ajoutée.</p>
          )}
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-baobab-500" />
            Types acceptés
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRODUITS_OPTIONS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 text-sm text-charbon-500 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.acceptedTypes.includes(p)}
                  onChange={() => toggleAcceptedType(p)}
                  className="rounded"
                />
                {p}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-baobab-500" />
            Disponibilité & Horaires
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Disponibilité
              </label>
              <select
                className="input-field w-full"
                value={form.availability}
                onChange={(e) => updateField("availability", e.target.value)}
              >
                {DISPONIBILITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Horaires habituels
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.hourlySchedule}
                onChange={(e) => updateField("hourlySchedule", e.target.value)}
                placeholder="Ex: 8h-18h"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-charbon-500 mb-4">Contact & Tarif</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Mode de contact
              </label>
              <select
                className="input-field w-full"
                value={form.contactMode}
                onChange={(e) => updateField("contactMode", e.target.value)}
              >
                {CONTACT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charbon-400 mb-1">
                Tarif indicatif
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.indicativePrice}
                onChange={(e) => updateField("indicativePrice", e.target.value)}
                placeholder="Ex: 500 FCFA/km"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          <Save className="w-5 h-5" />
          {saving
            ? "Enregistrement..."
            : hasProfile
            ? "Mettre à jour le profil"
            : "Créer le profil"}
        </button>
      </form>
    </div>
  );
}