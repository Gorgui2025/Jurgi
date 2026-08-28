import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abonnements et tarifs — Jurgi",
  description:
    "Découvrez les formules d'abonnement Jurgi (Gratuit, Express, Pro, Livreur) : publier plus d'annonces, diffuser des vidéos et booster votre visibilité auprès des éleveurs sénégalais.",
  alternates: { canonical: "/abonnement" },
  openGraph: {
    type: "website",
    title: "Abonnements et tarifs — Jurgi",
    description:
      "Choisissez votre formule Jurgi pour vendre plus facilement vos animaux et produits d'élevage au Sénégal.",
  },
};

export default function AbonnementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
