import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ──
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();

    // Accept jurgi_admin_token (dedicated admin auth)
    const adminToken = req.cookies.get("jurgi_admin_token")?.value;
    if (adminToken) return NextResponse.next();

    // Accept next-auth.session-token (normal login from /connexion)
    const sessionToken = req.cookies.get("next-auth.session-token")?.value;
    if (sessionToken) return NextResponse.next();

    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  // ── Protected user routes: check NextAuth session ──
  const protectedPaths = ["/profil", "/mes-annonces", "/notifications", "/abonnement"];
  const isProtected = protectedPaths.some(p => pathname === p) ||
    pathname.startsWith("/messages");
  if (isProtected) {
    const token = req.cookies.get("next-auth.session-token")?.value;
    if (!token) return NextResponse.redirect(new URL("/connexion", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profil", "/mes-annonces/:path*", "/messages/:path*", "/notifications", "/abonnement"],
};
