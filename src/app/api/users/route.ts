import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, roles, region, commune } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { error: "Le téléphone et le nom sont obligatoires" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ce numéro est déjà utilisé" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        phone,
        name,
        roles: JSON.stringify(roles || ["eleveur"]),
        region: region || null,
        commune: commune || null,
        isVerified: false,
        verifiedLevel: "none",
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const region = searchParams.get("region");
  const role = searchParams.get("role");
  const verified = searchParams.get("verified");

  if (id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        region: true,
        commune: true,
        roles: true,
        isVerified: true,
        verifiedLevel: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  }

  const where: Record<string, unknown> = {};

  if (region) where.region = region;
  if (role) where.roles = { contains: role };
  if (verified === "true") where.isVerified = true;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      region: true,
      roles: true,
      accountStatus: true,
      isVerified: true,
      verifiedLevel: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, accountStatus, name, bio, region, commune, avatar, phoneVisible, whatsapp, currentPassword, newPassword } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (accountStatus !== undefined) data.accountStatus = accountStatus;
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (region !== undefined) data.region = region;
    if (commune !== undefined) data.commune = commune;
    if (avatar !== undefined) data.avatar = avatar;
    if (phoneVisible !== undefined) data.phoneVisible = phoneVisible;
    if (whatsapp !== undefined) data.whatsapp = whatsapp;

    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Le nouveau mot de passe doit faire 6 caractères minimum" }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
      }
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ id: updated.id, accountStatus: updated.accountStatus });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
