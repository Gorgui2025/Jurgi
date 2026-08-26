"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import HeartbeatProvider from "./HeartbeatProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <HeartbeatProvider>{children}</HeartbeatProvider>
    </NextAuthSessionProvider>
  );
}
