import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de Jurgi — Notre mission",
  description:
    "Jurgi connecte les éleveurs du Sénégal : vente d'animaux, achats, services vétérinaires, transport, finance et partenaires institutionnels. Découvrez notre mission.",
  alternates: { canonical: "/a-propos" },
  openGraph: {
    type: "website",
    title: "À propos de Jurgi — Notre mission",
    description:
      "Jurgi, l'écosystème numérique qui relie les éleveurs du Sénégal à tous les acteurs de la filière élevage.",
  },
};

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
