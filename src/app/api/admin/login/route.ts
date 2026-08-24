import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  let email = "";
  let password = "";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    email = String(formData.get("email") || "");
    password = String(formData.get("password") || "");
  } else {
    const body = await request.text();
    const params = new URLSearchParams(body);
    email = params.get("email") || "";
    password = params.get("password") || "";
  }

  if (!email || !password) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/login?error=1" },
    });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/login?error=1" },
    });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/login?error=1" },
    });
  }

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const response = new Response(null, {
    status: 302,
    headers: { Location: "/admin" },
  });

  response.headers.set(
    "Set-Cookie",
    `jurgi_admin_token=${admin.id}; Path=/admin; Max-Age=${7 * 24 * 60 * 60}; HttpOnly=false; SameSite=Lax`
  );

  return response;
}
