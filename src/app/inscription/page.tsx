"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Phone, Mail, Shield } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";

const STEPS = ["Compte", "Rôle", "Localisation"];

const ROLES = [
  { value: "eleveur", label: "Éleveur / Exploitant", icon: "🐄", desc: "Je pratique l'élevage", pro: false },
  { value: "vendeur_animaux", label: "Vendeur d'animaux", icon: "🏷️", desc: "Je vends des animaux", pro: false },
  { value: "fournisseur", label: "Fournisseur", icon: "🌾", desc: "Aliments & produits", pro: false },
  { value: "veterinaire", label: "Vétérinaire / Technicien", icon: "🩺", desc: "Je soigne les animaux", pro: true },
  { value: "transporteur", label: "Transporteur", icon: "🚛", desc: "Transport bétail/produits", pro: true },
  { value: "livreur", label: "Livreur", icon: "🛵", desc: "Livraison de proximité", pro: true },
  { value: "acheteur", label: "Acheteur pro", icon: "🛒", desc: "J'achète en volume", pro: false },
  { value: "formateur", label: "Formateur", icon: "📚", desc: "Je forme les éleveurs", pro: false },
  { value: "institution", label: "Institution / Coopérative", icon: "🏛️", desc: "Organisation", pro: true },
];

const REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack",
  "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis",
  "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
];

const PRO_ROLES = ["veterinaire", "transporteur", "institution", "livreur"];

