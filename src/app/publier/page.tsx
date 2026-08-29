"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Upload, ImagePlus, Film, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

const DOMAINS = [
  { value: "animaux", label: "Animaux", icon: "🐄" },
  { value: "alimentation", label: "Alimentation", icon: "🌾" },
  { value: "equipement", label: "Équipements", icon: "🏗️" },
  { value: "sante", label: "Santé animale", icon: "🩺" },
  { value: "service", label: "Services", icon: "🔧" },
  { value: "transport", label: "Transport", icon: "🚛" },
  { value: "formation", label: "Formation", icon: "📚" },
  { value: "debouche", label: "Débouchés", icon: "🥩" },
];

const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack",
  "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis",
  "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

const SPECIES_LIST = ["Bovin", "Ovin", "Caprin", "Volaille", "Porcin", "Apiculture", "Cuniculture", "Aquaculture", "Autre"];

interface FieldDef {
  key: string;
  label: string;
  type: "select" | "text";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const DOMAIN_FIELDS: Record<string, { title: string; desc: string; fields: FieldDef[] }> = {
  animaux: {
    title: "Ex: Taureau zébu mâle - Race Ndama",
    desc: "Décrivez l'animal, sa race, son état...",
    fields: [
      { key: "species", label: "Type d'animal", type: "select", options: SPECIES_LIST, required: true },
      { key: "breed", label: "Race", type: "text", placeholder: "Ex: Ndama, Peulh..." },
      { key: "sex", label: "Sexe", type: "select", options: ["Mâle", "Femelle", "Mixte"] },
      { key: "age", label: "Âge", type: "text", placeholder: "Ex: 3 ans" },
      { key: "weight", label: "Poids estimé", type: "text", placeholder: "Ex: 350 kg" },
      { key: "quantity", label: "Nombre d'animaux", type: "text", placeholder: "Ex: 5 têtes", required: true },
    ],
  },
  alimentation: {
    title: "Ex: Aliment bétail - sac 25kg",
    desc: "Décrivez le produit, la quantité disponible...",
    fields: [
      { key: "species", label: "Type de produit", type: "select", options: ["Aliment bétail", "Fourrage", "Céréales", "Complément", "Autre"], required: true },
      { key: "quantity", label: "Quantité disponible", type: "text", placeholder: "Ex: 10 sacs, 2 tonnes", required: true },
      { key: "age", label: "Disponibilité", type: "text", placeholder: "Ex: Disponible immédiatement" },
    ],
  },
  equipement: {
    title: "Ex: Tracteur John Deere - Très bon état",
    desc: "Décrivez l'équipement, son état, son usage...",
    fields: [
      { key: "species", label: "Type d'équipement", type: "select", options: ["Machine", "Outil", "Matériel d'élevage", "Irrigation", "Autre"], required: true },
      { key: "breed", label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "À réparer"], required: true },
      { key: "age", label: "Marque / Modèle", type: "text", placeholder: "Ex: John Deere 5075E" },
    ],
  },
  sante: {
    title: "Ex: Vaccination pasteurelle - Produit disponible",
    desc: "Décrivez le produit ou la prestation de santé animale...",
    fields: [
      { key: "species", label: "Type", type: "select", options: ["Médicament", "Produit de soin", "Consultation", "Vaccination", "Autre"], required: true },
      { key: "breed", label: "Spécialité / Cible", type: "text", placeholder: "Ex: Bovins, Ovins..." },
      { key: "age", label: "Disponibilité", type: "text", placeholder: "Ex: En stock, Sur commande" },
    ],
  },
  service: {
    title: "Ex: Insemination artificielle - Dakar et environs",
    desc: "Décrivez votre service et votre zone d'intervention...",
    fields: [
      { key: "species", label: "Type de service", type: "select", options: ["Élevage", "Soins vétérinaires", "Insemination", "Bergerie", "Autre"], required: true },
      { key: "breed", label: "Zone d'intervention", type: "text", placeholder: "Ex: Dakar, Thiès, Mbour", required: true },
      { key: "age", label: "Disponibilité", type: "text", placeholder: "Ex: Lun-Sam, 8h-18h" },
    ],
  },
  transport: {
    title: "Ex: Transport d'animaux - Dakar vers Thiès",
    desc: "Décrivez le service de transport, les itinéraires...",
    fields: [
      { key: "species", label: "Type de transport", type: "select", options: ["Animaux", "Aliments", "Équipements", "Marchandises", "Autre"], required: true },
      { key: "breed", label: "Départ", type: "text", placeholder: "Ex: Dakar", required: true },
      { key: "age", label: "Destination", type: "text", placeholder: "Ex: Thiès, Kaolack", required: true },
      { key: "weight", label: "Capacité / Véhicule", type: "text", placeholder: "Ex: Camion 5 tonnes" },
    ],
  },
  formation: {
    title: "Ex: Formation en élevage ovin - 3 jours",
    desc: "Décrivez le contenu, le format, le public cible...",
    fields: [
      { key: "species", label: "Thème", type: "select", options: ["Élevage", "Alimentation", "Santé animale", "Gestion", "Autre"], required: true },
      { key: "breed", label: "Format", type: "select", options: ["Présentiel", "En ligne", "Hybride"], required: true },
      { key: "age", label: "Date ou période", type: "text", placeholder: "Ex: 15-17 Mars 2026" },
      { key: "weight", label: "Lieu ou lien", type: "text", placeholder: "Ex: Centre Thiès / Lien Zoom" },
    ],
  },
  debouche: {
    title: "Ex: Achat de moutons Ladoum - Gros volumes",
    desc: "Décrivez l'opportunité, le besoin, le profil recherché...",
    fields: [
      { key: "species", label: "Type d'opportunité", type: "select", options: ["Achat", "Vente", "Partenariat", "Emploi", "Marché", "Autre"], required: true },
      { key: "breed", label: "Profil ou produit recherché", type: "text", placeholder: "Ex: Moutons Ladoum 40kg+", required: true },
      { key: "age", label: "Date limite", type: "text", placeholder: "Ex: Avant le 30 Mars" },
      { key: "quantity", label: "Volume souhaité", type: "text", placeholder: "Ex: 50 têtes minimum" },
    ],
  },
};

function VideoPreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-baobab-300 bg-charbon-500">
      <video
        src={src}
        className="w-full aspect-video object-contain"
        controls
        playsInline
        preload="metadata"
      />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors z-10"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

export default function PublierPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quotaError, setQuotaError] = useState<{ message: string; isDaily: boolean } | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [form, setForm] = useState({
    domain: "",
    title: "",
    description: "",
    price: "",
    priceOnDemand: false,
    species: "",
    breed: "",
    sex: "",
    age: "",
    weight: "",
    quantity: "",
    healthInfo: "",
    region: "",
    commune: "",
    contactMode: "phone_whatsapp" as string,
    photos: [] as string[],
    videos: [] as string[],
  });

  const domainConfig = DOMAIN_FIELDS[form.domain];
  const isTransportOrService = form.domain === "transport" || form.domain === "service";

  const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({
      domain: "", title: "", description: "", price: "", priceOnDemand: false,
      species: "", breed: "", sex: "", age: "", weight: "", quantity: "", healthInfo: "",
      region: "", commune: "", contactMode: "phone_whatsapp", photos: [], videos: [],
    });
    setShowExtra(false);
  };

  if (submitted) {
    return (
      <div className="page-container max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-vertprofond-500" />
          </div>
          <h1 className="text-xl font-bold text-charbon-500 mb-2">Annonce publiée !</h1>
          <p className="text-charbon-400 mb-6">Votre annonce est maintenant visible sur la marketplace.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/marketplace" className="btn-primary">Voir la marketplace</Link>
            <button onClick={() => { setSubmitted(false); setStep(0); resetForm(); }} className="btn-outline">
              Publier une autre annonce
            </button>
          </div>
        </div>
      </div>
    );
  }

  const domainLabel = DOMAINS.find((d) => d.value === form.domain)?.label || "";

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/marketplace" className="text-charbon-300 hover:text-charbon-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charbon-500">Publier une annonce</h1>
          <p className="text-sm text-charbon-300">
            Étape {step + 1}/3 — {step === 0 ? "Catégorie" : step === 1 ? (domainLabel ? `Annonce ${domainLabel}` : "Détails") : "Localisation"}
          </p>
        </div>
      </div>

      {quotaError && (
        <div className="card p-4 mb-6 border border-ocre-300 bg-ocre-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-ocre-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-charbon-500">{quotaError.message}</p>
              {quotaError.isDaily ? (
                <p className="text-xs text-charbon-400 mt-1">
                  Vous publiez régulièrement ? Les formules <Link href="/abonnement" className="text-baobab-500 hover:underline font-medium">Jurgi Express</Link> et <Link href="/abonnement" className="text-baobab-500 hover:underline font-medium">Jurgi Pro</Link> offrent davantage d'annonces et de visibilité.
                </p>
              ) : (
                <p className="text-xs text-charbon-400 mt-1">
                  Passez à une formule supérieure pour publier davantage : <Link href="/abonnement" className="text-baobab-500 hover:underline font-medium">voir les offres</Link>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-baobab-500" : "bg-beigebrume-200"}`} />
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-charbon-500 mb-4">Qu&apos;est-ce que vous proposez ?</h2>
            <div className="grid grid-cols-2 gap-3">
              {DOMAINS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setForm({ ...form, domain: d.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.domain === d.value
                      ? "border-baobab-500 bg-baobab-50"
                      : "border-beigebrume-200 hover:border-baobab-200"
                  }`}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <p className="text-sm font-medium text-charbon-500 mt-2">{d.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Details (dynamic per domain) */}
        {step === 1 && domainConfig && (
          <div className="space-y-5">
            <div>
              <label className="input-label">Titre de l&apos;annonce *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={domainConfig.title}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="input-label">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={domainConfig.desc}
                className="input-field min-h-[100px] resize-y"
                required
              />
            </div>

            {/* Category-specific required fields */}
            <div className={`grid gap-4 ${domainConfig.fields.filter((f) => f.required).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {domainConfig.fields.filter((f) => f.required).map((f) => (
                <div key={f.key}>
                  <label className="input-label">{f.label} *</label>
                  {f.type === "select" ? (
                    <select value={form[f.key as keyof typeof form] as string} onChange={(e) => setField(f.key, e.target.value)} className="input-field text-sm">
                      <option value="">Choisir</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form[f.key as keyof typeof form] as string}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="input-field text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Optional fields toggle */}
            {domainConfig.fields.some((f) => !f.required) && (
              <>
                <button
                  onClick={() => setShowExtra(!showExtra)}
                  className="text-sm text-baobab-500 hover:text-baobab-600 font-medium"
                >
                  {showExtra ? "Masquer les options" : "+ Informations supplémentaires"}
                </button>
                {showExtra && (
                  <div className="grid grid-cols-2 gap-4 border-t border-beigebrume-100 pt-4">
                    {domainConfig.fields.filter((f) => !f.required).map((f) => (
                      <div key={f.key}>
                        <label className="input-label">{f.label}</label>
                        {f.type === "select" ? (
                          <select value={form[f.key as keyof typeof form] as string} onChange={(e) => setField(f.key, e.target.value)} className="input-field text-sm">
                            <option value="">Choisir</option>
                            {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={form[f.key as keyof typeof form] as string}
                            onChange={(e) => setField(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            className="input-field text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Photos */}
            <div>
              <label className="input-label">Photos (max 6)</label>
              <div className="grid grid-cols-3 gap-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square bg-sable-100 rounded-xl overflow-hidden">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-contain p-1" />
                    <button
                      onClick={() => { const p = [...form.photos]; p.splice(i, 1); setForm({ ...form, photos: p }); }}
                      className="absolute top-1 right-1 p-1 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {form.photos.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="aspect-square border-2 border-dashed border-beigebrume-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-baobab-400 hover:bg-vertbrume-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <span className="w-5 h-5 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-charbon-200" />
                    )}
                    <span className="text-[11px] text-charbon-200">{uploadingImage ? "Upload..." : "Ajouter"}</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;
                  setUploadingImage(true);
                  for (const file of Array.from(files)) {
                    if (form.photos.length >= 6) break;
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (res.ok && data.url) {
                        setForm((prev) => ({ ...prev, photos: [...prev.photos, data.url].slice(0, 6) }));
                      } else {
                        alert(data.error || "Erreur upload image");
                      }
                    } catch {
                      alert("Erreur réseau lors de l'upload");
                    }
                  }
                  setUploadingImage(false);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Videos */}
            <div>
              <label className="input-label">Vidéos (max 2, 50 Mo max)</label>
              <div className="grid grid-cols-2 gap-3">
                {form.videos.map((video, i) => (
                  <VideoPreview key={`${video}-${i}`} src={video} onRemove={() => {
                    const v = [...form.videos]; v.splice(i, 1); setForm({ ...form, videos: v });
                  }} />
                ))}
                {form.videos.length < 2 && (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="aspect-video border-2 border-dashed border-beigebrume-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-baobab-400 hover:bg-vertbrume-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingVideo ? (
                      <span className="w-5 h-5 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Film className="w-6 h-6 text-charbon-200" />
                    )}
                    <span className="text-[11px] text-charbon-200">{uploadingVideo ? "Upload..." : "Ajouter une vidéo"}</span>
                  </button>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 50 * 1024 * 1024) { alert("Vidéo trop volumineuse (max 50 Mo)"); return; }
                  setUploadingVideo(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (res.ok && data.url) {
                      setForm((prev) => ({ ...prev, videos: [...prev.videos, data.url].slice(0, 2) }));
                    } else {
                      alert(data.error || "Erreur upload vidéo");
                    }
                  } catch { alert("Erreur réseau lors de l'upload"); }
                  setUploadingVideo(false);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Price + Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">{form.domain === "formation" || form.domain === "service" || form.domain === "transport" ? "Tarif * (FCFA)" : "Prix * (FCFA)"}</label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="Ex: 450 000"
                  className="input-field"
                />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.priceOnDemand}
                    onChange={(e) => setField("priceOnDemand", String(e.target.checked))}
                    className="w-4 h-4 accent-baobab-500"
                  />
                  <span className="text-sm text-charbon-400">À discuter</span>
                </label>
              </div>
            </div>

            <div>
              <label className="input-label">Région *</label>
              <select
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choisir une région</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="input-label">Commune</label>
              <input
                type="text"
                value={form.commune}
                onChange={(e) => setField("commune", e.target.value)}
                placeholder={isTransportOrService ? "Ex: Plateau, Mermoz..." : "Ex: Thiès, Mermoz..."}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Mode de contact</label>
              <div className="flex gap-3">
                {[
                  { value: "phone_whatsapp", label: "Tél + WhatsApp" },
                  { value: "phone_only", label: "Téléphone" },
                  { value: "internal", label: "Messagerie" },
                  { value: "all", label: "Tous" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setField("contactMode", m.value)}
                    className={`flex-1 p-3 rounded-xl border-2 text-xs font-medium text-center transition-all ${
                      form.contactMode === m.value
                        ? "border-baobab-500 bg-baobab-50 text-baobab-600"
                        : "border-beigebrume-200 text-charbon-400 hover:border-baobab-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {form.domain === "sante" && (
              <div className="bg-ambre-50 border border-ambre-200 rounded-xl p-4">
                <p className="text-sm text-ambre-600 font-medium mb-1">Important</p>
                <p className="text-xs text-charbon-400">
                  Les annonces de santé animale ne remplacent pas les conseils d&apos;un professionnel qualifié.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-beigebrume-100">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-ghost flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          <button
            onClick={async () => {
              if (step === 0 && !form.domain) { alert("Veuillez choisir une catégorie"); return; }
              if (step === 1) {
                if (!form.title.trim()) { alert("Le titre est obligatoire"); return; }
                if (!form.description.trim()) { alert("La description est obligatoire"); return; }
              }
              if (step < 2) { setStep(step + 1); return; }
              setSubmitting(true);
              try {
                const res = await fetch("/api/listings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: (session?.user as any)?.id || null,
                    domain: form.domain,
                    title: form.title,
                    description: form.description,
                    price: form.price || null,
                    priceOnDemand: form.priceOnDemand,
                    species: form.species || null,
                    breed: form.breed || null,
                    sex: form.sex || null,
                    age: form.age || null,
                    weight: form.weight || null,
                    quantity: form.quantity || null,
                    region: form.region,
                    commune: form.commune,
                    contactMode: form.contactMode,
                    healthInfo: form.healthInfo || null,
                    photos: form.photos,
                    videos: form.videos,
                  }),
                });
                if (res.ok) { setSubmitted(true); }
                else {
                  const d = await res.json();
                  if (d.error === "daily_quota_reached" || d.error === "quota_reached") {
                    setQuotaError({ message: d.message || "Limite atteinte.", isDaily: d.error === "daily_quota_reached" });
                  } else {
                    alert(d.error || "Erreur lors de la publication");
                  }
                }
              } catch { alert("Erreur réseau"); }
              finally { setSubmitting(false); }
            }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publication...
              </span>
            ) : step === 2 ? "Publier l'annonce" : "Continuer"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
