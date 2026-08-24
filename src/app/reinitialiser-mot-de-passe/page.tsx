"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, Check, Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Lien invalide. Demandez un nouveau lien de réinitialisation.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit faire 6 caractères minimum");
      return;
    }
    if (newPassword !== confirmPw) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <h1 className="text-xl font-bold text-charbon-500 mb-2">Lien invalide</h1>
            <p className="text-charbon-400 mb-6">
              Ce lien de réinitialisation n&apos;est pas valide. Demandez un nouveau lien.
            </p>
            <Link href="/mot-de-passe-oublie" className="btn-primary inline-flex items-center gap-2">
              Demander un lien
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-vertprofond-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-vertprofond-500" />
            </div>
            <h1 className="text-xl font-bold text-charbon-500 mb-2">Mot de passe réinitialisé</h1>
            <p className="text-charbon-400 mb-6">
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <Link href="/connexion" className="btn-primary inline-flex items-center gap-2">
              Se connecter
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
          <div className="w-14 h-14 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-charbon-500">Nouveau mot de passe</h1>
          <p className="text-sm text-charbon-300 mt-1">
            Choisissez un nouveau mot de passe pour votre compte
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-rougeterre-50 border border-rougeterre-200 rounded-xl text-sm text-rougeterre-600">
              {error}
            </div>
          )}

          <form onSubmit={handleReset}>
            <div className="space-y-3">
              <div>
                <label className="input-label">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    className="input-field pl-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charbon-200 hover:text-charbon-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className={`input-field ${confirmPw && newPassword !== confirmPw ? "border-rougeterre-400" : ""}`}
                  required
                />
                {confirmPw && newPassword !== confirmPw && (
                  <p className="text-xs text-rougeterre-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Réinitialisation...
                </span>
              ) : (
                <>
                  Réinitialiser le mot de passe
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

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
