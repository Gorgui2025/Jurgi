"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Shield,
  ArrowLeft,
  Phone,
  MessageCircle,
  MessageSquare,
  Star,
  Store,
  Calendar,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string | null; avatar: string | null };
}

export interface SellerProfile {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  region: string | null;
  commune: string | null;
  roles: string;
  isVerified: boolean;
  verifiedLevel: string;
  phone: string | null;
  whatsapp: string | null;
  phoneVisible: boolean;
  createdAt: string;
  _count: { listings: number };
}

const ROLE_LABELS: Record<string, string> = {
  eleveur: "Éleveur",
  vendeur_animaux: "Vendeur d'animaux",
  veterinaire: "Vétérinaire",
  transporteur: "Transporteur",
  formateur: "Formateur",
  institut: "Institution",
};

export default function SellerProfileClient({
  initialSeller,
}: {
  initialSeller: SellerProfile;
}) {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [seller, setSeller] = useState<SellerProfile | null>(initialSeller);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<"success" | "error" | null>(null);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews?userId=${params.id}`).then((r) => r.json()),
      fetch(`/api/listings?userId=${params.id}`).then((r) => r.json()),
    ]).then(([reviewsData, listingsData]) => {
      setReviews(reviewsData.reviews || []);
      setReviewsAvg(reviewsData.average);
      setReviewsCount(reviewsData.count || 0);
      setListings(Array.isArray(listingsData) ? listingsData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleSubmitReview = async () => {
    if (!session?.user?.id) { router.push("/connexion"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: session.user.id,
          userId: params.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment || null,
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setReviewsCount((prev) => prev + 1);
        const allRatings = [newReview.rating, ...reviews.map((r) => r.rating)];
        setReviewsAvg(allRatings.reduce((a, b) => a + b, 0) / allRatings.length);
        setReviewResult("success");
      } else {
        const data = await res.json();
        setReviewResult("error");
        setReviewError(data.error || "Erreur");
      }
    } catch {
      setReviewResult("error");
      setReviewError("Erreur de connexion");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-charbon-400 mb-4">Profil non trouvé</p>
          <Link href="/marketplace" className="btn-primary">Retour</Link>
        </div>
      </div>
    );
  }

  const roles: string[] = JSON.parse(seller.roles || "[]");
  const memberSince = new Date(seller.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="page-container max-w-3xl mx-auto py-6 px-4">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-baobab-500 hover:text-baobab-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-baobab-500 rounded-full flex items-center justify-center shrink-0">
            {seller.avatar ? (
              <img src={seller.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-2xl">{seller.name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-charbon-500">{seller.name}</h1>
              {seller.isVerified && (
                <span className="badge-verified text-[11px]">
                  <Shield className="w-3 h-3" /> Vérifié
                </span>
              )}
            </div>
            {seller.bio && <p className="text-sm text-charbon-400 mt-1">{seller.bio}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charbon-300">
              {(seller.region || seller.commune) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {seller.commune ? `${seller.commune}, ` : ""}{seller.region || "Sénégal"}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                {seller._count.listings} annonce{seller._count.listings > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Membre depuis {memberSince}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {roles.map((r) => (
                <span key={r} className="px-2.5 py-1 bg-vertbrume-100 text-baobab-600 rounded-full text-xs font-medium">
                  {ROLE_LABELS[r] || r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-beigebrume-100">
          {seller.phoneVisible && seller.phone && (
            <a href={`tel:${seller.phone}`} className="btn-primary text-sm flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Appeler
            </a>
          )}
          {seller.whatsapp && (
            <a
              href={`https://wa.me/${seller.whatsapp.replace(/\s/g, "").replace("+", "")}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {session?.user?.id && session.user.id !== seller.id && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ senderId: session.user.id, receiverId: seller.id }),
                  });
                  if (res.ok) { const conv = await res.json(); router.push(`/messages/${conv.id}`); }
                } catch {}
              }}
              className="btn-outline text-sm flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          )}
          {session?.user?.id && session.user.id !== seller.id && (
            <button
              onClick={() => { setShowReviewModal(true); setReviewResult(null); setReviewForm({ rating: 5, comment: "" }); }}
              className="btn-outline text-sm flex items-center gap-1.5 text-ocre-600"
            >
              <Star className="w-4 h-4" /> Avis
            </button>
          )}
        </div>
      </div>

      {/* Avis */}
      <div className="card p-5 mb-6">
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
          <p className="text-sm text-charbon-300">Aucun avis pour le moment</p>
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

      {/* Annonces du vendeur */}
      {listings.length > 0 && (
        <div>
          <h2 className="font-semibold text-charbon-500 mb-4">Annonces ({listings.length})</h2>
          <div className="space-y-3">
            {listings.map((l: any) => {
              const photos: string[] = JSON.parse(l.photos || "[]");
              return (
                <Link key={l.id} href={`/marketplace/${l.id}`} className="card-hover p-4 flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-sable-200 shrink-0 overflow-hidden">
                    {photos[0] ? (
                       <img src={photos[0]} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-charbon-200" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-charbon-500 truncate">{l.title}</h3>
                    <p className="text-sm font-bold text-baobab-500 mt-1">
                      {l.priceOnDemand ? "Prix à la demande" : l.price ? `${l.price.toLocaleString()} ${l.currency}` : "Gratuit"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-charbon-300">
                      <span>{l.region || "Sénégal"}</span>
                      {l.status === "sold" && <span className="text-vertprofond-500 font-medium">Vendu</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {reviewResult === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-vertprofond-500" />
                </div>
                <h3 className="text-lg font-bold text-charbon-500 mb-2">Avis envoyé !</h3>
                <p className="text-sm text-charbon-400 mb-4">Merci pour votre retour</p>
                <button onClick={() => setShowReviewModal(false)} className="btn-primary">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-charbon-500">Laisser un avis</h3>
                  <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                    <X className="w-5 h-5 text-charbon-400" />
                  </button>
                </div>

                {reviewResult === "error" && (
                  <div className="flex items-center gap-2 bg-rougeterre-50 text-rougeterre-500 text-sm p-3 rounded-lg mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {reviewError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="input-label">Note *</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="p-0.5">
                        <Star className={`w-7 h-7 transition-colors ${
                          s <= reviewForm.rating ? "text-ocre-500 fill-ocre-500" : "text-charbon-200 hover:text-ocre-300"
                        }`} />
                      </button>
                    ))}
                    <span className="text-sm text-charbon-400 ml-2">{reviewForm.rating}/5</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="input-label">Commentaire (optionnel)</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Décrivez votre expérience..."
                    className="input-field min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="btn-primary w-full"
                >
                  {reviewSubmitting ? "Envoi..." : "Envoyer l'avis"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
