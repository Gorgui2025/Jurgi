import type { MetadataRoute } from "next";

const BASE = "https://jurgi.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/connexion",
          "/inscription",
          "/mot-de-passe-oublie",
          "/reinitialiser-mot-de-passe",
          "/activer",
          "/messages",
          "/messages/",
          "/notifications",
          "/mes-annonces",
          "/paiement",
          "/publier",
          "/demandes/publier",
          "/livreur/demandes/publier",
          "/livreur/payer",
          "/livreur/reactiver",
          "/reinitialiser-mot-de-passe",
          "/profil",
          "/transporteur/profil",
          "/veterinaire/profil",
          "/institution/profil",
          "/livreur/profil",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
