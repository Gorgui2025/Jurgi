import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULTS: Record<string, string> = {
  platform_name: "Jurgi",
  platform_description: "La marketplace de l'élevage au Sénégal",
  contact_email: "contact@jurgi.sn",
  contact_phone: "+221 77 000 00 00",
  listing_expiration_days: "30",
  max_photos_per_listing: "6",
  auto_suspend_on_report: "false",
  require_professional_validation: "true",
  maintenance_mode: "false",
  new_registration_enabled: "true",
  publications_enabled: "true",
  videos_enabled: "true",
  trial_enabled: "true",
  trial_plan_slug: "express",
  trial_duration_days: "7",
  trial_one_time_only: "true",
  payment_phone_number: "+221 77 981 95 88",
  payment_methods: "Wave,Orange Money",
};

export async function GET() {
  const configs = await prisma.siteConfig.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const c of configs) {
    settings[c.key] = c.value;
  }
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value: String(value), updatedAt: new Date() },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
