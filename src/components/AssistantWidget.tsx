"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2, Star } from "lucide-react";
import SecretaryAvatar from "./SecretaryAvatar";

const SECRETARY_NAME = "Siny";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  quickReplies?: string[];
}

function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      return (
        <div key={i} className="flex items-start gap-1.5 pl-1">
          <span className="text-baobab-500">•</span>
          <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={i} className="flex items-start gap-1.5 pl-1">
          <span className="text-baobab-500 shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span className="flex-1">{renderInline(trimmed.replace(/^\d+\.\s*/, ""))}</span>
        </div>
      );
    }
    return <div key={i}>{renderInline(trimmed)}</div>;
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Bonjour ! 👋 Je suis ${SECRETARY_NAME}, le secrétariat Jurgi. Comment puis-je vous aider ?`,
      quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Comment payer ?"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      setSessionId(
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : "s-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10)
      );
    }
  }, [sessionId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open, showFeedback]);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    setShowFeedback(false);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply?.answer || "Désolé, je n'ai pas de réponse pour le moment.", quickReplies: data.reply?.quickReplies },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Une erreur est survenue. Veuillez réessayer. 🙏" }]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (rating: number) => {
    setFeedbackRating(rating);
    setFeedbackSent(true);
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, comment: feedbackComment || null }),
      });
    } catch {
      // ignore
    }
  };

  const openFeedback = () => {
    setFeedbackComment("");
    setFeedbackRating(0);
    setFeedbackSent(false);
    setShowFeedback(true);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-beigebrume-200 flex flex-col overflow-hidden" style={{ height: "min(70vh, 560px)" }}>
          <div className="bg-gradient-to-r from-baobab-500 to-vertprofond-500 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center shrink-0 p-0.5">
              <SecretaryAvatar size={36} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Siny · Secrétariat Jurgi</p>
              <p className="text-[11px] text-baobab-100">En ligne • répond en direct 24/7</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3 bg-beigebrume-50">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-baobab-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%] text-sm whitespace-pre-wrap">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-white border border-beigebrume-200 flex items-center justify-center shrink-0 p-0.5 mt-0.5">
                    <SecretaryAvatar size={26} />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[78%] text-sm text-charbon-500 shadow-sm">
                    <div className="space-y-1">{renderText(m.text)}</div>
                    {m.quickReplies && m.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.quickReplies.map((q) => (
                          <button
                            key={q}
                            onClick={() => ask(q)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-vertbrume-100 text-baobab-600 hover:bg-vertbrume-200 font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-white border border-beigebrume-200 flex items-center justify-center shrink-0 p-0.5 mt-0.5">
                  <SecretaryAvatar size={26} />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-baobab-500 animate-spin" />
                  <span className="text-xs text-charbon-300">Je réfléchis...</span>
                </div>
              </div>
            )}
          </div>

          {showFeedback && (
            <div className="border-t border-beigebrume-200 bg-white p-3 space-y-2">
              {feedbackSent ? (
                <p className="text-xs text-baobab-600 font-medium">Merci pour votre retour ! 🙏</p>
              ) : (
                <>
                  <p className="text-xs font-medium text-charbon-500">Comment puis-je améliorer le secrétariat Siny ?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => submitFeedback(n)}
                        className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition ${
                          feedbackRating === n ? "bg-ocre-500 text-white" : "bg-beigebrume-100 text-charbon-400 hover:bg-ocre-100"
                        }`}
                        title={`${n} étoile${n > 1 ? "s" : ""}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Un commentaire (optionnel)"
                      className="text-xs flex-1 px-2.5 py-1.5 rounded-lg border border-beigebrume-200 focus:outline-none focus:ring-2 focus:ring-baobab-500"
                    />
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-beigebrume-100 text-charbon-400 hover:bg-beigebrume-200"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="border-t border-beigebrume-200 bg-beigebrume-50/50 flex items-center justify-between px-3 py-1.5">
            <button
              onClick={openFeedback}
              disabled={feedbackSent}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                feedbackSent
                  ? "text-charbon-300 cursor-default"
                  : "text-ocre-600 hover:bg-ocre-100 bg-white border border-beigebrume-200"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${feedbackSent ? "text-charbon-300" : "text-ocre-500"}`} />
              {feedbackSent ? "Merci pour votre avis !" : "Évaluer Siny"}
            </button>
            <span className="text-[10px] text-charbon-300">Secrétariat virtuel</span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="border-t border-beigebrume-200 p-3 flex items-center gap-2 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-beigebrume-200 focus:outline-none focus:ring-2 focus:ring-baobab-500"
            />
            <button type="submit" disabled={loading || !input.trim()} className="p-2.5 rounded-xl bg-baobab-500 text-white hover:bg-baobab-600 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-baobab-500 text-white shadow-lg hover:bg-baobab-600 transition-colors"
        >
          <SecretaryAvatar size={26} />
          <span className="text-sm font-medium">Besoin d&apos;aide ?</span>
        </button>
      )}
    </>
  );
}
