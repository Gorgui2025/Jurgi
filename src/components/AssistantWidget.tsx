"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Bonjour ! 👋 Je suis le secrétariat Jurgi. Comment puis-je vous aider ?",
      quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Comment payer ?"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
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

  return (
    <>
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-beigebrume-200 flex flex-col overflow-hidden" style={{ height: "min(70vh, 560px)" }}>
          <div className="bg-gradient-to-r from-baobab-500 to-vertprofond-500 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Secrétariat Jurgi</p>
              <p className="text-[11px] text-baobab-100">Répond en direct • 24/7</p>
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
                <div key={i} className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%] text-sm text-charbon-500 shadow-sm">
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
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-baobab-500 animate-spin" />
                  <span className="text-xs text-charbon-300">Je réfléchis...</span>
                </div>
              </div>
            )}
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
          <Bot className="w-5 h-5" />
          <span className="text-sm font-medium">Besoin d&apos;aide ?</span>
        </button>
      )}
    </>
  );
}
