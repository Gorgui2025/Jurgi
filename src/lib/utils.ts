import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
  }).format(price) + " FCFA";
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}

export const REGIONS_SENEGAL = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kédougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Thiès",
  "Ziguinchor",
];

export const ROLES = [
  { value: "eleveur", label: "Éleveur / Exploitant" },
  { value: "vendeur_animaux", label: "Vendeur d'animaux" },
  { value: "fournisseur", label: "Fournisseur d'aliments" },
  { value: "veterinaire", label: "Vétérinaire / Technicien" },
  { value: "transporteur", label: "Transporteur" },
  { value: "acheteur", label: "Acheteur professionnel" },
  { value: "formateur", label: "Formateur" },
  { value: "institution", label: "Institution / Coopérative" },
];

export const DOMAINS = [
  { value: "animaux", label: "Animaux et produits vivants" },
  { value: "alimentation", label: "Alimentation animale" },
  { value: "equipement", label: "Matériel et équipements" },
  { value: "sante", label: "Santé animale" },
  { value: "service", label: "Services techniques" },
  { value: "transport", label: "Transport et logistique" },
  { value: "formation", label: "Formation et information" },
  { value: "debouche", label: "Débouchés et transformation" },
];
