import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    // Animaux et produits vivants
    { name: "Bovins", slug: "bovins", icon: "🐄", domain: "animaux", sortOrder: 1 },
    { name: "Ovins", slug: "ovins", icon: "🐑", domain: "animaux", sortOrder: 2 },
    { name: "Caprins", slug: "caprins", icon: "🐐", domain: "animaux", sortOrder: 3 },
    { name: "Volailles", slug: "volailles", icon: "🐔", domain: "animaux", sortOrder: 4 },
    { name: "Porcins", slug: "porcins", icon: "🐷", domain: "animaux", sortOrder: 5 },
    { name: "Apiculture", slug: "apiculture", icon: "🐝", domain: "animaux", sortOrder: 6 },
    { name: "Cuniculture", slug: "cuniculture", icon: "🐰", domain: "animaux", sortOrder: 7 },
    { name: "Aquaculture", slug: "aquaculture", icon: "🐟", domain: "animaux", sortOrder: 8 },
    { name: "Reproducteurs", slug: "reproducteurs", icon: "🧬", domain: "animaux", sortOrder: 9 },
    { name: "Produits d'élevage", slug: "produits-elevage", icon: "🥚", domain: "animaux", sortOrder: 10 },

    // Alimentation animale
    { name: "Provende", slug: "provende", icon: "🌾", domain: "alimentation", sortOrder: 11 },
    { name: "Aliments composés", slug: "aliments-composes", icon: "🥣", domain: "alimentation", sortOrder: 12 },
    { name: "Fourrage et foin", slug: "fourrage-foin", icon: "🌿", domain: "alimentation", sortOrder: 13 },
    { name: "Céréales", slug: "cereales", icon: "🌽", domain: "alimentation", sortOrder: 14 },
    { name: "Compléments minéraux", slug: "complement-mineraux", icon: "💊", domain: "alimentation", sortOrder: 15 },

    // Matériel et équipements
    { name: "Mangeoires et abreuvoirs", slug: "mangeoires-abreuvoirs", icon: "🪣", domain: "equipement", sortOrder: 16 },
    { name: "Couveuses", slug: "couveuses", icon: "🥚", domain: "equipement", sortOrder: 17 },
    { name: "Cages et enclos", slug: "cages-enclos", icon: "🏚️", domain: "equipement", sortOrder: 18 },
    { name: "Matériel de traite", slug: "materiel-traite", icon: "🫗", domain: "equipement", sortOrder: 19 },
    { name: "Bâtiments et clôtures", slug: "batiments-clotures", icon: "🏗️", domain: "equipement", sortOrder: 20 },
    { name: "Balances", slug: "balances", icon: "⚖️", domain: "equipement", sortOrder: 21 },

    // Santé animale
    { name: "Vétérinaires", slug: "veterinaires", icon: "🩺", domain: "sante", sortOrder: 22 },
    { name: "Pharmacies vétérinaires", slug: "pharmacies-veterinaires", icon: "💊", domain: "sante", sortOrder: 23 },
    { name: "Vaccination", slug: "vaccination", icon: "💉", domain: "sante", sortOrder: 24 },
    { name: "Urgences animales", slug: "urgences-animales", icon: "🚨", domain: "sante", sortOrder: 25 },

    // Services techniques
    { name: "Conseil et suivi", slug: "conseil-suivi", icon: "📋", domain: "service", sortOrder: 26 },
    { name: "Insémination", slug: "insemination", icon: "🧬", domain: "service", sortOrder: 27 },
    { name: "Élevage à façon", slug: "elevage-facon", icon: "🚜", domain: "service", sortOrder: 28 },
    { name: "Installation", slug: "installation", icon: "🔧", domain: "service", sortOrder: 29 },

    // Transport
    { name: "Transport d'animaux", slug: "transport-animaux", icon: "🚛", domain: "transport", sortOrder: 30 },
    { name: "Livraison d'aliments", slug: "livraison-aliments", icon: "📦", domain: "transport", sortOrder: 31 },

    // Formation
    { name: "Formations pratiques", slug: "formations-pratiques", icon: "📚", domain: "formation", sortOrder: 32 },
    { name: "Fiches techniques", slug: "fiches-techniques", icon: "📄", domain: "formation", sortOrder: 33 },

    // Débouchés
    { name: "Boucheries et abattoirs", slug: "boucheries-abattoirs", icon: "🥩", domain: "debouche", sortOrder: 34 },
    { name: "Laiteries", slug: "laiteries", icon: "🥛", domain: "debouche", sortOrder: 35 },
    { name: "Restaurants et hôtels", slug: "restaurants-hotels", icon: "🍽️", domain: "debouche", sortOrder: 36 },
    { name: "Grossistes", slug: "grossistes", icon: "🏬", domain: "debouche", sortOrder: 37 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ ${categories.length} catégories créées`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
