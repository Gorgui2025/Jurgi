import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Livreurs de bétail au Sénégal",
  description:
    "Trouvez un livreur pour le transport de vos animaux d'élevage au Sénégal : livraison locale et inter-régionale de bétail en toute sécurité.",
  alternates: { canonical: "/livreurs" },
  openGraph: {
    type: "website",
    title: "Livreurs de bétail au Sénégal",
    description:
      "Annuaire des livreurs de bétail au Sénégal pour le transport et la livraison de vos animaux d'élevage.",
  },
};

export default function LivreursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
