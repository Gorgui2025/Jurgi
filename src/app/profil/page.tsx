"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  User, Mail, Phone, MapPin, Shield, Store, Calendar, ArrowRight, Star,
  Camera, X, Check, Edit3, Eye, EyeOff, Lock
} from "lucide-react";

const REGIONS = [
  "Dakar", "Thiès", "Saint-Louis", "Diourbel", "Louga", "Fatick",
  "Kaolack", "Ziguinchor", "Kolda", "Sédhiou", "Kaffrine", "Kédougou", "Tambacounda", "Matam"
];

const ROLE_LABELS: Record<string, string> = {
  eleveur: "Éleveur / Exploitant",
  vendeur_animaux: "Vendeur d'animaux",
  fournisseur: "Fournisseur",
  veterinaire: "Vétérinaire / Technicien",
  transporteur: "Transporteur",
  acheteur: "Acheteur pro",
  formateur: "Formateur",
  institution: "Institution / Coopérative",
  admin: "Administrateur",
};

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string | null; avatar: string | null };
}

export default function ProfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    region: "",
    commune: "",
    whatsapp: "",
    phoneVisible: false,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirmPw: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      setForm({
        name: u.name || "",
        bio: u.bio || "",
        region: u.region || "",
        commune: u.commune || "",
        whatsapp: u.whatsapp || "",
        phoneVisible: u.phoneVisible || false,
      });
      fetch(`/api/users?id=${u.id}`)
        .then((res) => res.json())
        .then((data) => {
          const full = data.user || data;
          if (full.avatar) setAvatarPreview(full.avatar);
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if ((session?.user as any)?.id) {
      fetch(`/api/reviews?userId=${(session?.user as any).id}`)
        .then((res) => res.json())
        .then((data) => {
          setReviews(data.reviews || []);
          setReviewsAvg(data.average);
          setReviewsCount(data.count || 0);
        })
        .catch(() => {});
    }
  }, [session?.user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: form.name,
          bio: form.bio,
          region: form.region,
          commune: form.commune,
          whatsapp: form.whatsapp,
          phoneVisible: form.phoneVisible,
          avatar: avatarPreview || undefined,
        }),
      });
      if (res.ok) {
        await update({ ...session, user: { ...session?.user, name: form.name } });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setEditing(false);
      }
    } catch {}
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    setPwError("");
    if (!pwForm.current || !pwForm.newPw) {
      setPwError("Tous les champs sont requis");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError("Le nouveau mot de passe doit faire 6 caractères minimum");
      return;
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwError("Les mots de passe ne correspondent pas");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      });
      if (res.ok) {
        setPwSaved(true);
        setPwForm({ current: "", newPw: "", confirmPw: "" });
        setChangingPassword(false);
        setTimeout(() => setPwSaved(false), 3000);
      } else {
        const data = await res.json();
        setPwError(data.error || "Erreur lors du changement");
      }
    } catch {
      setPwError("Erreur réseau");
    }
    setPwSaving(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = session?.user as any;
  if (!user) return null;

  const roles: string[] = user.roles || [];

  return (
    <div className="page-container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Mon profil</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-outline text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Modifier
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-vertprofond-50 border border-vertprofond-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-vertprofond-600">
          <Check className="w-4 h-4" /> Profil mis à jour avec succès
        </div>
      )}

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-20 h-20 bg-baobab-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              onClick={() => editing && fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-baobab-600">
                  {user.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-baobab-500 text-white rounded-full flex items-center justify-center shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field text-lg font-semibold mb-2"
                placeholder="Votre nom"
              />
            ) : (
              <h2 className="text-lg font-semibold text-charbon-500">{user.name}</h2>
            )}

            <div className="flex items-center gap-2 mt-1">
              {user.accountStatus === "active" ? (
                <span className="inline-flex items-center gap-1 text-xs bg-vertprofond-100 text-vertprofond-600 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Compte actif
                </span>
              ) : user.accountStatus === "pending_validation" ? (
                <span className="inline-flex items-center gap-1 text-xs bg-ocre-100 text-ocre-600 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> En attente de validation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-rougeterre-100 text-rougeterre-600 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Suspendu
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info fields */}
        <div className="mt-6 space-y-4">
          {user.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-charbon-300 shrink-0" />
              <span className="text-charbon-400">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-charbon-300 shrink-0" />
              <span className="text-charbon-400">{user.phone}</span>
              {editing && (
                <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                  {form.phoneVisible ? <Eye className="w-3.5 h-3.5 text-baobab-500" /> : <EyeOff className="w-3.5 h-3.5 text-charbon-300" />}
                  <input
                    type="checkbox"
                    checked={form.phoneVisible}
                    onChange={(e) => setForm({ ...form, phoneVisible: e.target.checked })}
                    className="w-3.5 h-3.5 accent-baobab-500"
                  />
                  <span className="text-xs text-charbon-300">Visible</span>
                </label>
              )}
            </div>
          )}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label">Région</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Commune</label>
                <input
                  type="text"
                  value={form.commune}
                  onChange={(e) => setForm({ ...form, commune: e.target.value })}
                  className="input-field"
                  placeholder="Commune"
                />
              </div>
            </div>
          ) : (
            (user.region || user.commune) && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-charbon-300 shrink-0" />
                <span className="text-charbon-400">
                  {user.commune ? `${user.commune}, ` : ""}{user.region || "Sénégal"}
                </span>
              </div>
            )
          )}
          {editing ? (
            <div>
              <label className="input-label">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="input-field"
                placeholder="+221 77 123 45 67"
              />
            </div>
          ) : (
            user.whatsapp && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-charbon-300">📱</span>
                <span className="text-charbon-400">{user.whatsapp}</span>
              </div>
            )
          )}
          {editing ? (
            <div>
              <label className="input-label">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-field min-h-[80px] resize-none"
                placeholder="Décrivez votre activité..."
                rows={3}
              />
            </div>
          ) : (
            user.bio && (
              <div className="bg-vertbrume-50 rounded-xl p-3">
                <p className="text-sm text-charbon-400">{user.bio}</p>
              </div>
            )
          )}
        </div>

        {/* Edit actions */}
        {editing && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-beigebrume-100">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-outline">
              Annuler
            </button>
          </div>
        )}

        {/* Roles */}
        <div className="mt-4 pt-4 border-t border-beigebrume-100">
          <p className="text-xs text-charbon-300 mb-2">Rôles</p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <span key={role} className="px-2.5 py-1 bg-vertbrume-100 text-baobab-600 rounded-full text-xs font-medium">
                {ROLE_LABELS[role] || role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Link href="/mes-annonces" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-baobab-100 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-baobab-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-charbon-500">Mes annonces</p>
            <p className="text-xs text-charbon-300">Gérer mes publications</p>
          </div>
          <ArrowRight className="w-4 h-4 text-charbon-200 ml-auto" />
        </Link>
        <Link href="/publier" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-vertprofond-100 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-vertprofond-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-charbon-500">Nouvelle annonce</p>
            <p className="text-xs text-charbon-300">Publier un animal, produit...</p>
          </div>
          <ArrowRight className="w-4 h-4 text-charbon-200 ml-auto" />
        </Link>
      </div>

      {/* Password change */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charbon-500">Mot de passe</h2>
          {!changingPassword && (
            <button onClick={() => setChangingPassword(true)} className="btn-outline text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" /> Modifier
            </button>
          )}
        </div>

        {pwSaved && (
          <div className="bg-vertprofond-50 border border-vertprofond-200 rounded-xl p-3 mb-3 flex items-center gap-2 text-sm text-vertprofond-600">
            <Check className="w-4 h-4" /> Mot de passe modifié avec succès
          </div>
        )}

        {changingPassword ? (
          <div className="space-y-3">
            {pwError && (
              <div className="p-3 bg-rougeterre-50 border border-rougeterre-200 rounded-xl text-sm text-rougeterre-600">
                {pwError}
              </div>
            )}
            <div>
              <label className="input-label">Mot de passe actuel</label>
              <input
                type="password"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                className="input-field"
                placeholder="Votre mot de passe actuel"
              />
            </div>
            <div>
              <label className="input-label">Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                className="input-field"
                placeholder="6 caractères minimum"
              />
            </div>
            <div>
              <label className="input-label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.confirmPw}
                onChange={(e) => setPwForm({ ...pwForm, confirmPw: e.target.value })}
                className="input-field"
                placeholder="Retapez le nouveau mot de passe"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handlePasswordChange} disabled={pwSaving} className="btn-primary flex-1">
                {pwSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button onClick={() => { setChangingPassword(false); setPwError(""); }} className="btn-outline">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-charbon-300">Modifiez votre mot de passe de connexion.</p>
        )}
      </div>

      {/* Reviews */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charbon-500">Avis reçus</h2>
          {reviewsAvg != null && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-ocre-500 fill-ocre-500" />
              <span className="text-sm font-bold text-charbon-500">{Number(reviewsAvg).toFixed(1)}</span>
              <span className="text-xs text-charbon-300">({reviewsCount})</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-charbon-300">Aucun avis reçu pour le moment</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-beigebrume-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-baobab-100 flex items-center justify-center text-xs font-bold text-baobab-600">
                    {r.reviewer.name?.charAt(0) || "?"}
                  </div>
                  <span className="text-sm font-medium text-charbon-500">{r.reviewer.name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-ocre-500 fill-ocre-500" : "text-charbon-200"}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-charbon-200 ml-auto">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-charbon-400 ml-9">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
