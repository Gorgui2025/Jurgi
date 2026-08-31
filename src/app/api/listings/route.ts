import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkListingQuota } from "@/lib/listingQuota";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const domain = searchParams.get("domain");
  const search = searchParams.get("q");
  const userId = searchParams.get("userId");
  const allStatuses = searchParams.get("allStatuses");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (!userId && !allStatuses) {
    where.status = "active";
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];
  }

  if (!userId && allStatuses) {
    where.OR = [
      { status: { notIn: ["expired", "suspended", "archived"] }, expiresAt: null },
      { status: { notIn: ["expired", "suspended", "archived"] }, expiresAt: { gt: new Date() } },
      { status: { in: ["expired", "suspended", "archived"] } },
    ];
  }

  if (userId) {
    where.userId = userId;
    await prisma.listing.updateMany({
      where: { userId, status: "active", expiresAt: { lt: new Date() } },
      data: { status: "expired" },
    });
  }

  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  }

  if (region) where.region = region;

  if (domain) {
    const cats = await prisma.category.findMany({ where: { domain } });
    where.categoryId = { in: cats.map((c) => c.id) };
  }

  if (search) {
    const searchNorm = search.toLowerCase()
      .replace(/[éèêë]/g, "e").replace(/[àâä]/g, "a").replace(/[îï]/g, "i")
      .replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/[ÿ]/g, "y").replace(/[ç]/g, "c");
    const likePattern = "%" + searchNorm + "%";

    const matchingListingIds = (
      await prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT L.id FROM Listing L
        LEFT JOIN Category C ON L.categoryId = C.id
        WHERE
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            L.title, 'é','e'), 'è','e'), 'ê','e'), 'ë','e'), 'à','a'), 'â','a'), 'ä','a'), 'î','i'), 'ï','i'), 'ô','o'), 'ö','o'), 'ù','u')
          ) LIKE ${likePattern}
          OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            L.description, 'é','e'), 'è','e'), 'ê','e'), 'ë','e'), 'à','a'), 'â','a'), 'ä','a'), 'î','i'), 'ï','i'), 'ô','o'), 'ö','o'), 'ù','u')
          ) LIKE ${likePattern}
          OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            L.species, 'é','e'), 'è','e'), 'ê','e'), 'ë','e'), 'à','a'), 'â','a'), 'ä','a'), 'î','i'), 'ï','i'), 'ô','o'), 'ö','o'), 'ù','u')
          ) LIKE ${likePattern}
          OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            C.name, 'é','e'), 'è','e'), 'ê','e'), 'ë','e'), 'à','a'), 'â','a'), 'ä','a'), 'î','i'), 'ï','i'), 'ô','o'), 'ö','o'), 'ù','u')
          ) LIKE ${likePattern}
      `
    ).map((l) => l.id);

    where.id = { in: matchingListingIds };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        category: { select: { name: true, slug: true, domain: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      categoryId,
      domain,
      title,
      description,
      price,
      priceOnDemand,
      species,
      breed,
      sex,
      age,
      weight,
      quantity,
      region,
      commune,
      contactMode,
      healthInfo,
      photos,
      videos,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Sécurité : on résout l'utilisateur authentifié depuis la session serveur.
    // On ne fie JAMAIS au userId envoyé par le client pour la propriété de
    // l'annonce, et on n'utilise JAMAIS findFirst() (qui attribuait les
    // annonces au premier utilisateur de la base, ex. Thierno Madiou Bah).
    let resolvedUserId: string;
    const session = await getServerSession(authOptions).catch(() => null);
    const sessionUserId = (session?.user as any)?.id;

    if (!sessionUserId) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour publier une annonce.", authRequired: true },
        { status: 401 }
      );
    }
    resolvedUserId = sessionUserId;

    let resolvedCategoryId = categoryId;

    // Résoudre la catégorie à partir de l'ESPÈCE choisie (ex. "Ovin" → "Ovins"),
    // pas seulement du domaine. Autrement findFirst() renvoyait toujours la
    // première catégorie du domaine (ex. "Bovins") pour toutes les espèces.
    if (!resolvedCategoryId) {
      const speciesName = (species || "").trim().toLowerCase();
      if (speciesName && domain) {
        const cats = await prisma.category.findMany({ where: { domain } });
        const match = cats.find((c) => c.name.toLowerCase() === speciesName || c.name.toLowerCase() === speciesName + "s");
        resolvedCategoryId = match?.id;
      }
    }
    if (!resolvedCategoryId && domain) {
      const cat = await prisma.category.findFirst({ where: { domain } });
      resolvedCategoryId = cat?.id;
    }
    if (!resolvedCategoryId) {
      const cat = await prisma.category.findFirst();
      resolvedCategoryId = cat?.id;
    }

    if (!resolvedUserId || !resolvedCategoryId) {
      return NextResponse.json(
        { error: "Aucun utilisateur ou catégorie disponible" },
        { status: 400 }
      );
    }

    const quota = await checkListingQuota(resolvedUserId);
    if (!quota.allowed) {
      const message =
        quota.reason === "daily_limit"
          ? "Vous avez atteint votre limite de publication pour aujourd'hui. Vous pourrez publier une nouvelle annonce demain."
          : `Limite atteinte (${quota.activeListings}/${quota.maxActiveListings} annonces actives sur le plan ${quota.planName}). Passez à une offre supérieure pour publier davantage.`;
      return NextResponse.json(
        {
          error: quota.reason === "daily_limit" ? "daily_quota_reached" : "quota_reached",
          message,
          quota,
        },
        { status: 403 }
      );
    }

    const parsedPrice =
      price !== null && price !== undefined && price !== "" ? parseFloat(String(price).replace(",", ".")) : null;
    const safePrice = parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null;

    const parsedQty = quantity !== null && quantity !== undefined && quantity !== "" ? Number(quantity) : null;
    const safeQuantity = parsedQty !== null && Number.isFinite(parsedQty) && Number.isInteger(parsedQty) ? parsedQty : null;

    const listing = await prisma.listing.create({
      data: {
        userId: resolvedUserId,
        categoryId: resolvedCategoryId,
        title,
        description,
        price: safePrice,
        priceOnDemand: priceOnDemand || false,
        photos: JSON.stringify(photos || []),
        videos: JSON.stringify(videos || []),
        species: species || null,
        breed: breed || null,
        sex: sex || null,
        age: age || null,
        weight: weight || null,
        quantity: safeQuantity,
        region: region || null,
        commune: commune || null,
        contactMode: contactMode || "phone_whatsapp",
        healthInfo: healthInfo || null,
        status: "active",
        availability: "available",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de la création de l'annonce";
    console.error("[LISTINGS POST]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
