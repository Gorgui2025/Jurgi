import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales — Jurgi",
  description:
    "Consultez les conditions générales d'utilisation de la plateforme Jurgi, l'écosystème de l'élevage au Sénégal.",
  alternates: { canonical: "/conditions" },
};

export default function ConditionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
