"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Search, RefreshCw, Loader2, Users } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; name: string | null; avatar: string | null };
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  messageCount: number;
  participants: { id: string; name: string | null; email: string | null; phone: string | null; avatar: string | null }[];
  messages: Message[];
}

export default function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => { setConversations(d.conversations || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (msgId: string) => {
    if (!confirm("Supprimer définitivement ce message ?")) return;
    await fetch(`/api/admin/messages?id=${msgId}`, { method: "DELETE" });
    setConversations((prev) =>
      prev.map((c) => ({ ...c, messages: c.messages.filter((m) => m.id !== msgId) }))
    );
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      c.participants.some((p) => (p.name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <div className="card p-8 text-center"><Loader2 className="w-6 h-6 text-baobab-500 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-charbon-500 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-baobab-500" /> Messages échangés
        </h2>
        <button onClick={load} className="flex items-center gap-2 text-sm text-baobab-500 hover:text-baobab-600">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une conversation..." className="input-field pl-10" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-sm text-charbon-300">
            Aucune conversation{search ? " trouvée" : ""}
          </div>
        ) : filtered.map((c) => (
          <div key={c.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-beigebrume-50 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-vertbrume-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-baobab-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charbon-500 truncate">
                  {c.name || c.participants.filter((p) => p.name).map((p) => p.name).join(", ") || c.participants.map((p) => p.email || p.phone).join(", ") || "Conversation"}
                </p>
                <p className="text-xs text-charbon-300 truncate">
                  {c.participants.length} participant{c.participants.length !== 1 ? "s" : ""} • {c.messageCount} message{c.messageCount !== 1 ? "s" : ""}
                  {c.messages[0]?.content ? ` • ${c.messages[0].content.slice(0, 60)}` : ""}
                </p>
              </div>
              <span className="text-[10px] text-charbon-200 shrink-0">{new Date(c.updatedAt).toLocaleDateString("fr-FR")}</span>
            </button>

            {expanded === c.id && (
              <div className="border-t border-beigebrume-100 p-4 space-y-2 max-h-80 overflow-y-auto">
                {c.messages.length === 0 ? (
                  <p className="text-sm text-charbon-300 text-center py-4">Aucun message</p>
                ) : [...c.messages].reverse().map((m) => (
                  <div key={m.id} className="flex items-start gap-3 bg-beigebrume-50 rounded-lg p-3">
                    <div className="w-7 h-7 rounded-full bg-baobab-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-charbon-500">{m.sender?.name || "Utilisateur"}</p>
                        <span className="text-[10px] text-charbon-300">{new Date(m.createdAt).toLocaleString("fr-FR")}</span>
                        {!m.read && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocre-100 text-ocre-600 font-medium">Non lu</span>}
                      </div>
                      <p className="text-sm text-charbon-400 mt-0.5 break-words">{m.content}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-charbon-300 hover:text-rougeterre-500 rounded-lg hover:bg-rougeterre-50 shrink-0"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
