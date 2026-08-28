"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Shield,
  Edit2,
} from "lucide-react";

interface InstitutionProfile {
  id?: string;
  userId: string;
  displayName: string;
  phone: string;
  whatsapp?: string;
  photo?: string;
  bio?: string;
  institutionType: string;
  servicesOffered: string[];
  zones: { region: string; commune: string }[];
  availability: string;
  contactMode: string;
  status?: string;
}

const INSTITUTION_TYPE_OPTIONS = [
  "ONG",
  "Coopérative",
  "Entreprise",
  "Gouvernement",
  "Association",
  "Autre",
];

const SERVICES_OPTIONS = [
  "Formation",
  "Conseil",
  "Achat groupé",
  "Financement",
  "Logistique",
  "Recherche",
  "Distribution d'intrants",
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "busy", label: "Occupé" },
  { value: "unavailable", label: "Indisponible" },
];

const CONTACT_OPTIONS = [
  { value: "phone", label: "Téléphone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "both", label: "Les deux" },
];

export default function InstitutionProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingStatus, setPendingStatus] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    whatsapp: "",
    photo: "",
    bio: "",
    institutionType: "ONG",
    servicesOffered: [] as string[],
    zones: [] as { region: string; commune: string }[],
    availability: "available",
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
      const userId = (session?.user as any)?.id || (session?.user as any)?.email;
      const res = await fetch(`/api/institution-profiles?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const profile: InstitutionProfile = Array.isArray(data) ? data[0] : data;
        if (profile && profile.id) {
          setExistingProfileId(profile.id);
          let services: string[] = [];
          if (typeof profile.servicesOffered === "string") {
            try {
              services = JSON.parse(profile.servicesOffered);
            } catch {
              services = [];
            }
          } else {
            services = profile.servicesOffered || [];
          }
          let zones: { region: string; commune: string }[] = [];
          if (typeof profile.zones === "string") {
            try {
              zones = JSON.parse(profile.zones);
            } catch {
              zones = [];
            }
          } else {
            zones = profile.zones || [];
          }
          setForm({
            displayName: profile.displayName || "",
            phone: profile.phone || "",
            whatsapp: profile.whatsapp || "",
            photo: profile.photo || "",
            bio: profile.bio || "",
            institutionType: profile.institutionType || "ONG",
            servicesOffered: services,
            zones,
            availability: profile.availability || "available",
            contactMode: profile.contactMode || "phone",
          });
          if (profile.status === "pending") {
            setPendingStatus(true);
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function toggleService(service: string) {
    setForm((prev) => {
      const list = prev.servicesOffered;
      const updated = list.includes(service)
        ? list.filter((s) => s !== service)
        : [...list, service];
      return { ...prev, servicesOffered: updated };
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
      const userId = (session?.user as any)?.id || (session?.user as any)?.email;
      const payload = {
        userId,
        displayName: form.displayName,
        phone: form.phone,
        whatsapp: form.whatsapp,
        photo: form.photo,
        bio: form.bio,
        institutionType: form.institutionType,
        servicesOffered: JSON.stringify(form.servicesOffered),
        zones: JSON.stringify(form.zones),
        availability: form.availability,
        contactMode: form.contactMode,
      };

      const url = existingProfileId
        ? `/api/institution-profiles/${existingProfileId}`
        : "/api/institution-profiles";
      const method = existingProfileId ? "PATCH" : "POST";

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

      setSuccessMessage(
        existingProfileId ? "Profil mis à jour !" : "Profil créé avec succès !"
      );
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
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-baobab-500" />
        <h2 className="text-xl font-bold mb-2">Connexion requise</h2>
        <p className="text-gray-600 mb-6">
          Vous devez être connecté pour gérer votre profil d&apos;institution.
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
        className="flex items-center gap-2 text-gray-600 hover:text-baobab-500 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        {existingProfileId ? (
          <Edit2 className="w-7 h-7 text-baobab-500" />
        ) : (
          <Building2 className="w-7 h-7 text-baobab-500" />
        )}
        <h1 className="text-2xl font-bold text-charbon-500">
          {existingProfileId
            ? "Modifier mon profil institution"
            : "Créer mon profil institution"}
        </h1>
      </div>

      {pendingStatus && (
        <div className="card mb-6 border-l-4 border-baobab-500">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-baobab-500" />
            <span className="font-semibold">Statut du profil</span>
          </div>
          <p className="text-sm text-gray-600">
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
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-baobab-500" />
            Informations sur l&apos;institution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom de l&apos;institution *
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                required
                placeholder="Ex: Coopérative Agricole de Kinshasa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone *</label>
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
              <label className="block text-sm font-medium mb-1">
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
              <label className="block text-sm font-medium mb-1">
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
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                className="input-field w-full"
                value={form.institutionType}
                onChange={(e) => updateField("institutionType", e.target.value)}
                required
              >
                {INSTITUTION_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Présentation</label>
            <textarea
              className="input-field w-full"
              rows={3}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Décrivez brièvement votre institution et ses activités..."
            />
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-baobab-500" />
            Services proposés
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICES_OPTIONS.map((s) => (
              <label
                key={s}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.servicesOffered.includes(s)}
                  onChange={() => toggleService(s)}
                  className="rounded"
                />
                {s}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-baobab-500" />
            Zones d&apos;intervention
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
                  className="flex items-center justify-between bg-vertbrume-100 px-3 py-2 rounded"
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
            <p className="text-sm text-gray-400">Aucune zone ajoutée.</p>
          )}
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-baobab-500" />
            Disponibilité & Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Disponibilité</label>
              <select
                className="input-field w-full"
                value={form.availability}
                onChange={(e) => updateField("availability", e.target.value)}
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mode de contact</label>
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
            : existingProfileId
            ? "Mettre à jour le profil"
            : "Créer le profil"}
        </button>
      </form>
    </div>
  );
}
