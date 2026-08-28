import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services pour l'élevage au Sénégal",
  description:
    "Tous les services utiles à votre élevage au Sénégal : vétérinaires, transport de bétail, livreurs, aliments, équipements, institutions et financement.",
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    title: "Services pour l'élevage au Sénégal",
    description:
      "L'ensemble des services nécessaires à votre activité d'élevage au Sénégal, réunis au même endroit.",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
