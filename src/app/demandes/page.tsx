"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock, Plus, MessageCircle, Phone, Send } from "lucide-react";

interface RequestItem {
  id: string;
  title: string;
  description: string;
  category?: { name?: string | null } | null;
  budget?: string | null;
  quantity?: string | null;
  region?: string | null;
  commune?: string | null;
  deadline?: string | null;
  urgency?: string | null;
  _count?: { responses?: number };
  createdAt: string;
  user?: { name?: string | null } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const FILTERS = ["all", "Bovins", "Volailles", "Alimentation", "Transport", "Santé", "Équipements"];

export default function DemandesPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "50");

    fetch(`/api/requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredRequests = selectedDomain === "all"
    ? requests
    : requests.filter((r) => r.category?.name?.toLowerCase().includes(selectedDomain.toLowerCase()));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charbon-500">Demandes de devis</h1>
          <p className="text-sm text-charbon-300">
            Publiez vos besoins ou répondez aux demandes existantes
          </p>
        </div>
        <Link href="/demandes/publier" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Publier une demande
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {FILTERS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selectedDomain === d
                ? "bg-baobab-500 text-white"
                : "bg-white border border-beigebrume-200 text-charbon-400 hover:border-baobab-200"
            }`}
          >
            {d === "all" ? "Toutes" : d}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-charbon-300 text-sm">Chargement des demandes...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const location = req.commune
              ? `${req.commune}, ${req.region || "Sénégal"}`
              : req.region || "Sénégal";
            const responses = req._count?.responses || 0;

            return (
              <div key={req.id} className="card-hover p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">
                        {req.category?.name || "Général"}
                      </span>
                      {req.urgency === "urgent" && (
                        <span className="badge-error text-[11px]">Urgent</span>
                      )}
                    </div>
                    <Link href={`/demandes/${req.id}`} className="hover:text-baobab-600 transition-colors">
                      <h3 className="font-semibold text-charbon-500">{req.title}</h3>
                    </Link>
                    <p className="text-sm text-charbon-300 mt-1 line-clamp-2">{req.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-charbon-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {location}
                      </span>
                      {req.budget && <span>💰 {req.budget}</span>}
                      {req.quantity && <span>📦 {req.quantity}</span>}
                      {req.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {req.deadline}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-beigebrume-100">
                      <span className="text-xs text-charbon-300">
                        Par <span className="font-medium text-charbon-400">{req.user?.name || "Anonyme"}</span> · {timeAgo(req.createdAt)}
                      </span>
                      <span className="text-xs text-baobab-500 font-medium">
                        {responses} réponse{responses > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/demandes/${req.id}`}
                      className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Voir / Répondre
                    </Link>
                    <button className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Appeler
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredRequests.length === 0 && (
        <div className="text-center py-16">
          <Send className="w-10 h-10 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-300 text-lg mb-2">Aucune demande</p>
          <p className="text-charbon-200 text-sm">
            Soyez le premier à publier une demande de devis.
          </p>
          <Link href="/demandes/publier" className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Publier une demande
          </Link>
        </div>
      )}
    </div>
  );
}
