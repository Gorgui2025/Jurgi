"use client";

import { useState, useEffect } from "react";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "moderation" | "support" | "validateur_paiement";
  permissions: string[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  moderation: "Modération et confiance",
  support: "Support et opérations",
  validateur_paiement: "Validateur de paiements",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-baobab-100 text-baobab-600",
  moderation: "bg-vertprofond-100 text-vertprofond-600",
  support: "bg-ocre-100 text-ocre-600",
  validateur_paiement: "bg-blue-100 text-blue-600",
};

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jurgi_admin");
      if (stored) {
        setAdmin(JSON.parse(stored));
      }
    } catch {}
    setLoading(false);
  }, []);

  const hasPermission = (perm: string) => {
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    return admin.permissions.includes(perm);
  };

  const logout = () => {
    localStorage.removeItem("jurgi_admin");
    document.cookie = "jurgi_admin_token=; path=/admin; max-age=0";
    window.location.href = "/admin/login";
  };

  return { admin, loading, hasPermission, logout, ROLE_LABELS, ROLE_COLORS };
}
