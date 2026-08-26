"use client";

export function isOnline(lastSeen: string | Date | null): boolean {
  if (!lastSeen) return false;
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastSeen) > fiveMinAgo;
}

export default function OnlineBadge({ lastSeen, className = "" }: { lastSeen: string | Date | null; className?: string }) {
  const online = isOnline(lastSeen);

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-white shrink-0 ${
        online ? "bg-vertprofond-500" : "bg-charbon-200"
      } ${className}`}
      title={online ? "En ligne" : "Hors ligne"}
    />
  );
}
