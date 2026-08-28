import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutions et partenaires de l'élevage",
  description:
    "Découvrez les institutions, organisations et partenaires du secteur de l'élevage au Sénégal : ministères, ONG, coopératives et programmes d'appui.",
  alternates: { canonical: "/institutions" },
  openGraph: {
    type: "website",
    title: "Institutions et partenaires de l'élevage au Sénégal",
    description:
      "Annuaire des institutions, organisations et partenaires du secteur de l'élevage au Sénégal.",
  },
};

export default function InstitutionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
