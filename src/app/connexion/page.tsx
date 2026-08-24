"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { Phone, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function ConnexionPage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("+221 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, string> = { password };
      if (method === "phone") {
        payload.phone = phone.trim();
      } else {
        payload.email = email.trim();
      }
      const result = await signIn("credentials", {
        redirect: false,
        ...payload,
      });
      if (result?.error) {
        if (result.error === "pending_validation") {
          setError("Votre compte est en attente de validation par notre équipe.");
        } else {
          setError(
            method === "phone"
              ? "Numéro ou mot de passe incorrect"
              : "Email ou mot de passe incorrect"
          );
        }
      } else {
        const session = await getSession();
        const emailAddr = session?.user?.email;
        window.location.href = emailAddr === "admin@jurgi.sn" ? "/admin" : "/";
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-charbon-500">Connexion</h1>
          <p className="text-sm text-charbon-300 mt-1">
            Accédez à votre espace Jurgi
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

          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              {method === "phone" ? (
                <div>
                  <label className="input-label">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+221 77 123 45 67"
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="input-label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="moussa@exemple.com"
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charbon-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
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
            </div>

            <div className="flex justify-end mt-2">
              <Link href="/mot-de-passe-oublie" className="text-xs text-baobab-500 hover:text-baobab-600 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-charbon-300 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-baobab-500 font-semibold hover:text-baobab-600">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
