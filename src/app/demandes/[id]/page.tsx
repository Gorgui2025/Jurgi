"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Clock,
  Eye,
  Calendar,
  Shield,
  Phone,
  MessageCircle,
  X,
  CheckCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

interface RequestUser {
  id: string;
  name: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: string;
  _count: { listings: number };
}

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  quantity: string | null;
  budget: string | null;
  region: string | null;
  commune: string | null;
  deadline: string | null;
  urgency: string;
  status: string;
  views: number;
  createdAt: string;
  user: RequestUser;
  category: { name: string; slug: string } | null;
  _count: { responses: number };
}

interface ResponseItem {
  id: string;
  message: string;
  price: number | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    isVerified: boolean;
    phone: string | null;
    whatsapp: string | null;
    phoneVisible: boolean;
  };
}

export default function DemandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [demand, setDemand] = useState<RequestDetail | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({ message: "", price: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/requests/${params.id}`).then((r) => r.json()),
      fetch(`/api/request-responses?requestId=${params.id}`).then((r) => r.json()),
    ]).then(([demandData, responsesData]) => {
      setDemand(demandData);
      setResponses(Array.isArray(responsesData) ? responsesData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleSubmitResponse = async () => {
    if (!session?.user?.id || !responseForm.message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/request-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: params.id,
          userId: session.user.id,
          message: responseForm.message,
          price: responseForm.price || null,
        }),
      });
      if (res.ok) {
        const newResponse = await res.json();
        setResponses((prev) => [newResponse, ...prev]);
        setDemand((prev) => prev ? { ...prev, _count: { responses: prev._count.responses + 1 } } : prev);
        setResult("success");
      } else {
        const data = await res.json();
        setResult("error");
        setError(data.error || "Erreur");
      }
    } catch {
      setResult("error");
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-charbon-400 mb-4">Demande non trouvée</p>
          <Link href="/demandes" className="btn-primary">Retour aux demandes</Link>
        </div>
      </div>
    );
  }

  const isOwner = (session?.user as any)?.id && demand.user.id && (session?.user as any).id === demand.user.id;
  const memberSince = new Date(demand.user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="page-container max-w-3xl mx-auto py-6 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-charbon-300 mb-6">
        <Link href="/demandes" className="hover:text-baobab-500 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Demandes
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-charbon-400 truncate">{demand.title}</span>
      </div>

      {/* Main */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">
            {demand.category?.name || "Général"}
          </span>
          {demand.urgency === "urgent" && (
            <span className="badge-error text-[11px]">Urgent</span>
          )}
        </div>

        <h1 className="text-xl font-bold text-charbon-500 mb-3">{demand.title}</h1>
        <p className="text-sm text-charbon-400 whitespace-pre-line leading-relaxed">{demand.description}</p>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-charbon-300">
          {(demand.commune || demand.region) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {demand.commune ? `${demand.commune}, ` : ""}{demand.region || "Sénégal"}
            </span>
          )}
          {demand.budget && <span>💰 {demand.budget}</span>}
          {demand.quantity && <span>📦 {demand.quantity}</span>}
          {demand.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {demand.deadline}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {demand.views} vues
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(demand.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Response button */}
        {!isOwner && session?.user?.id && (
          <button
            onClick={() => { setShowResponseModal(true); setResult(null); setResponseForm({ message: "", price: "" }); }}
            className="btn-primary mt-6 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Répondre à cette demande
          </button>
        )}
        {!session?.user?.id && (
          <Link href="/connexion" className="btn-primary mt-6 inline-flex items-center gap-2">
            <Send className="w-4 h-4" />
            Se connecter pour répondre
          </Link>
        )}
      </div>

      {/* Seller card */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-baobab-500 flex items-center justify-center shrink-0">
            {demand.user.avatar ? (
              <img src={demand.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{demand.user.name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-charbon-500">{demand.user.name}</p>
              {demand.user.isVerified && (
                <span className="badge-verified text-[10px]">
                  <Shield className="w-3 h-3" /> Vérifié
                </span>
              )}
            </div>
            <p className="text-xs text-charbon-300">
              {demand.user._count.listings} annonce{demand.user._count.listings > 1 ? "s" : ""} · Membre depuis {memberSince}
            </p>
          </div>
          <Link href={`/profil/${demand.user.id}`} className="btn-outline text-xs py-1.5 px-3">
            Voir profil
          </Link>
        </div>
      </div>

      {/* Responses */}
      <div className="card p-5">
        <h2 className="font-semibold text-charbon-500 mb-4">
          Réponses ({responses.length})
        </h2>
        {responses.length === 0 ? (
          <p className="text-sm text-charbon-300">Aucune réponse pour le moment</p>
        ) : (
          <div className="space-y-4">
            {responses.map((r) => (
              <div key={r.id} className="border border-beigebrume-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-baobab-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-baobab-600">{r.user.name?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charbon-500">{r.user.name}</span>
                      {r.user.isVerified && (
                        <span className="badge-verified text-[10px]">
                          <Shield className="w-3 h-3" /> Vérifié
                        </span>
                      )}
                      {r.price != null && (
                        <span className="badge bg-vertprofond-100 text-vertprofond-600 text-[11px] font-bold">
                          {Number(r.price).toLocaleString()} FCFA
                        </span>
                      )}
                      {r.status === "accepted" && (
                        <span className="badge bg-vertprofond-500 text-white text-[11px]">Acceptée</span>
                      )}
                    </div>
                    <p className="text-sm text-charbon-400 mt-1 whitespace-pre-line">{r.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-charbon-200">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {isOwner && r.status === "pending" && (
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={async () => {
                              await fetch("/api/request-responses", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: r.id, status: "accepted" }),
                              });
                              setResponses((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "accepted" } : x));
                            }}
                            className="text-[11px] text-vertprofond-500 font-medium hover:underline flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Accepter
                          </button>
                        </div>
                      )}
                      {r.user.phoneVisible && r.user.phone && (
                        <a href={`tel:${r.user.phone}`} className="text-[11px] text-baobab-500 hover:underline flex items-center gap-1 ml-auto">
                          <Phone className="w-3 h-3" /> Appeler
                        </a>
                      )}
                      {r.user.whatsapp && (
                        <a
                          href={`https://wa.me/${r.user.whatsapp.replace(/\s/g, "").replace("+", "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-vertprofond-500 hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowResponseModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {result === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-vertprofond-500" />
                </div>
                <h3 className="text-lg font-bold text-charbon-500 mb-2">Réponse envoyée !</h3>
                <p className="text-sm text-charbon-400 mb-4">{demand.user.name} sera notifié de votre réponse</p>
                <button onClick={() => setShowResponseModal(false)} className="btn-primary">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-charbon-500">Répondre à la demande</h3>
                  <button onClick={() => setShowResponseModal(false)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                    <X className="w-5 h-5 text-charbon-400" />
                  </button>
                </div>

                <div className="bg-vertbrume-50 rounded-xl p-3 mb-4">
                  <p className="text-sm font-medium text-charbon-500">{demand.title}</p>
                  {demand.budget && <p className="text-xs text-charbon-300 mt-1">Budget : {demand.budget}</p>}
                </div>

                {result === "error" && (
                  <div className="flex items-center gap-2 bg-rougeterre-50 text-rougeterre-500 text-sm p-3 rounded-lg mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="input-label">Votre proposition *</label>
                    <textarea
                      value={responseForm.message}
                      onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                      placeholder="Décrivez votre offre, vos disponibilités..."
                      className="input-field min-h-[100px] resize-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="input-label">Prix proposé (FCFA, optionnel)</label>
                    <input
                      type="number"
                      value={responseForm.price}
                      onChange={(e) => setResponseForm({ ...responseForm, price: e.target.value })}
                      placeholder="Ex: 250000"
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseForm.message || submitting}
                  className="btn-primary w-full mt-4"
                >
                  {submitting ? "Envoi..." : "Envoyer ma réponse"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
