"use client";

import { useState, useEffect } from "react";
import {
  Bot, MessageCircle, MessageSquare, XCircle, Star,
  TrendingUp, MapPin, RefreshCw, Loader2, ListOrdered, ThumbsUp, HelpCircle,
} from "lucide-react";

interface SinyData {
  stats: {
    totalQuestions: number;
    conversations: number;
    answered: number;
    unanswered: number;
    satisfaction: {
      average: number;
      count: number;
      distribution: { rating: number; count: number }[];
      comments: { comment: string | null; rating: number; createdAt: string }[];
    };
  };
  topQuestions: { question: string; count: number }[];
  byIntent: { intent: string; label: string; count: number }[];
  byRegion: { region: string; count: number }[];
  daily: { date: string; count: number }[];
  weekly: { weekStart: string; count: number }[];
}

const EMPTY: SinyData = {
  stats: { totalQuestions: 0, conversations: 0, answered: 0, unanswered: 0, satisfaction: { average: 0, count: 0, distribution: [], comments: [] } },
  topQuestions: [],
  byIntent: [],
  byRegion: [],
  daily: [],
  weekly: [],
};

export default function SinyAnalyticsTab() {
  const [data, setData] = useState<SinyData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/siny-analytics")
      .then((r) => r.json())
      .then((d) => { setData(d || EMPTY); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /><p className="text-sm text-charbon-300 mt-2">Analyse des conversations Siny...</p></div>;
  }

  const s = data.stats;
  const maxIntent = Math.max(1, ...data.byIntent.map((i) => i.count));
  const maxRegion = Math.max(1, ...data.byRegion.map((r) => r.count));
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.count));

  const maxStars = s.satisfaction.count > 0 ? Math.max(1, ...s.satisfaction.distribution.map((d) => d.count)) : 1;

  const cards = [
    { label: "Conversations", value: s.conversations, icon: <MessageCircle className="w-5 h-5" />, color: "text-baobab-500" },
    { label: "Questions posées", value: s.totalQuestions, icon: <MessageSquare className="w-5 h-5" />, color: "text-vertprofond-500" },
    { label: "Questions répondues", value: s.answered, icon: <ThumbsUp className="w-5 h-5" />, color: "text-baobab-500" },
    { label: "Sans réponse", value: s.unanswered, icon: <XCircle className="w-5 h-5" />, color: s.unanswered > 0 ? "text-rougeterre-500" : "text-charbon-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-charbon-500 flex items-center gap-2">
          <Bot className="w-5 h-5 text-baobab-500" /> Siny — Analytique
        </h2>
        <button onClick={load} className="flex items-center gap-2 text-sm text-baobab-500 hover:text-baobab-600"><RefreshCw className="w-4 h-4" /> Actualiser</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-charbon-300">{c.label}</p>
              <span className={c.color}>{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString("fr-FR")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><ListOrdered className="w-4 h-4 text-baobab-500" /> Questions les plus fréquentes</h3>
          {data.topQuestions.length === 0 ? (
            <p className="text-sm text-charbon-300 text-center py-4">Aucune donnée pour le moment</p>
          ) : (
            <div className="space-y-2">
              {data.topQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-charbon-200 w-4">{i + 1}.</span>
                  <span className="text-xs text-charbon-500 flex-1 truncate">{q.question}</span>
                  <span className="text-xs font-semibold text-baobab-500">{q.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><HelpCircle className="w-4 h-4 text-baobab-500" /> Sujets les plus demandés</h3>
          {data.byIntent.length === 0 ? (
            <p className="text-sm text-charbon-300 text-center py-4">Aucune donnée pour le moment</p>
          ) : (
            <div className="space-y-2">
              {data.byIntent.map((it) => (
                <div key={it.intent} className="flex items-center gap-3">
                  <span className="text-xs text-charbon-500 w-40 shrink-0 truncate">{it.label}</span>
                  <div className="flex-1 h-2 bg-beigebrume-100 rounded-full overflow-hidden">
                    <div className="h-full bg-baobab-500 rounded-full" style={{ width: `${(it.count / maxIntent) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-charbon-500 w-8 text-right">{it.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-ocre-500" /> Demandes par région</h3>
          {data.byRegion.length === 0 ? (
            <p className="text-sm text-charbon-300 text-center py-4">Aucune donnée de localisation pour le moment</p>
          ) : (
            <div className="space-y-2">
              {data.byRegion.map((r) => (
                <div key={r.region} className="flex items-center gap-3">
                  <span className="text-xs text-charbon-500 w-32 shrink-0 truncate">{r.region}</span>
                  <div className="flex-1 h-2 bg-beigebrume-100 rounded-full overflow-hidden">
                    <div className="h-full bg-ocre-500 rounded-full" style={{ width: `${(r.count / maxRegion) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-charbon-500 w-8 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><Star className="w-4 h-4 text-ocre-500" /> Satisfaction des utilisateurs</h3>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-4xl font-bold text-baobab-500">{s.satisfaction.count > 0 ? s.satisfaction.average.toFixed(1) : "—"}</p>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= Math.round(s.satisfaction.average) ? "text-ocre-500 fill-ocre-500" : "text-beigebrume-200"}`} />
                ))}
              </div>
              <p className="text-[10px] text-charbon-300">{s.satisfaction.count} retour(s)</p>
            </div>
          </div>
          {s.satisfaction.distribution.length > 0 ? (
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const d = s.satisfaction.distribution.find((x) => x.rating === n);
                const c = d?.count || 0;
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-[10px] text-charbon-300 w-3">{n}</span>
                    <div className="flex-1 h-2 bg-beigebrume-100 rounded-full overflow-hidden">
                      <div className="h-full bg-ocre-500 rounded-full" style={{ width: `${(c / maxStars) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-charbon-300 w-6 text-right">{c}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-charbon-300 text-center py-4">Aucun retour utilisateur pour le moment</p>
          )}
          {s.satisfaction.comments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-charbon-400">Commentaires récents</p>
              {s.satisfaction.comments.slice(0, 5).map((c, i) => (
                <div key={i} className="bg-beigebrume-50 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3 h-3 ${n <= c.rating ? "text-ocre-500 fill-ocre-500" : "text-beigebrume-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-charbon-500">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-vertprofond-500" /> Évolution quotidienne (14 j)</h3>
          {data.daily.length === 0 ? (
            <p className="text-sm text-charbon-300 text-center py-4">Aucune donnée</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {data.daily.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-baobab-500 rounded-t" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }} title={`${d.count}`} />
                  <span className="text-[9px] text-charbon-200 truncate w-full text-center">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-charbon-500 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-vertprofond-500" /> Évolution hebdomadaire</h3>
          {data.weekly.length === 0 ? (
            <p className="text-sm text-charbon-300 text-center py-4">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {data.weekly.map((w) => (
                <div key={w.weekStart} className="flex items-center gap-3">
                  <span className="text-xs text-charbon-300 w-24 shrink-0">Sem. {w.weekStart.slice(5)}</span>
                  <div className="flex-1 h-2 bg-beigebrume-100 rounded-full overflow-hidden">
                    <div className="h-full bg-vertprofond-500 rounded-full" style={{ width: `${(w.count / Math.max(1, ...data.weekly.map((x) => x.count))) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-charbon-500 w-8 text-right">{w.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
