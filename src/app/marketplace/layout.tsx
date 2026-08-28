import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — Acheter et vendre du bétail et du matériel",
  description:
    "Parcourez les annonces d'animaux (bovins, ovins, caprins, volaille...), aliments de bétail, équipements et matériel d'élevage au Sénégal.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    type: "website",
    title: "Marketplace — Acheter et vendre du bétail au Sénégal",
    description:
      "Parcourez les annonces d'animaux, aliments, équipements et matériel d'élevage au Sénégal — vendus directement par les éleveurs et fournisseurs.",
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
