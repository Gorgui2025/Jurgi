"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, Plus, Trash2, Eye, Edit, ArrowRight, Check, X, ExternalLink } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  priceOnDemand: boolean;
  status: string;
  photos: string;
  views: number;
  species: string | null;
  breed: string | null;
  sex: string | null;
  age: string | null;
  weight: string | null;
  quantity: number | null;
  region: string | null;
  commune: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function MesAnnoncesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "reserved" | "sold" | "expired" | "suspended" | "SUSPENDED_BY_QUOTA">("all");

  const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    reserved: "Réservée",
    sold: "Vendue",
    expired: "Expirée",
    suspended: "Suspendue",
    SUSPENDED_BY_QUOTA: "Suspendue (quota)",
    draft: "Brouillon",
    pending: "En attente",
    archived: "Archivée",
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-vertprofond-100 text-vertprofond-600",
    reserved: "bg-blue-50 text-blue-600",
    sold: "bg-ocre-100 text-ocre-600",
    expired: "bg-beigebrume-200 text-charbon-400",
    suspended: "bg-rougeterre-100 text-rougeterre-600",
    SUSPENDED_BY_QUOTA: "bg-ocre-50 text-ocre-700",
    draft: "bg-gray-100 text-gray-500",
    pending: "bg-amber-50 text-amber-600",
    archived: "bg-gray-100 text-gray-400",
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  const fetchListings = () => {
    if (session?.user?.id) {
      fetch(`/api/listings?userId=${session.user.id}&allStatuses=true`)
        .then((res) => res.json())
        .then((data) => {
          setListings(data.listings || data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  useEffect(() => { fetchListings(); }, [session]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
    } catch {}
  };

  const handleStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));
    } catch {}
  };

  const startEdit = (listing: Listing) => {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      priceOnDemand: listing.priceOnDemand,
      species: listing.species,
      breed: listing.breed,
      sex: listing.sex,
      age: listing.age,
      weight: listing.weight,
      quantity: listing.quantity,
      region: listing.region,
      commune: listing.commune,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/listings/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setListings((prev) => prev.map((l) => l.id === editingId ? { ...l, ...editForm } : l));
      setEditingId(null);
    } catch {}
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayed = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  return (
    <div className="page-container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Mes annonces ({listings.length})</h1>
        <Link href="/publier" className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Nouvelle annonce
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(["all", "active", "reserved", "sold", "expired", "suspended", "SUSPENDED_BY_QUOTA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-baobab-500 text-white"
                : "bg-beigebrume-100 text-charbon-400 hover:bg-beigebrume-200"
            }`}
          >
            {f === "all" ? "Toutes" : STATUS_LABELS[f]}
            <span className="ml-1 text-[10px]">
              ({f === "all" ? listings.length : listings.filter((l) => l.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400 mb-4">
            {filter === "all" ? "Vous n'avez pas encore d'annonce" : `Aucune annonce ${STATUS_LABELS[filter]?.toLowerCase() || ""}`}
          </p>
          <Link href="/publier" className="btn-primary inline-flex items-center gap-2">
            Publier une annonce
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((listing) => {
            const photos = JSON.parse(listing.photos || "[]");
            const isEditing = editingId === listing.id;

            if (isEditing) {
              return (
                <div key={listing.id} className="card p-5 border-2 border-baobab-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-charbon-500">Modifier l&apos;annonce</h3>
                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                      <X className="w-4 h-4 text-charbon-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-charbon-300">Titre</label>
                      <input
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-charbon-300">Description</label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="input-field text-sm mt-1 min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Prix (FCFA)</label>
                      <input
                        type="number"
                        value={editForm.price || ""}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Quantité</label>
                      <input
                        type="number"
                        value={editForm.quantity || ""}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value ? parseInt(e.target.value) : null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Espèce</label>
                      <input
                        value={editForm.species || ""}
                        onChange={(e) => setEditForm({ ...editForm, species: e.target.value || null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Race</label>
                      <input
                        value={editForm.breed || ""}
                        onChange={(e) => setEditForm({ ...editForm, breed: e.target.value || null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Région</label>
                      <input
                        value={editForm.region || ""}
                        onChange={(e) => setEditForm({ ...editForm, region: e.target.value || null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charbon-300">Commune</label>
                      <input
                        value={editForm.commune || ""}
                        onChange={(e) => setEditForm({ ...editForm, commune: e.target.value || null })}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                      {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Enregistrer
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-ghost text-sm">Annuler</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={listing.id} className="card-hover p-4 flex gap-4">
                <Link href={`/marketplace/${listing.id}`} className="w-20 h-20 bg-sable-200 rounded-xl shrink-0 overflow-hidden block">
                  {photos[0] ? (
                    <img src={photos[0]} alt={listing.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-charbon-200" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/marketplace/${listing.id}`} className="text-sm font-semibold text-charbon-500 truncate hover:text-baobab-500">
                      {listing.title}
                    </Link>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[listing.status] || "bg-beigebrume-200 text-charbon-400"}`}>
                      {STATUS_LABELS[listing.status] || listing.status}
                    </span>
                  </div>
                  <p className="text-xs text-charbon-300 mt-1 line-clamp-1">{listing.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-charbon-300">
                    {listing.price != null && (
                      <span className="font-semibold text-baobab-500">{listing.price.toLocaleString()} FCFA</span>
                    )}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views}</span>
                    {listing.expiresAt && listing.status === "active" && (
                      <span className="text-amber-600">
                        Expire le {new Date(listing.expiresAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3 pt-2 border-t border-beigebrume-100 flex-wrap">
                    <button
                      onClick={() => startEdit(listing)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-beigebrume-100 text-charbon-400 hover:bg-beigebrume-200 transition-colors"
                    >
                      <Edit className="w-3 h-3" /> Modifier
                    </button>
                    {listing.status === "active" && (
                      <button
                        onClick={() => handleStatus(listing.id, "reserved")}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Réservée
                      </button>
                    )}
                    {listing.status === "reserved" && (
                      <button
                        onClick={() => handleStatus(listing.id, "sold")}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-ocre-50 text-ocre-600 hover:bg-ocre-100 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Vendue
                      </button>
                    )}
                    {(listing.status === "sold" || listing.status === "expired" || listing.status === "reserved") && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/listings/${listing.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ renew: true }),
                            });
                            const d = await res.json().catch(() => ({}));
                            if (res.ok) {
                              setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, status: "active" } : l));
                            } else {
                              alert(d.message || d.error || "Impossible de réactiver l'annonce (limite atteinte).");
                            }
                          } catch {}
                        }}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-vertprofond-50 text-vertprofond-600 hover:bg-vertprofond-100 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Réactiver
                      </button>
                    )}
                    {listing.status === "suspended" && (
                      <span className="text-[11px] px-2.5 py-1.5 text-rougeterre-500">
                        Suspendue par un administrateur
                      </span>
                    )}
                    {listing.status === "SUSPENDED_BY_QUOTA" && (
                      <Link
                        href="/abonnement"
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-ocre-50 text-ocre-600 hover:bg-ocre-100 transition-colors"
                      >
                        Suspendue : limite de votre offre dépassée. Voir les formules pour la réactiver.
                      </Link>
                    )}
                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-beigebrume-100 text-charbon-400 hover:bg-beigebrume-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Voir
                    </Link>
                    {deleteConfirm === listing.id ? (
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-rougeterre-500 text-white"
                        >
                          <Trash2 className="w-3 h-3" /> Confirmer
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-beigebrume-100 text-charbon-400"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(listing.id)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-rougeterre-50 text-rougeterre-500 hover:bg-rougeterre-100 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
