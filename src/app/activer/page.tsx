"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Key,
  CheckCircle,
  AlertCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ActiverPage() {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode: code, userId: session?.user?.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sable">
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/abonnement" className="flex items-center gap-2 text-baobab mb-6 hover:underline text-sm">
          <ArrowLeft size={16} /> Retour aux abonnements
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-vertbrume p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-baobab/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Key size={28} className="text-baobab" />
            </div>
            <h1 className="text-xl font-bold text-charbon">Activer mon abonnement</h1>
            <p className="text-sm text-charbon/60 mt-1">
              Entrez le code d&apos;activation reçu après validation de votre paiement.
            </p>
          </div>

          <div className="bg-vertbrume/40 rounded-xl p-3 flex items-start gap-2">
            <Shield size={16} className="text-baobab mt-0.5 shrink-0" />
            <p className="text-xs text-charbon/60">
              Ce code vous est envoyé par un administrateur après vérification de votre paiement.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon mb-1">Code d&apos;activation</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="JURGI-XXXX-XXXX"
              className="w-full border border-vertbrume rounded-lg px-3 py-3 text-lg font-mono text-center tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-baobab/30 focus:border-baobab"
            />
          </div>

          {error && (
            <div className="bg-rougeterre/10 text-rougeterre rounded-lg p-3 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {result && (
            <div className="bg-vertprofond/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-vertprofond">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">Code valide !</span>
              </div>
              <div className="text-sm text-charbon/70 space-y-1">
                <p><strong>Plan :</strong> {result.planName}</p>
                <p><strong>Montant :</strong> {result.amount?.toLocaleString()} {result.currency}</p>
                {result.subscription && (
                  <p><strong>Expire le :</strong> {new Date(result.subscription.endDate).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={!code.trim() || loading}
            className="w-full bg-baobab text-white py-3 rounded-xl font-semibold hover:bg-vertprofond transition disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}
