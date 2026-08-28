import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import AssistantWidget from "@/components/AssistantWidget";

export const metadata: Metadata = {
  title: "Jurgi — Tout l'écosystème de l'élevage, au même endroit",
  description:
    "Trouvez des animaux, aliments, équipements, services vétérinaires, transporteurs et partenaires pour votre élevage au Sénégal.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1F6B4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
