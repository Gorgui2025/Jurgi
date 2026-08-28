import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import AssistantWidget from "@/components/AssistantWidget";

const BASE_URL = "https://jurgi.vercel.app";

const titleTemplate = "%s | Jurgi Sénégal";
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Jurgi — Tout l'écosystème de l'élevage, au même endroit",
    template: titleTemplate,
  },
  description:
    "Trouvez des animaux, aliments, équipements, services vétérinaires, transporteurs et partenaires pour votre élevage au Sénégal.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Jurgi",
    locale: "fr_SN",
    url: BASE_URL,
    title: "Jurgi — Tout l'écosystème de l'élevage, au même endroit",
    description:
      "Trouvez des animaux, aliments, équipements, services vétérinaires, transporteurs et partenaires pour votre élevage au Sénégal.",
    images: [{ url: "/manus-storage/jurgi-hero-ecosystem_b1b8d6c9.png", width: 1200, height: 630, alt: "Jurgi — écosystème de l'élevage au Sénégal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jurgi — Tout l'écosystème de l'élevage, au même endroit",
    description:
      "Trouvez des animaux, aliments, équipements, services vétérinaires, transporteurs et partenaires pour votre élevage au Sénégal.",
    images: ["/manus-storage/jurgi-hero-ecosystem_b1b8d6c9.png"],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Jurgi",
              url: BASE_URL,
              logo: `${BASE_URL}/favicon.svg`,
              description:
                "Tout l'écosystème de l'élevage au Sénégal : animaux, aliments, équipements, vétérinaires, transporteurs et institutionnels.",
              areaServed: "Sénégal",
              sameAs: [],
            }),
          }}
        />
        <meta
          name="google-site-verification"
          content="iHL9j5nBuisxT-HEyVmUi2wU0Bf8J73BKVZwjF1Q7xE"
        />
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
