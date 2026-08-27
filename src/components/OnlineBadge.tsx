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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
        online
          ? "bg-vertprofond-100 text-vertprofond-600"
          : "bg-charbon-100 text-charbon-400"
      } ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${online ? "bg-vertprofond-500" : "bg-charbon-300"}`} />
      {online ? "En ligne" : "Hors ligne"}
    </span>
  );
}
