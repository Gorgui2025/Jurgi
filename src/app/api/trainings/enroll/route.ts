import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainingId, name, phone, userId } = body;

    if (!trainingId || !name || !phone) {
      return NextResponse.json({ error: "trainingId, name et phone requis" }, { status: 400 });
    }

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!training) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    if (training._count.enrollments >= training.maxParticipants) {
      return NextResponse.json({ error: "Plus de places disponibles" }, { status: 409 });
    }

    const existing = await prisma.trainingEnrollment.findUnique({
      where: { trainingId_phone: { trainingId, phone } },
    });

    if (existing) {
      return NextResponse.json({ error: "Vous êtes déjà inscrit" }, { status: 409 });
    }

    const enrollment = await prisma.trainingEnrollment.create({
      data: { trainingId, name, phone, userId: userId || null },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