export default function InscriptionPage() {
  const [step, setStep] = useState(0);
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [form, setForm] = useState({
    name: "",
    phone: "+221 ",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [] as string[],
    region: "",
    commune: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasProRole = form.roles.some((r) => PRO_ROLES.includes(r));

  const toggleRole = (value: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(value)
        ? prev.roles.filter((r) => r !== value)
        : [...prev.roles, value],
    }));
  };

  const canContinueStep0 = () => {
    if (!form.name.trim()) return false;
    if (authMethod === "phone") {
      if (form.phone.trim().length <= 8) return false;
    } else {
      if (!form.email.trim() || !form.email.includes("@")) return false;
    }
    if (!form.password || form.password.length < 6) return false;
    if (form.password !== form.confirmPassword) return false;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        roles: form.roles,
        region: form.region,
        commune: form.commune,
        accountStatus: hasProRole ? "pending_validation" : "active",
        password: form.password,
      };
      if (authMethod === "phone") {
        payload.phone = form.phone.trim();
      } else {
        payload.email = form.email.trim();
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'inscription");
      }
    } catch {
      alert("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {hasProRole ? (
                <Shield className="w-8 h-8 text-vertprofond-500" />
              ) : (
                <Check className="w-8 h-8 text-vertprofond-500" />
              )}
            </div>
            {hasProRole ? (
              <>
                <h1 className="text-xl font-bold text-charbon-500 mb-2">Compte créé !</h1>
                <p className="text-charbon-400 mb-4">
                  Votre compte professionnel est en attente de validation par notre équipe.
                  Vous recevrez une notification une fois votre compte approuvé.
                </p>
                <p className="text-sm text-charbon-300 mb-6">
                  Roles en attente : {form.roles.filter(r => PRO_ROLES.includes(r)).map(r => ROLES.find(role => role.value === r)?.label).join(", ")}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-charbon-500 mb-2">Bienvenue sur Jurgi !</h1>
                <p className="text-charbon-400 mb-6">
                  Votre compte a été créé avec succès. {authMethod === "phone" ? "Un code de vérification vous sera envoyé par SMS." : "Vérifiez votre boîte email pour confirmer votre compte."}
                </p>
              </>
            )}
            <Link href="/connexion" className="btn-primary inline-flex items-center gap-2">
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/assets/brand/jurgi-logo-192.png" alt="Logo Jurgi" width={56} height={56} className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-charbon-500">Créer un compte</h1>
          <p className="text-sm text-charbon-300 mt-1">
            Rejoignez la communauté Jurgi
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step
                    ? "bg-vertprofond-500 text-white"
                    : i === step
                    ? "bg-baobab-500 text-white"
                    : "bg-beigebrume-200 text-charbon-300"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? "text-charbon-500 font-medium" : "text-charbon-300"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-vertprofond-500" : "bg-beigebrume-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 1: Compte */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Auth method tabs */}
              <div className="flex rounded-xl bg-beigebrume-100 p-1">
                <button
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authMethod === "phone"
                      ? "bg-white text-charbon-500 shadow-sm"
                      : "text-charbon-300 hover:text-charbon-400"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Téléphone
                </button>
                <button
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authMethod === "email"
                      ? "bg-white text-charbon-500 shadow-sm"
                      : "text-charbon-300 hover:text-charbon-400"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="input-label">Nom complet ou raison sociale</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Moussa Diallo"
                  className="input-field"
                  required
                />
              </div>

              {/* Phone */}
              {authMethod === "phone" && (
                <div>
                  <label className="input-label">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+221 77 123 45 67"
                    className="input-field"
                    required
                  />
                </div>
              )}

              {authMethod === "email" && (
                <div>
                  <label className="input-label">Adresse email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="moussa@exemple.com"
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div>
                <label className="input-label">Mot de passe</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="6 caractères minimum"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="input-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Retapez votre mot de passe"
                  className={`input-field ${form.confirmPassword && form.password !== form.confirmPassword ? "border-rougeterre-400 focus:border-rougeterre-500" : ""}`}
                  required
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-rougeterre-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 1 && (
            <div>
              <p className="text-sm text-charbon-400 mb-4">
                Sélectionnez un ou plusieurs rôles :
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      form.roles.includes(role.value)
                        ? "border-baobab-500 bg-baobab-50"
                        : "border-beigebrume-200 hover:border-baobab-200"
                    }`}
                  >
                    <span className="text-xl">{role.icon}</span>
                    <p className="text-sm font-medium text-charbon-500 mt-1">{role.label}</p>
                    <p className="text-[11px] text-charbon-300">{role.desc}</p>
                    {role.pro && (
                      <span className="absolute top-2 right-2 text-[10px] bg-ocre-100 text-ocre-600 px-1.5 py-0.5 rounded-full font-medium">
                        Pro
                      </span>
                    )}
                    {form.roles.includes(role.value) && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-5 h-5 bg-baobab-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {hasProRole && (
                <div className="mt-4 p-3 bg-ocre-50 border border-ocre-200 rounded-xl flex items-start gap-2">
                  <Shield className="w-4 h-4 text-ocre-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-ocre-700">
                    Les rôles marqués <strong>Pro</strong> nécessitent une validation manuelle par notre équipe avant activation de votre compte.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="input-label">Région</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Choisir une région</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Commune (optionnel)</label>
                <input
                  type="text"
                  value={form.commune}
                  onChange={(e) => setForm({ ...form, commune: e.target.value })}
                  placeholder="Ex: Pikine, Rufisque..."
                  className="input-field"
                />
              </div>
              <div className="p-3 bg-vertbrume-100 rounded-xl">
                <p className="text-sm text-charbon-400">
                  <strong>Résumé :</strong> {authMethod === "phone" ? form.phone : form.email}
                </p>
                <p className="text-sm text-charbon-400">
                  {form.roles.map(r => ROLES.find(role => role.value === r)?.label).join(", ")}
                </p>
                <p className="text-sm text-charbon-400">
                  {form.region || "—"}{form.commune ? `, ${form.commune}` : ""}
                </p>
                {hasProRole && (
                  <p className="text-xs text-ocre-600 mt-1">
                    Compte en attente de validation pro
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}
            <button
              onClick={() => {
                if (step < STEPS.length - 1) setStep(step + 1);
                else handleSubmit();
              }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={
                (step === 0 && !canContinueStep0()) ||
                (step === 1 && form.roles.length === 0) ||
                (step === 2 && !form.region) ||
                submitting
              }
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscription...
                </span>
              ) : step === STEPS.length - 1 ? (
                "Créer mon compte"
              ) : (
                <>
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-charbon-300 mt-6">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-baobab-500 font-semibold hover:text-baobab-600">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
