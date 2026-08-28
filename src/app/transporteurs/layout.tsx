import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transporteurs de bétail au Sénégal",
  description:
    "Trouvez un transporteur de bétail fiable au Sénégal pour le déplacement sécurisé de vos bovins, ovins, caprins et autres animaux d'élevage.",
  alternates: { canonical: "/transporteurs" },
  openGraph: {
    type: "website",
    title: "Transporteurs de bétail au Sénégal",
    description:
      "Annuaire des transporteurs de bétail au Sénégal : déplacement sécurisé de vos animaux entre les régions.",
  },
};

export default function TransporteursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
