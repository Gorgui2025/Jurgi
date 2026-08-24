import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { command, value, adminId, adminEmail } = await request.json();

    if (!command || !adminId) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    let description = "";

    switch (command) {
      case "maintenance_mode": {
        await prisma.siteConfig.upsert({
          where: { key: "maintenance_mode" },
          update: { value: value ? "true" : "false" },
          create: { key: "maintenance_mode", value: value ? "true" : "false" },
        });
        description = `Mode maintenance ${value ? "activé" : "désactivé"}`;
        break;
      }
      case "disable_registration": {
        await prisma.siteConfig.upsert({
          where: { key: "new_registration_enabled" },
          update: { value: "false" },
          create: { key: "new_registration_enabled", value: "false" },
        });
        description = "Inscriptions désactivées";
        break;
      }
      case "disable_publications": {
        await prisma.siteConfig.upsert({
          where: { key: "publications_enabled" },
          update: { value: "false" },
          create: { key: "publications_enabled", value: "false" },
        });
        description = "Publications désactivées";
        break;
      }
      case "suspend_all_listings": {
        const count = await prisma.listing.updateMany({
          where: { status: "active" },
          data: { status: "suspended" },
        });
        description = `${count.count} annonces suspendues`;
        break;
      }
      case "reactivate_all_listings": {
        const count = await prisma.listing.updateMany({
          where: { status: "suspended" },
          data: { status: "active" },
        });
        description = `${count.count} annonces réactivées`;
        break;
      }
      default:
        return NextResponse.json({ error: "Commande inconnue" }, { status: 400 });
    }

    await prisma.adminActionLog.create({
      data: {
        adminId,
        adminEmail: adminEmail || "",
        adminRole: "emergency",
        action: `emergency_${command}`,
        entityType: "system",
        newValue: JSON.stringify({ command, value }),
        reason: description,
      },
    });

    return NextResponse.json({ success: true, description });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
