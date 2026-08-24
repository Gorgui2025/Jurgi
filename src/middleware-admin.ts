import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin login page is always accessible
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // For all other /admin routes, check the admin cookie
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("jurgi_admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
