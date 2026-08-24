import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            phone: true,
            whatsapp: true,
            isVerified: true,
            verifiedLevel: true,
            createdAt: true,
            region: true,
            phoneVisible: true,
            _count: { select: { listings: true } },
          },
        },
        category: {
          select: { name: true, slug: true, domain: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
    }

    if (listing.status === "active" && listing.expiresAt && listing.expiresAt < new Date()) {
      await prisma.listing.update({
        where: { id: params.id },
        data: { status: "expired" },
      });
      listing.status = "expired";
    }

    await prisma.listing.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(listing);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, price, priceOnDemand, species, breed, sex, age, weight, quantity, region, commune, status, photos, videos, healthInfo, renew } = body;

    const updateData: Record<string, unknown> = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      ...(priceOnDemand !== undefined && { priceOnDemand }),
      ...(species !== undefined && { species }),
      ...(breed !== undefined && { breed }),
      ...(sex !== undefined && { sex }),
      ...(age !== undefined && { age }),
      ...(weight !== undefined && { weight }),
      ...(quantity !== undefined && { quantity: quantity ? parseInt(quantity) : null }),
      ...(region !== undefined && { region }),
      ...(commune !== undefined && { commune }),
      ...(status !== undefined && { status }),
      ...(photos !== undefined && { photos: JSON.stringify(photos) }),
      ...(videos !== undefined && { videos: JSON.stringify(videos) }),
      ...(healthInfo !== undefined && { healthInfo }),
    };

    if (renew) {
      updateData.status = "active";
      updateData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const listing = await prisma.listing.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(listing);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.listing.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
