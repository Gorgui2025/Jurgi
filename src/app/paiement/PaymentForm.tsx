"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  maxActiveListings: number;
}

export default function PaymentForm({ plan, paymentNumber, paymentMethods }: { plan: PlanData; paymentNumber: string; paymentMethods: string }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [step, setStep] = useState<"info" | "confirmation" | "activate">("info");
  const [activationCode, setActivationCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const handlePay = async () => {
    if (!session?.user?.id) {
      setError("Vous devez être connecté pour payer.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          planId: plan.id,
          transactionRef: transactionRef || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActivationCode(data.activationCode || "");
      setStep("confirmation");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async () => {
    if (!codeInput.trim()) return;
    setError("");

    try {
      const res = await fetch("/api/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode: codeInput, userId: session?.user?.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Abonnement activé avec succès !");
      setStep("activate");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(activationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-sable-200">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.push("/abonnement")} className="flex items-center gap-2 text-baobab-500 mb-6 hover:underline">
          <ArrowLeft size={16} /> Retour aux abonnements
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-beigebrume-200 overflow-hidden">
          {step === "info" && (
            <>
              <div className="bg-gradient-to-r from-baobab-500 to-vertprofond-500 p-6 text-white">
                <h1 className="text-xl font-bold">Souscrire à {plan.name}</h1>
                <p className="text-sm opacity-90 mt-1">
                  {plan.durationDays >= 365 ? "12 mois" : `${plan.durationDays} jours`} — {plan.maxActiveListings} annonces actives
                </p>
                <div className="mt-3 text-3xl font-bold">
                  {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString()} ${plan.currency}`}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-vertbrume-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-baobab-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-charbon-500 text-sm">Paiement sécurisé</h3>
                      <p className="text-xs text-charbon-500/60 mt-1">
                        Effectuez un virement Wave ou Orange Money, puis cliquez &quot;J&apos;ai payé&quot; pour activer votre abonnement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-ocre-50 rounded-xl p-4">
                  <h3 className="font-semibold text-charbon-500 text-sm mb-2">Instructions de paiement</h3>
                  <ol className="text-xs text-charbon-500/70 space-y-2">
                    <li className="flex gap-2">
                      <span className="bg-baobab-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Ouvrez votre application <strong>{paymentMethods}</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-baobab-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <span>Envoyez <strong>{plan.price.toLocaleString()} {plan.currency}</strong> au numéro suivant :</span>
                    </li>
                  </ol>
                  <div className="mt-3 bg-white rounded-lg p-3 text-center border border-beigebrume-200">
                    <p className="text-[10px] text-charbon-500/50 uppercase tracking-wide mb-1">Numéro de paiement</p>
                    <p className="text-lg font-bold text-baobab-500 font-mono tracking-wider">{paymentNumber}</p>
                  </div>
                  <ol className="text-xs text-charbon-500/70 space-y-2 mt-3 list-none" start={3}>
                    <li className="flex gap-2">
                      <span className="bg-baobab-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <span>Copiez la <strong>référence du paiement</strong> et collez-la ci-dessous</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-baobab-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                      <span>Cliquez <strong>&quot;J&apos;ai payé&quot;</strong> — votre demande sera vérifiée par un admin</span>
                    </li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charbon-500 mb-1">
                    Référence du paiement <span className="text-charbon-500/40">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Ex: WVE12345678 ou OM987654321"
                    className="w-full border border-beigebrume-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-baobab-500/30 focus:border-baobab-500"
                  />
                </div>

                {error && (
                  <div className="bg-rougeterre-50 text-rougeterre-500 rounded-lg p-3 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={submitting}
                  className="w-full bg-baobab-500 text-white py-3 rounded-xl font-semibold hover:bg-baobab-600 transition disabled:opacity-50"
                >
                  {submitting ? "Envoi en cours..." : "J'ai payé"}
                </button>
              </div>
            </>
          )}

          {step === "confirmation" && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-ocre-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={32} className="text-ocre-500" />
                </div>
                <h2 className="text-lg font-bold text-charbon-500">Paiement en cours de vérification</h2>
                <p className="text-sm text-charbon-500/60 mt-1">
                  Un administrateur vérifie votre paiement.
                </p>
              </div>

              <div className="bg-vertbrume-50 rounded-xl p-4 text-center">
                <p className="text-xs text-charbon-500/50 mb-1">Votre code d&apos;activation</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xl font-mono font-bold text-baobab-500 tracking-wider">{activationCode}</code>
                  <button onClick={copyCode} className="p-1 hover:bg-vertbrume-100 rounded transition">
                    {copied ? <Check size={16} className="text-vertprofond-500" /> : <Copy size={16} className="text-charbon-500/40" />}
                  </button>
                </div>
                <p className="text-[11px] text-charbon-500/40 mt-2">
                  Conservez ce code — il vous sera demandé pour activer votre abonnement
                </p>
              </div>

              <div className="bg-ocre-50 rounded-xl p-3">
                <p className="text-xs text-charbon-500/60 text-center">
                  <strong>Temps d&apos;attente estimé :</strong> 1 à 30 minutes
                </p>
              </div>

              <button
                onClick={() => setStep("activate")}
                className="w-full bg-baobab-500 text-white py-3 rounded-xl font-semibold hover:bg-baobab-600 transition"
              >
                J&apos;ai reçu mon code
              </button>
            </div>
          )}

          {step === "activate" && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-vertprofond-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-vertprofond-500" />
                </div>
                <h2 className="text-lg font-bold text-charbon-500">Activez votre abonnement</h2>
                <p className="text-sm text-charbon-500/60 mt-1">
                  Entrez le code d&apos;activation reçu pour finaliser.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-charbon-500 mb-1">Code d&apos;activation</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="JURGI-XXXX-XXXX"
                  className="w-full border border-beigebrume-200 rounded-lg px-3 py-2.5 text-sm font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-baobab-500/30 focus:border-baobab-500"
                />
              </div>

              {error && (
                <div className="bg-rougeterre-50 text-rougeterre-500 rounded-lg p-3 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {success && (
                <div className="bg-vertprofond-50 text-vertprofond-500 rounded-lg p-3 text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> {success}
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={!codeInput.trim()}
                className="w-full bg-baobab-500 text-white py-3 rounded-xl font-semibold hover:bg-baobab-600 transition disabled:opacity-50"
              >
                Activer mon abonnement
              </button>

              {success && (
                <button
                  onClick={() => router.push("/abonnement")}
                  className="w-full bg-vertbrume-100 text-baobab-500 py-3 rounded-xl font-semibold hover:bg-vertbrume-200 transition"
                >
                  Voir mon abonnement
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
