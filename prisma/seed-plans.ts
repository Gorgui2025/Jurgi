import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    slug: "gratuit",
    name: "Gratuit",
    description: "Créez un compte, consultez la marketplace et publiez jusqu'à 3 annonces.",
    price: 0,
    currency: "XOF",
    durationDays: 0,
    maxActiveListings: 3,
    maxPhotosPerListing: 6,
    maxVideosPerListing: 1,
    maxVideoSizeMb: 50,
    autoRenew: false,
    isTrialEligible: false,
    isVisible: true,
    isActive: true,
    sortOrder: 0,
    commercialMessage: "Plan de base — accès illimité en lecture, 3 annonces actives.",
  },
  {
    slug: "ndimbale",
    name: "Jurgi Ndimbale",
    description: "Formule annuelle simple et accessible pour les petits éleveurs : 1 nouvelle annonce par jour, jusqu'à 5 annonces actives et 1 vidéo par annonce.",
    price: 2500,
    currency: "XOF",
    durationDays: 365,
    maxActiveListings: 5,
    dailyListingsQuota: 1,
    maxPhotosPerListing: 3,
    maxVideosPerListing: 1,
    maxVideoSizeMb: 50,
    autoRenew: false,
    isTrialEligible: true,
    isVisible: true,
    isActive: true,
    sortOrder: 1,
    commercialMessage: "Jurgi Ndimbale — 2 500 FCFA par an. Publiez vos annonces d’élevage avec des photos et une vidéo de présentation. 7 jours gratuits, puis 1 nouvelle annonce par jour, 5 annonces actives et 1 vidéo par annonce.",
  },
  {
    slug: "express",
    name: "Jurgi Express",
    description: "Offre ponctuelle de 7 jours. Jusqu'à 15 annonces actives et 2 vidéos par annonce.",
    price: 4000,
    currency: "XOF",
    durationDays: 7,
    maxActiveListings: 15,
    maxPhotosPerListing: 6,
    maxVideosPerListing: 2,
    maxVideoSizeMb: 50,
    autoRenew: false,
    isTrialEligible: true,
    isVisible: true,
    isActive: true,
    sortOrder: 2,
    commercialMessage: "Idéal pour un besoin ponctuel. Paiement unique, sans renouvellement automatique.",
  },
  {
    slug: "pro",
    name: "Jurgi Pro",
    description: "Offre complète de 30 jours. Jusqu'à 50 annonces actives.",
    price: 12000,
    currency: "XOF",
    durationDays: 30,
    maxActiveListings: 50,
    maxPhotosPerListing: 6,
    maxVideosPerListing: 2,
    maxVideoSizeMb: 50,
    autoRenew: false,
    isTrialEligible: true,
    isVisible: true,
    isActive: true,
    sortOrder: 3,
    commercialMessage: "Pour les professionnels et éleveurs actifs. Renouvellement possible avec consentement.",
  },
  {
    slug: "livreur",
    name: "Jurgi Livreur",
    description: "Abonnement livreur. Profil visible, accès aux demandes de livraison, 7 jours d'essai gratuit.",
    price: 1500,
    currency: "XOF",
    durationDays: 30,
    maxActiveListings: 0,
    maxPhotosPerListing: 3,
    maxVideosPerListing: 0,
    maxVideoSizeMb: 0,
    autoRenew: false,
    isTrialEligible: true,
    isVisible: true,
    isActive: true,
    sortOrder: 4,
    commercialMessage: "7 jours gratuits, puis 1 500 FCFA/mois. Visibilité dans l'annuaire et accès aux demandes.",
  },
];

async function main() {
  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
    if (existing) {
      const updated = await prisma.plan.update({
        where: { slug: plan.slug },
        data: plan,
      });
      console.log(`✅ Plan mis à jour : ${updated.name} (${updated.slug})`);
    } else {
      const created = await prisma.plan.create({ data: plan });
      console.log(`✅ Plan créé : ${created.name} (${created.slug})`);

      await prisma.planVersion.create({
        data: {
          planId: created.id,
          version: 1,
          snapshot: JSON.stringify(plan),
          changeReason: "Initialisation par défaut",
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
