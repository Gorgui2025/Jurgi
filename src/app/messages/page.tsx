"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Search, Users, Plus } from "lucide-react";

interface Participant {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface LastMessage {
  content: string;
  createdAt: string;
  sender: { id: string; name: string | null };
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: Participant[];
  messages: LastMessage[];
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/conversations?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setConversations(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myId = session?.user?.id;

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const other = c.participants.find((p) => p.id !== myId);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffJ = Math.floor(diffH / 24);
    if (diffJ < 7) return `${diffJ}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="page-container max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 hover:bg-vertbrume-50 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-charbon-400" />
        </Link>
        <h1 className="text-xl font-bold text-charbon-500 flex-1">Messages</h1>
        <Link
          href="/messages/nouveau"
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une conversation..."
          className="w-full pl-10 pr-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                     placeholder:text-charbon-300"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400 mb-1">Aucune conversation</p>
          <p className="text-sm text-charbon-300">
            Contactez un vendeur depuis une annonce pour démarrer
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv) => {
            const others = conv.participants.filter((p) => p.id !== myId);
            const displayName = conv.isGroup
              ? conv.name || others.map((p) => p.name?.split(" ")[0]).join(", ")
              : others[0]?.name || "Utilisateur";
            const lastMsg = conv.messages[0];

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-vertbrume-50 transition-colors"
              >
                <div className="w-11 h-11 bg-baobab-100 rounded-full flex items-center justify-center shrink-0">
                  {conv.isGroup ? (
                    <Users className="w-5 h-5 text-baobab-500" />
                  ) : others[0]?.avatar ? (
                    <img src={others[0].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-baobab-600">
                      {others[0]?.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-charbon-500 truncate">
                      {displayName}
                    </p>
                    <span className="text-[11px] text-charbon-200 shrink-0">
                      {lastMsg ? formatTime(lastMsg.createdAt) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-charbon-300 truncate mt-0.5">
                    {lastMsg
                      ? `${lastMsg.sender.id === myId ? "Vous: " : ""}${lastMsg.content}`
                      : "Pas de message"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
