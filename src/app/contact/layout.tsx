import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Jurgi Sénégal",
  description:
    "Contactez l'équipe Jurgi au Sénégal : assistance, questions sur les annonces, abonnements ou partenariats dans le secteur de l'élevage.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: "Contact — Jurgi Sénégal",
    description:
      "Une question sur Jurgi ou l'élevage au Sénégal ? Contactez notre équipe, nous vous répondons rapidement.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
