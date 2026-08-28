import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProfileEntry {
  id: string;
  userId: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  vehicleType?: string;
  institutionType?: string;
  zones: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
  profileType: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const role = searchParams.get("role");
  const search = searchParams.get("q");

  const profileTypeMap: Record<string, string> = {
    veterinaire: "veterinaire",
    transporteur: "transporteur",
    institution: "institution",
  };

  const roleFilter = role && profileTypeMap[role] ? [role] : ["veterinaire", "transporteur", "institution"];

  const allProfiles: ProfileEntry[] = [];

  if (roleFilter.includes("veterinaire")) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const profiles = await prisma.vetProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
    });
    profiles.forEach(p => {
      allProfiles.push({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName || p.user.name,
        phone: p.phone || p.user.phone,
        email: p.user.email,
        isVerified: p.user.isVerified,
        zones: p.zones,
        status: p.status,
        isActive: p.isActive,
        createdAt: p.createdAt,
        profileType: "veterinaire",
      });
    });
  }

  if (roleFilter.includes("transporteur")) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const profiles = await prisma.transporterProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
    });
    profiles.forEach(p => {
      allProfiles.push({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName || p.user.name,
        phone: p.phone || p.user.phone,
        email: p.user.email,
        isVerified: p.user.isVerified,
        vehicleType: p.vehicleType,
        zones: p.zones,
        status: p.status,
        isActive: p.isActive,
        createdAt: p.createdAt,
        profileType: "transporteur",
      });
    });
  }

  if (roleFilter.includes("institution")) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const profiles = await prisma.institutionProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
    });
    profiles.forEach(p => {
      allProfiles.push({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName || p.user.name,
        phone: p.phone || p.user.phone,
        email: p.user.email,
        isVerified: p.user.isVerified,
        institutionType: p.institutionType,
        zones: p.zones,
        status: p.status,
        isActive: p.isActive,
        createdAt: p.createdAt,
        profileType: "institution",
      });
    });
  }

  allProfiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let filtered = allProfiles;
  if (search) {
    const q = search.toLowerCase();
    filtered = allProfiles.filter(p =>
      (p.displayName || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      p.profileType.includes(q)
    );
  }

  const pending = allProfiles.filter(p => p.status === "pending").length;
  const active = allProfiles.filter(p => p.status === "active").length;
  const suspended = allProfiles.filter(p => p.status === "suspended").length;
  const trial = allProfiles.filter(p => p.status === "trial").length;
  const total = allProfiles.length;

  return NextResponse.json({ profiles: filtered, stats: { total, pending, active, suspended, trial } });
}

const ROLE_LABELS: Record<string, string> = {
  veterinaire: "Vétérinaire",
  transporteur: "Transporteur",
  institution: "Institution",
};

async function handleAction(
  profileType: string,
  profileId: string,
  action: string,
) {
  const modelMap: Record<string, unknown> = {
    veterinaire: prisma.vetProfile,
    transporteur: prisma.transporterProfile,
    institution: prisma.institutionProfile,
  };

  const model = modelMap[profileType] as { findUnique: Function; update: Function; delete: Function };
  if (!model) throw new Error("Type de profil inconnu");

  const profile = await model.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Profil non trouvé");

  switch (action) {
    case "approve": {
      await model.update({ where: { id: profileId }, data: { status: "active", isActive: true } });
      await prisma.user.update({ where: { id: profile.userId }, data: { accountStatus: "active", isVerified: true, verifiedLevel: "professional" } });
      await prisma.adminNotification.create({
        data: {
          type: "professional_approved",
          title: `${ROLE_LABELS[profileType] || profileType} approuvé`,
          message: `${profile.displayName || profile.user.name} — compte activé.`,
          data: JSON.stringify({ userId: profile.userId, profileId, profileType }),
        },
      });
      break;
    }
    case "reject": {
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "profile_rejected",
          title: "Profil rejeté",
          message: `Votre profil ${ROLE_LABELS[profileType] || profileType} a été rejeté.`,
        },
      });
      await model.delete({ where: { id: profileId } });
      break;
    }
    case "suspend": {
      await model.update({ where: { id: profileId }, data: { status: "suspended", isActive: false } });
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "account_suspended",
          title: "Compte suspendu",
          message: `Votre compte ${ROLE_LABELS[profileType] || profileType} a été suspendu par un administrateur.`,
        },
      });
      break;
    }
    case "reactivate": {
      await model.update({ where: { id: profileId }, data: { status: "active", isActive: true } });
      await prisma.user.update({ where: { id: profile.userId }, data: { accountStatus: "active" } });
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "account_reactivated",
          title: "Compte réactivé",
          message: `Votre compte ${ROLE_LABELS[profileType] || profileType} a été réactivé.`,
        },
      });
      break;
    }
    case "verify": {
      await prisma.user.update({ where: { id: profile.userId }, data: { isVerified: true, verifiedLevel: "professional" } });
      break;
    }
    case "unverify": {
      await prisma.user.update({ where: { id: profile.userId }, data: { isVerified: false, verifiedLevel: "none" } });
      break;
    }
  }

  return { success: true };
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileType, profileId, action } = body;

    if (!profileType || !profileId || !action) {
      return NextResponse.json({ error: "profileType, profileId et action requis" }, { status: 400 });
    }

    await handleAction(profileType, profileId, action);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
