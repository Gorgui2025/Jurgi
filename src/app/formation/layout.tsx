import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formations en élevage au Sénégal",
  description:
    "Formations et conseils en élevage au Sénégal : santé animale, alimentation, reproduction et gestion d'exploitation pour améliorer vos rendements.",
  alternates: { canonical: "/formation" },
  openGraph: {
    type: "website",
    title: "Formations en élevage au Sénégal",
    description:
      "Formez-vous aux bonnes pratiques d'élevage au Sénégal : santé animale, alimentation, reproduction et gestion d'exploitation.",
  },
};

export default function FormationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
