"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Clock, Users, BookOpen, ArrowRight, Calendar, X, Check, AlertTriangle } from "lucide-react";

const LEVELS = ["Tous", "Débutant", "Intermédiaire", "Avancé"];

interface Training {
  id: string;
  title: string;
  provider: string;
  type: string;
  level: string;
  duration: string;
  format: string;
  price: string;
  location: string;
  date: string;
  maxParticipants: number;
  description: string;
  tags: string;
  _count: { enrollments: number };
}

export default function FormationPage() {
  const { data: session } = useSession();
  const [activeLevel, setActiveLevel] = useState("Tous");
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showDetails, setShowDetails] = useState<Training | null>(null);
  const [enrollForm, setEnrollForm] = useState({ name: "", phone: "" });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<"success" | "error" | null>(null);
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    fetch(`/api/trainings?level=${activeLevel}`)
      .then((res) => res.json())
      .then((data) => {
        setTrainings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeLevel]);

  useEffect(() => {
    if (session?.user) {
      setEnrollForm((prev) => ({
        ...prev,
        name: prev.name || (session.user as any).name || "",
        phone: prev.phone || (session.user as any).phone || "",
      }));
    }
  }, [session]);

  const parseTags = (tags: string) => {
    try { return JSON.parse(tags); } catch { return []; }
  };

  const handleEnroll = async () => {
    if (!selectedTraining || !enrollForm.name || !enrollForm.phone) return;
    setEnrolling(true);
    try {
      const res = await fetch("/api/trainings/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: selectedTraining.id,
          name: enrollForm.name,
          phone: enrollForm.phone,
          userId: (session?.user as any)?.id || null,
        }),
      });

      if (res.ok) {
        setEnrollResult("success");
        setTrainings((prev) => prev.map((t) =>
          t.id === selectedTraining.id
            ? { ...t, _count: { enrollments: t._count.enrollments + 1 } }
            : t
        ));
      } else {
        const data = await res.json();
        setEnrollResult("error");
        setEnrollError(data.error || "Erreur lors de l'inscription");
      }
    } catch {
      setEnrollResult("error");
      setEnrollError("Erreur de connexion");
    } finally {
      setEnrolling(false);
    }
  };

  const filtered = activeLevel === "Tous"
    ? trainings
    : trainings.filter((f) => f.level === activeLevel);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charbon-500">Formation et ressources</h1>
        <p className="text-sm text-charbon-300">
          Formations pratiques, fiches techniques, webinaires et conseils
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setActiveLevel(l)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
              activeLevel === l
                ? "bg-baobab-500 text-white"
                : "bg-white border border-beigebrume-200 text-charbon-400 hover:border-baobab-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <p className="text-sm text-charbon-300 mb-4">
        {filtered.length} formation{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((f) => {
          const placesLeft = f.maxParticipants - f._count.enrollments;
          const tags = parseTags(f.tags);
          const isFull = placesLeft <= 0;

          return (
            <div key={f.id} className="card-hover p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">{f.type}</span>
                <span className="badge bg-ocre-50 text-ocre-600 text-[11px]">{f.level}</span>
                {f.price === "Gratuit" && (
                  <span className="badge bg-vertprofond-500/10 text-vertprofond-500 text-[11px]">Gratuit</span>
                )}
                {isFull && (
                  <span className="badge bg-rougeterre-100 text-rougeterre-500 text-[11px]">Complet</span>
                )}
              </div>
              <h3 className="font-semibold text-charbon-500 mb-1">{f.title}</h3>
              <p className="text-sm text-charbon-300 line-clamp-2 mb-3">{f.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-charbon-300">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {f.provider}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {f.duration}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {f.date}</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {placesLeft > 0 ? `${placesLeft} place${placesLeft > 1 ? "s" : ""}` : "Complet"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-sable-200 text-charbon-400 rounded text-[11px]">{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-beigebrume-100">
                <button
                  onClick={() => {
                    setSelectedTraining(f);
                    setEnrollResult(null);
                    setEnrollForm((prev) => ({
                      ...prev,
                      name: prev.name || (session?.user as any)?.name || "",
                      phone: prev.phone || (session?.user as any)?.phone || "",
                    }));
                  }}
                  disabled={isFull}
                  className={`text-xs py-2 px-4 flex-1 flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors ${
                    isFull
                      ? "bg-charbon-100 text-charbon-300 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  {isFull ? "Complet" : (f.format === "En ligne" ? "Accéder" : "S'inscrire")}
                  {!isFull && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setShowDetails(f)} className="btn-outline text-xs py-2 px-4">
                  Détails
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-300">Aucune formation pour ce niveau</p>
        </div>
      )}

      {/* Modal Inscription */}
      {selectedTraining && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTraining(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {enrollResult === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-vertprofond-500" />
                </div>
                <h3 className="text-lg font-bold text-charbon-500 mb-2">Inscription confirmée !</h3>
                <p className="text-sm text-charbon-400 mb-1">Vous êtes inscrit à :</p>
                <p className="text-sm font-medium text-charbon-500 mb-4">{selectedTraining.title}</p>
                <p className="text-xs text-charbon-300 mb-4">{selectedTraining.date} · {selectedTraining.location}</p>
                <button onClick={() => setSelectedTraining(null)} className="btn-primary">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-charbon-500">S&apos;inscrire à la formation</h3>
                  <button onClick={() => setSelectedTraining(null)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                    <X className="w-5 h-5 text-charbon-400" />
                  </button>
                </div>
                <div className="bg-vertbrume-50 rounded-xl p-3 mb-4">
                  <p className="text-sm font-medium text-charbon-500">{selectedTraining.title}</p>
                  <p className="text-xs text-charbon-300 mt-1">{selectedTraining.provider} · {selectedTraining.type}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-charbon-400 mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedTraining.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedTraining.duration}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {selectedTraining.maxParticipants - selectedTraining._count.enrollments} places
                    </span>
                  </div>
                  <p className="text-sm font-bold text-baobab-500 mt-2">{selectedTraining.price}</p>
                </div>

                {enrollResult === "error" && (
                  <div className="flex items-center gap-2 bg-rougeterre-50 text-rougeterre-500 text-sm p-3 rounded-lg mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {enrollError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="input-label">Nom complet *</label>
                    <input type="text" value={enrollForm.name} onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })} placeholder="Votre nom" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Téléphone *</label>
                    <input type="tel" value={enrollForm.phone} onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })} placeholder="+221 77 123 45 67" className="input-field" />
                  </div>
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={!enrollForm.name || !enrollForm.phone || enrolling}
                  className="btn-primary w-full mt-4"
                >
                  {enrolling ? "Inscription en cours..." : "Confirmer l'inscription"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charbon-500">Détails de la formation</h3>
              <button onClick={() => setShowDetails(null)} className="p-1 hover:bg-beigebrume-100 rounded-lg">
                <X className="w-5 h-5 text-charbon-400" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-vertbrume-100 text-baobab-600 text-[11px]">{showDetails.type}</span>
              <span className="badge bg-ocre-50 text-ocre-600 text-[11px]">{showDetails.level}</span>
              {showDetails.price === "Gratuit" && (
                <span className="badge bg-vertprofond-500/10 text-vertprofond-500 text-[11px]">Gratuit</span>
              )}
            </div>
            <h4 className="font-semibold text-charbon-500 mb-2">{showDetails.title}</h4>
            <p className="text-sm text-charbon-300 mb-4">{showDetails.description}</p>
            <div className="space-y-2 text-sm text-charbon-400">
              <div className="flex justify-between"><span className="text-charbon-300">Organisateur</span><span className="font-medium">{showDetails.provider}</span></div>
              <div className="flex justify-between"><span className="text-charbon-300">Date</span><span className="font-medium">{showDetails.date}</span></div>
              <div className="flex justify-between"><span className="text-charbon-300">Durée</span><span className="font-medium">{showDetails.duration}</span></div>
              <div className="flex justify-between"><span className="text-charbon-300">Format</span><span className="font-medium">{showDetails.format}</span></div>
              <div className="flex justify-between"><span className="text-charbon-300">Lieu</span><span className="font-medium">{showDetails.location}</span></div>
              <div className="flex justify-between"><span className="text-charbon-300">Prix</span><span className="font-bold text-baobab-500">{showDetails.price}</span></div>
              <div className="flex justify-between">
                <span className="text-charbon-300">Places</span>
                <span className="font-medium">{showDetails.maxParticipants - showDetails._count.enrollments} / {showDetails.maxParticipants}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5 pt-4 border-t border-beigebrume-100">
              <button
                onClick={() => {
                  setShowDetails(null);
                  setSelectedTraining(showDetails);
                  setEnrollResult(null);
                  setEnrollForm((prev) => ({
                    ...prev,
                    name: prev.name || (session?.user as any)?.name || "",
                    phone: prev.phone || (session?.user as any)?.phone || "",
                  }));
                }}
                disabled={showDetails.maxParticipants - showDetails._count.enrollments <= 0}
                className="btn-primary flex-1"
              >
                S&apos;inscrire
              </button>
              <button onClick={() => setShowDetails(null)} className="btn-outline">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
