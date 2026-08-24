"use client";

import { useState, useRef } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLoginForm({ action }: { action: (formData: FormData) => Promise<{ error?: string } | void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    try {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charbon-500 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration Jurgi</h1>
          <p className="text-sm text-charbon-200 mt-1">Centre de contrôle sécurisé</p>
        </div>

        <form ref={formRef} action={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="bg-rougeterre-50 border border-rougeterre-200 rounded-xl p-3">
              <p className="text-sm text-rougeterre-600">{error}</p>
            </div>
          )}

          <div>
            <label className="input-label">Email administrateur</label>
            <input
              type="email"
              name="email"
              className="input-field"
              placeholder="admin@jurgi.sn"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="input-label">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="input-field pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charbon-300 hover:text-charbon-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Connexion admin
              </>
            )}
          </button>

          <p className="text-[11px] text-charbon-300 text-center">
            Accès réservé aux administrateurs autorisés
          </p>
        </form>
      </div>
    </div>
  );
}
