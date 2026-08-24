"use client";

import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Eye,
  Heart,
  Share2,
  Flag,
  ChevronRight,
  Tag,
  Weight,
  Ruler,
  Activity,
  CheckCircle,
  Star,
  AlertTriangle,
  Film,
  X,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string | null; avatar: string | null };
}

interface ListingUser {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  isVerified: boolean;
  verifiedLevel: string;
  createdAt: string;
  region: string | null;
  phoneVisible: boolean;
  _count: { listings: number };
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  priceOnDemand: boolean;
  currency: string;
  photos: string;
  videos: string;
  species: string | null;
  breed: string | null;
  sex: string | null;
  age: string | null;
  weight: string | null;
  quantity: number | null;
  healthInfo: string | null;
  availability: string;
  status: string;
  region: string | null;
  commune: string | null;
  views: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  user: ListingUser;
  category: { name: string; slug: string; domain: string };
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<"success" | "error" | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactResult, setContactResult] = useState<"success" | "error" | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`);
      if (!res.ok) {
        setError("Annonce non trouvée");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setListing(data);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    if (listing?.user?.id) {
      fetch(`/api/reviews?userId=${listing.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setReviews(data.reviews || []);
          setReviewsAvg(data.average);
          setReviewsCount(data.count || 0);
        })
        .catch(() => {});
    }
  }, [listing?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-charbon-400 mb-4">{error || "Annonce introuvable"}</p>
          <Link href="/marketplace" className="btn-primary">
            Retour à la marketplace
          </Link>
        </div>
      </div>
    );
  }

  const photos: string[] = JSON.parse(listing.photos || "[]");
  const videos: string[] = JSON.parse(listing.videos || "[]");
  const memberSince = new Date(listing.user.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const sellerInitial = listing.user.name?.charAt(0) || "U";

  const handleSubmitReview = async () => {
    if (!session?.user?.id) { router.push("/connexion"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: session.user.id,
          userId: listing.user.id,
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

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-charbon-300 mb-6">
        <Link href="/marketplace" className="hover:text-baobab-500 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Marketplace
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/marketplace" className="hover:text-baobab-500">
          {listing.category.name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-charbon-400 truncate">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-sable-200">
              {photos.length > 0 ? (
                <img
                  src={photos[activeImage]}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tag className="w-16 h-16 text-charbon-200" />
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="badge bg-white/90 text-charbon-500">{listing.category.name}</span>
                {listing.featured && (
                  <span className="badge bg-ocre-500 text-white">En vedette</span>
                )}
              </div>
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? "border-baobab-500" : "border-transparent"
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Videos */}
          {videos.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-3">
                <h3 className="text-sm font-medium text-charbon-500 mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-baobab-500" />
                  Vidéos ({videos.length})
                </h3>
                <div className="space-y-3">
                  {videos.map((video, i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-charbon-500">
                      <video
                        src={video}
                        controls
                        playsInline
                        className="w-full aspect-video object-contain"
                        preload="metadata"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Title & price */}
          <div>
            <h1 className="text-2xl font-bold text-charbon-500">{listing.title}</h1>
            <p className="text-2xl font-bold text-baobab-500 mt-2">
              {listing.priceOnDemand
                ? "Prix à la demande"
                : listing.price
                ? `${listing.price.toLocaleString()} ${listing.currency}`
                : "Gratuit"}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-charbon-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.commune ? `${listing.commune}, ` : ""}{listing.region || "Sénégal"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatDate(listing.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {listing.views} vues
              </span>
            </div>
          </div>

          {/* Characteristics */}
          {(listing.species || listing.breed || listing.sex || listing.age || listing.weight) && (
            <div className="card p-5">
              <h2 className="font-semibold text-charbon-500 mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {listing.species && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Espèce</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.species}</p>
                  </div>
                )}
                {listing.breed && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Race</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.breed}</p>
                  </div>
                )}
                {listing.sex && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Sexe</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.sex}</p>
                  </div>
                )}
                {listing.age && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Âge</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.age}</p>
                  </div>
                )}
                {listing.weight && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Poids</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.weight}</p>
                  </div>
                )}
                {listing.quantity && (
                  <div className="bg-vertbrume-50 rounded-lg p-3">
                    <span className="text-[11px] text-charbon-300 uppercase tracking-wide">Quantité</span>
                    <p className="text-sm font-medium text-charbon-500 mt-0.5">{listing.quantity}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-charbon-500 mb-3">Description</h2>
            <div className="text-sm text-charbon-400 whitespace-pre-line leading-relaxed">
              {listing.description}
            </div>
          </div>

          {/* Health info */}
          {listing.healthInfo && (
            <div className="card p-5">
              <h2 className="font-semibold text-charbon-500 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-vertprofond-500" />
                Informations sanitaires
              </h2>
              <p className="text-sm text-charbon-400">{listing.healthInfo}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-charbon-500">Avis sur le vendeur</h2>
              {reviewsAvg != null && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-ocre-500 fill-ocre-500" />
                  <span className="text-sm font-bold text-charbon-500">{Number(reviewsAvg).toFixed(1)}</span>
                  <span className="text-xs text-charbon-300">({reviewsCount})</span>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-charbon-300">Aucun avis pour ce vendeur</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((r) => (
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

          {/* Warning */}
          <div className="bg-ambre-50 border border-ambre-200 rounded-xl p-4">
            <p className="text-sm text-ambre-600 font-medium mb-1">Avertissement</p>
            <p className="text-xs text-ambre-400">
              Vérifiez toujours l&apos;identité du vendeur et l&apos;état de l&apos;animal avant toute
              transaction. Jurgi ne garantit pas l&apos;état sanitaire ni la qualité des
              annonces.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <h3 className="font-semibold text-charbon-500 mb-4">Contacter le vendeur</h3>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-beigebrume-100">
              <div className="w-12 h-12 rounded-full bg-baobab-500 flex items-center justify-center shrink-0">
                {listing.user.avatar ? (
                  <img src={listing.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{sellerInitial}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-charbon-500 truncate">{listing.user.name}</p>
                <div className="flex items-center gap-2">
                  {listing.user.isVerified && (
                    <span className="badge-verified text-[10px]">
                      <Shield className="w-3 h-3" /> Vérifié
                    </span>
                  )}
                </div>
                {listing.user.bio && (
                  <p className="text-xs text-charbon-300 mt-1 line-clamp-2">{listing.user.bio}</p>
                )}
                <p className="text-xs text-charbon-300 mt-0.5">
                  {listing.user._count.listings} annonce{listing.user._count.listings > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {listing.user.phone && (
                <a
                  href={`tel:${listing.user.phone}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </a>
              )}
              {listing.user.whatsapp && (
                <a
                  href={`https://wa.me/${listing.user.whatsapp.replace(/\s/g, "").replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl font-medium text-vertprofond-600 bg-vertprofond-100 hover:bg-vertprofond-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {session?.user?.id && session.user.id !== listing.user.id && (
                <button
                  onClick={() => {
                    if (!session?.user?.id) { router.push("/connexion"); return; }
                    setShowContactModal(true);
                    setContactResult(null);
                    setContactForm({ subject: `Concernant : ${listing.title}`, message: "" });
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter le vendeur
                </button>
              )}
              {session?.user?.id && session.user.id !== listing.user.id && (
                <button
                  onClick={() => { setShowReviewModal(true); setReviewResult(null); setReviewForm({ rating: 5, comment: "" }); }}
                  className="w-full flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl font-medium text-ocre-600 bg-ocre-50 hover:bg-ocre-100 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Laisser un avis
                </button>
              )}
              <button
                onClick={async () => {
                  if (!session?.user?.id) {
                    router.push("/connexion");
                    return;
                  }
                  if (session.user.id === listing.user.id) return;
                  try {
                    const res = await fetch("/api/conversations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        senderId: session.user.id,
                        receiverId: listing.user.id,
                      }),
                    });
                    if (res.ok) {
                      const conv = await res.json();
                      router.push(`/messages/${conv.id}`);
                    }
                  } catch {}
                }}
                disabled={session?.user?.id === listing.user.id}
                className="btn-outline w-full flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                {session?.user?.id === listing.user.id ? "Votre annonce" : "Message interne"}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-beigebrume-100">
              <p className="text-xs text-charbon-300 text-center">
                Membre depuis {memberSince}
              </p>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-rougeterre-400 hover:text-rougeterre-500 transition-colors"
            >
              <Flag className="w-3 h-3" />
              Signaler cette annonce
            </button>
          </div>
        </div>
      </div>

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
                <p className="text-sm text-charbon-400 mb-4">Merci pour votre retour sur {listing.user.name}</p>
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
                <div className="bg-vertbrume-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-baobab-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">{sellerInitial}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charbon-500">{listing.user.name}</p>
                    <p className="text-xs text-charbon-300">{listing.user._count.listings} annonce{listing.user._count.listings > 1 ? "s" : ""}</p>
                  </div>
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
                      <button
                        key={s}
                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                        className="p-0.5"
                      >
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
                    placeholder="Décrivez votre expérience avec ce vendeur..."
                    className="input-field min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="btn-primary w-full"
                >
                  {reviewSubmitting ? "Envoi en cours..." : "Envoyer l'avis"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contact modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {contactResult === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-vertprofond-500" />
                </div>
                <h3 className="text-lg font-bold text-charbon-500 mb-2">Message envoyé !</h3>
                <p className="text-sm text-charbon-400 mb-4">{listing.user.name} recevra votre message.</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setShowContactModal(false)} className="btn-primary">Fermer</button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/conversations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ senderId: (session?.user as any)?.id, receiverId: listing.user.id }),
                        });
                        if (res.ok) {
                          const conv = await res.json();
                          router.push(`/messages/${conv.id}`);
                        }
                      } catch {}
                    }}
                    className="btn-outline text-sm"
                  >
                    Ouvrir la messagerie
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-charbon-500">Contacter {listing.user.name}</h3>
                  <button onClick={() => setShowContactModal(false)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                    <X className="w-5 h-5 text-charbon-400" />
                  </button>
                </div>
                <div className="bg-vertbrume-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-baobab-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">{sellerInitial}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charbon-500">{listing.user.name}</p>
                    <p className="text-xs text-charbon-300">{listing.category.name}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-medium text-charbon-400 mb-1 block">Sujet</label>
                  <input
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Objet de votre message"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-charbon-400 mb-1 block">Message *</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="input-field text-sm min-h-[120px] resize-none"
                    placeholder="Décrivez votre besoin, posez votre question..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!contactForm.message.trim()) return;
                      setContactSending(true);
                      try {
                        const convRes = await fetch("/api/conversations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ senderId: (session?.user as any)?.id, receiverId: listing.user.id }),
                        });
                        if (convRes.ok) {
                          const conv = await convRes.json();
                          await fetch("/api/messages", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              conversationId: conv.id,
                              senderId: (session?.user as any)?.id,
                              content: `📋 ${contactForm.subject}\n\n${contactForm.message}`,
                            }),
                          });
                          setContactResult("success");
                        }
                      } catch { setContactResult("error"); }
                      setContactSending(false);
                    }}
                    disabled={!contactForm.message.trim() || contactSending}
                    className="btn-primary flex-1"
                  >
                    {contactSending ? "Envoi..." : "Envoyer"}
                  </button>
                  <button onClick={() => setShowContactModal(false)} className="btn-ghost">Annuler</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charbon-500">Signaler l&apos;annonce</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                <X className="w-5 h-5 text-charbon-400" />
              </button>
            </div>
            <p className="text-sm text-charbon-400 mb-4">Pourquoi signalez-vous cette annonce ?</p>
            <div className="space-y-2">
              {["Prix suspect", "Annonce frauduleuse", "Animal maltraité", "Informations fausses", "Autre"].map((reason) => (
                <button
                  key={reason}
                  onClick={async () => {
                    if (!session?.user?.id) { router.push("/connexion"); return; }
                    setReportSending(true);
                    try {
                      await fetch("/api/reports", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          reporterId: (session?.user as any)?.id,
                          targetType: "listing",
                          targetId: listing.id,
                          reason,
                        }),
                      });
                    } catch {}
                    setReportSending(false);
                    setShowReportModal(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-beigebrume-200 hover:border-baobab-300 hover:bg-vertbrume-50 text-sm text-charbon-400 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
