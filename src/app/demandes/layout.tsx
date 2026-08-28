import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demandes d'achat — Vendez aux éleveurs du Sénégal",
  description:
    "Consultez les demandes d'animaux, d'aliments, d'équipements et de services des éleveurs au Sénégal. Répondez et proposez vos produits.",
  alternates: { canonical: "/demandes" },
  openGraph: {
    type: "website",
    title: "Demandes d'achat des éleveurs au Sénégal",
    description:
      "Découvrez ce que recherchent les éleveurs au Sénégal : animaux, aliments, équipements et services. Proposez vos produits et remportez les marchés.",
  },
};

export default function DemandesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
