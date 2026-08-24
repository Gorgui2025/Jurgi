"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace?domain=animaux", label: "Animaux" },
      { href: "/marketplace?domain=alimentation", label: "Alimentation" },
      { href: "/marketplace?domain=equipement", label: "Équipements" },
      { href: "/marketplace?domain=debouche", label: "Débouchés" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/services?type=veterinaire", label: "Santé animale" },
      { href: "/services?type=transport", label: "Transport" },
      { href: "/demandes", label: "Demandes de devis" },
      { href: "/formation", label: "Formation" },
    ],
  },
  {
    title: "À propos",
    links: [
      { href: "/a-propos", label: "À propos de Jurgi" },
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
      { href: "/contact", label: "Nous contacter" },
    ],
  },
];

interface Settings {
  platform_name?: string;
  platform_description?: string;
  contact_email?: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const name = settings.platform_name || "Jurgi";
  const desc = settings.platform_description || "Tout l'écosystème de l'élevage, au même endroit. Marketplace, services et partenaires au Sénégal.";

  return (
    <footer className="bg-charbon-500 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-baobab-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="text-xl font-bold">{name}</span>
            </Link>
            <p className="text-sm text-beigebrume-300 leading-relaxed mb-4">
              {desc}
            </p>
            <p className="text-xs text-charbon-300 leading-relaxed">
              Conçu au Sénégal pour les acteurs de l&apos;élevage.
            </p>
          </div>

          {/* Links */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-beigebrume-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-charbon-400 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-beigebrume-300">
            © 2026 {name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
