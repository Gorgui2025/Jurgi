import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Jurgi",
  description:
    "Consultez la politique de confidentialité de Jurgi : quelles données nous collectons et comment nous protégeons vos informations sur la plateforme.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
