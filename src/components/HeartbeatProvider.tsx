"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    if (!userId) return;

    const ping = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  return <>{children}</>;
}
