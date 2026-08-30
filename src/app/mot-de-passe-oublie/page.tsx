"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, ArrowRight, Check } from "lucide-react";

export default function MotDePasseOubliePage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-vertprofond-500" />
            </div>
            <h1 className="text-xl font-bold text-charbon-500 mb-2">Email envoyé</h1>
            <p className="text-charbon-400 mb-4">
              Si un compte existe avec <strong>{identifier}</strong>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-charbon-300 mb-6">
              Vérifiez votre boîte de réception et vos spams.
            </p>
            <Link href="/connexion" className="btn-primary inline-flex items-center gap-2">
              Retour à la connexion
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/assets/brand/jurgi-logo-192.png" alt="Logo Jurgi" width={56} height={56} className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-charbon-500">Mot de passe oublié</h1>
          <p className="text-sm text-charbon-300 mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-rougeterre-50 border border-rougeterre-200 rounded-xl text-sm text-rougeterre-600">
              {error}
            </div>
          )}

          <div className="flex rounded-xl bg-beigebrume-100 p-1 mb-4">
            <button
              onClick={() => { setMethod("phone"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === "phone"
                  ? "bg-white text-charbon-500 shadow-sm"
                  : "text-charbon-300 hover:text-charbon-400"
              }`}
            >
              <Phone className="w-4 h-4" />
              Téléphone
            </button>
            <button
              onClick={() => { setMethod("email"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === "email"
                  ? "bg-white text-charbon-500 shadow-sm"
                  : "text-charbon-300 hover:text-charbon-400"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          <form onSubmit={handleRequest}>
            <label className="input-label">
              {method === "phone" ? "Numéro de téléphone" : "Adresse email"}
            </label>
            <div className="relative">
              {method === "phone" ? (
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
              ) : (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
              )}
              <input
                type={method === "phone" ? "tel" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={method === "phone" ? "+221 77 123 45 67" : "moussa@exemple.com"}
                className="input-field pl-11"
                required
              />
            </div>
            <p className="text-xs text-charbon-300 mt-2">
              {method === "phone"
                ? "Un lien sera envoyé à l'adresse email associée à ce numéro."
                : "Vous recevrez un email avec un lien de réinitialisation."}
            </p>
            <button
              type="submit"
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </span>
              ) : (
                <>
                  Envoyer le lien
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-charbon-300 mt-6">
          <Link href="/connexion" className="text-baobab-500 font-semibold hover:text-baobab-600">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
