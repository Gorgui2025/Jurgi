import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, password, roles, region, commune } = body;

    if (!name || !roles?.length || !region) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    if (!phone && !email) {
      return NextResponse.json({ error: "Téléphone ou email requis" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mot de passe requis (6 caractères minimum)" }, { status: 400 });
    }

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json({ error: "Ce numéro de téléphone est déjà utilisé" }, { status: 409 });
      }
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }
    }

    const PRO_ROLES = ["veterinaire", "transporteur", "institution", "livreur"];
    const needsValidation = roles.some((r: string) => PRO_ROLES.includes(r));

    const data: Record<string, unknown> = {
      name,
      roles: JSON.stringify(roles),
      region,
      commune: commune || null,
      accountStatus: needsValidation ? "pending_validation" : "active",
    };

    if (phone) {
      data.phone = phone;
    }

    if (email) {
      data.email = email;
    }

    data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({ data });

    if (roles.includes("livreur")) {
      await prisma.deliveryProfile.create({
        data: {
          userId: user.id,
          displayName: name,
          phone: phone || null,
          vehicleType: "Moto",
          zones: JSON.stringify(region ? [{ region, commune: commune || "" }] : []),
          status: "pending",
          isActive: false,
        },
      });
    }

    if (roles.includes("veterinaire")) {
      await prisma.vetProfile.create({
        data: {
          userId: user.id,
          displayName: name,
          phone: phone || null,
          zones: JSON.stringify(region ? [{ region, commune: commune || "" }] : []),
          status: "pending",
          isActive: false,
        },
      });
    }

    if (roles.includes("transporteur")) {
      await prisma.transporterProfile.create({
        data: {
          userId: user.id,
          displayName: name,
          phone: phone || null,
          vehicleType: "Moto",
          zones: JSON.stringify(region ? [{ region, commune: commune || "" }] : []),
          status: "pending",
          isActive: false,
        },
      });
    }

    if (roles.includes("institution")) {
      await prisma.institutionProfile.create({
        data: {
          userId: user.id,
          displayName: name,
          phone: phone || null,
          institutionType: "Autre",
          zones: JSON.stringify(region ? [{ region, commune: commune || "" }] : []),
          status: "pending",
          isActive: false,
        },
      });
    }

    if (needsValidation) {
      const roleLabels: Record<string, string> = {
        veterinaire: "Vétérinaire",
        transporteur: "Transporteur",
        institution: "Institution",
        livreur: "Livreur",
      };
      const roleLabel = roles.map((r: string) => roleLabels[r] || r).join(", ");

      await prisma.adminNotification.create({
        data: {
          type: "new_professional",
          title: "Nouveau compte à valider",
          message: `${name} (${roleLabel}) — ${region}${commune ? ", " + commune : ""}. En attente de validation.`,
          data: JSON.stringify({ userId: user.id, name, roles, region, commune, phone: phone || null }),
        },
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      accountStatus: user.accountStatus,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
