import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vétérinaires au Sénégal",
  description:
    "Trouvez un vétérinaire ou une clinique vétérinaire près de chez vous au Sénégal pour la santé, le suivi et le traitement de vos animaux d'élevage.",
  alternates: { canonical: "/veterinaires" },
  openGraph: {
    type: "website",
    title: "Vétérinaires au Sénégal",
    description:
      "Annuaire des vétérinaires et cliniques vétérinaires du Sénégal pour la santé de vos animaux d'élevage.",
  },
};

export default function VeterinairesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
