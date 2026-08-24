import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();

  // 1. Check jurgi_admin_token (dedicated admin login)
  const adminToken = cookieStore.get("jurgi_admin_token")?.value;
  if (adminToken) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminToken },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (admin && admin.isActive) {
      return <AdminClient admin={admin} />;
    }
  }

  // 2. Check NextAuth session (login via /connexion)
  const session = await getServerSession(authOptions);
  if (session?.user?.email && session.user.roles.some(r => r === "admin" || r.startsWith("admin_"))) {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (admin && admin.isActive) {
      return <AdminClient admin={admin} />;
    }
  }

  redirect("/connexion");
}
