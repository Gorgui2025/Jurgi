"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Phone, Users } from "lucide-react";

interface Participant {
  id: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
}

interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; avatar: string | null };
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: Participant[];
  messages: Message[];
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myId = session?.user?.id;
  const convId = params.id as string;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  const fetchConversation = async () => {
    if (!myId || !convId) return;
    try {
      const res = await fetch(`/api/conversations/${convId}?userId=${myId}`);
      if (!res.ok) {
        router.push("/messages");
        return;
      }
      const data = await res.json();
      setConversation(data);
      setMessages(data.messages || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [convId, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (myId && convId) fetchConversation();
    }, 5000);
    return () => clearInterval(interval);
  }, [myId, convId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myId || !convId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          senderId: myId,
          content,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      }
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  const others = conversation.participants.filter((p) => p.id !== myId);
  const displayName = conversation.isGroup
    ? conversation.name || others.map((p) => p.name?.split(" ")[0]).join(", ")
    : others[0]?.name || "Utilisateur";
  const displayInitial = conversation.isGroup
    ? (conversation.name?.charAt(0) || "?")
    : (others[0]?.name?.charAt(0) || "?");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-beigebrume-200 bg-white flex items-center gap-3">
        <Link href="/messages" className="p-1.5 hover:bg-vertbrume-50 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-charbon-400" />
        </Link>
        <div className="w-9 h-9 bg-baobab-100 rounded-full flex items-center justify-center shrink-0">
          {conversation.isGroup ? (
            <Users className="w-5 h-5 text-baobab-500" />
          ) : others[0]?.avatar ? (
            <img src={others[0].avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-baobab-600">{displayInitial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charbon-500 truncate">{displayName}</p>
          {conversation.isGroup && (
            <p className="text-[11px] text-charbon-300">{others.length + 1} participants</p>
          )}
        </div>
        {!conversation.isGroup && others[0]?.phone && (
          <a
            href={`tel:${others[0].phone}`}
            className="p-2 hover:bg-vertbrume-50 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5 text-charbon-400" />
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-charbon-300">Envoyez le premier message</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender.id === myId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-baobab-500 text-white rounded-br-md"
                    : "bg-sable-200 text-charbon-500 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-charbon-300"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 px-4 py-3 border-t border-beigebrume-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                       placeholder:text-charbon-300"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-baobab-500 text-white rounded-xl hover:bg-baobab-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
