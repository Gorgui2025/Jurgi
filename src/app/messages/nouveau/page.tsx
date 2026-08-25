"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users, User, Search, Check, X, MessageSquare } from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  avatar: string | null;
  region: string | null;
  roles: string;
}

export default function NouvelleConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const all = (Array.isArray(data) ? data : data.users || []) as UserItem[];
        setUsers(all.filter((u) => u.id !== session?.user?.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const isGroup = selected.length > 1;

  const filtered = users.filter((u) => {
    if (!search) return true;
    return u.name?.toLowerCase().includes(search.toLowerCase());
  });

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!session?.user?.id || selected.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: session.user.id,
          isGroup,
          receiverIds: selected,
          receiverId: selected.length === 1 ? selected[0] : undefined,
          name: isGroup ? groupName || null : undefined,
        }),
      });
      if (res.ok) {
        const conv = await res.json();
        router.push(`/messages/${conv.id}`);
      }
    } catch {
    } finally {
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <MessageSquare className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Connexion requise</h2>
        <p className="text-sm text-charbon-300 mb-6">Connectez-vous pour démarrer une conversation.</p>
        <Link href="/connexion" className="btn-primary inline-flex items-center gap-2">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/messages" className="p-2 hover:bg-vertbrume-50 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-charbon-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charbon-500">Nouvelle conversation</h1>
          <p className="text-xs text-charbon-300">Sélectionnez un ou plusieurs participants</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full pl-10 pr-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                     placeholder:text-charbon-300"
        />
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => {
              const u = users.find((x) => x.id === id);
              return (
                <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-baobab-100 text-baobab-700 rounded-full text-xs font-medium">
                  {u?.name || "Utilisateur"}
                  <button onClick={() => toggleUser(id)} className="hover:text-baobab-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
          {isGroup && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nom du groupe (optionnel)"
              className="w-full px-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                         placeholder:text-charbon-300"
            />
          )}
        </div>
      )}

      {/* User list */}
      <div className="space-y-1 mb-6">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <User className="w-10 h-10 text-charbon-200 mx-auto mb-2" />
            <p className="text-charbon-300">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          filtered.map((u) => {
            const isSelected = selected.includes(u.id);
            const roles = JSON.parse(u.roles || "[]");
            return (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  isSelected
                    ? "bg-baobab-50 border border-baobab-300"
                    : "hover:bg-vertbrume-50 border border-transparent"
                }`}
              >
                <div className="w-10 h-10 bg-baobab-100 rounded-full flex items-center justify-center shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-baobab-600">{u.name?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500 truncate">{u.name}</p>
                  <p className="text-xs text-charbon-300">{u.region || "Sénégal"} · {roles[0] || "eleveur"}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-baobab-500 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Create button */}
      {selected.length > 0 && (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Création...
            </span>
          ) : (
            <>
              {isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {isGroup ? `Créer le groupe (${selected.length})` : "Démarrer la conversation"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
