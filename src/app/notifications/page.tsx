"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Settings,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  message: { icon: <MessageCircle className="w-5 h-5" />, color: "text-baobab-500", bg: "bg-baobab-50" },
  account_approved: { icon: <CheckCircle className="w-5 h-5" />, color: "text-vertprofond-500", bg: "bg-vertprofond-50" },
  account_rejected: { icon: <XCircle className="w-5 h-5" />, color: "text-rougeterre-500", bg: "bg-rougeterre-50" },
  listing_sold: { icon: <Star className="w-5 h-5" />, color: "text-ocre-500", bg: "bg-ocre-50" },
  alert: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-ambre-500", bg: "bg-ambre-50" },
  system: { icon: <Settings className="w-5 h-5" />, color: "text-charbon-400", bg: "bg-beigebrume-100" },
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/notifications?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setNotifications(data.notifications || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const handleMarkAllRead = async () => {
    if (!session?.user?.id) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffJ = Math.floor(diffH / 24);
    if (diffJ < 7) return `Il y a ${diffJ}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-container max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-charbon-500">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs bg-rougeterre-500 text-white px-2 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-baobab-500 font-medium hover:text-baobab-600"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-charbon-200 mx-auto mb-3" />
          <p className="text-charbon-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const data = JSON.parse(n.data || "{}");
            const isMessage = n.type === "message" && data.conversationId;

            return (
              <div
                key={n.id}
                onClick={() => {
                  handleMarkRead(n.id);
                  if (isMessage) router.push(`/messages/${data.conversationId}`);
                }}
                className={`card p-4 flex items-start gap-4 transition-colors ${
                  !n.read ? "border-l-4 border-l-baobab-500 bg-baobab-50/30" : ""
                } ${isMessage ? "cursor-pointer hover:bg-vertbrume-50" : ""}`}
              >
                <div className={`p-2 rounded-lg ${config.bg} ${config.color} shrink-0`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${!n.read ? "text-charbon-500" : "text-charbon-400"}`}>
                    {n.title}
                  </h3>
                  <p className="text-xs text-charbon-300 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-charbon-200 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-baobab-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
