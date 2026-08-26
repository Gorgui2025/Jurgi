"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Clock, Shield, Copy, Check, ArrowLeft, Truck, CreditCard } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
}

export default function LivreurPaymentForm({ plan, paymentNumber, paymentMethods }: { plan: PlanData; paymentNumber: string; paymentMethods: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [step, setStep] = useState<"info" | "confirmation" | "activate">("info");
  const [activationCode, setActivationCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/delivery-profiles?userId=${session.user.id}`)
        .then(r => r.json())
        .then(d => setHasProfile(!!d?.id))
        .catch(() => setHasProfile(false));
    }
  }, [session]);

  if (status === "loading" || hasProfile === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-container max-w-lg mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Connexion requise</h2>
        <Link href="/connexion" className="btn-primary inline-flex items-center gap-2 mt-4">Se connecter</Link>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="page-container max-w-lg mx-auto py-16 px-4 text-center">
        <Truck className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Profil livreur requis</h2>
        <p className="text-sm text-charbon-300 mb-6">Créez votre profil livreur avant de souscrire.</p>
        <Link href="/livreur/profil" className="btn-primary inline-flex items-center gap-2">Créer mon profil</Link>
      </div>
    );
  }

  const handlePay = async () => {
    if (!session?.user?.id) return;
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
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

      await fetch("/api/delivery-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session!.user.id, action: "subscribe" }),
      });

      setSuccess("Abonnement activé ! Votre profil est maintenant visible dans l'annuaire.");
      setStep("activate");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
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
        <Link href="/livreur/profil" className="flex items-center gap-2 text-baobab-500 mb-6 hover:underline">
          <ArrowLeft size={16} /> Retour au profil livreur
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-beigebrume-200 overflow-hidden">
          {step === "info" && (
            <>
              <div className="bg-gradient-to-r from-baobab-500 to-vertprofond-500 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5" />
                  <h1 className="text-xl font-bold">Souscrire à {plan.name}</h1>
                </div>
                <p className="text-sm opacity-90">
                  {plan.durationDays} jours d&apos;abonnement livreur
                </p>
                <div className="mt-3 text-3xl font-bold">
                  {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString("fr-FR")} ${plan.currency}`}
                  {plan.price > 0 && <span className="text-sm font-normal opacity-80">/mois</span>}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-vertbrume-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-baobab-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-charbon-500 text-sm">Paiement sécurisé</h3>
                      <p className="text-xs text-charbon-500/60 mt-1">
                        Effectuez un virement Wave ou Orange Money, puis cliquez &quot;J&apos;ai payé&quot; pour activer votre abonnement livreur.
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
                      <span>Envoyez <strong>{plan.price.toLocaleString("fr-FR")} {plan.currency}</strong> au numéro suivant :</span>
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
                  className="w-full bg-baobab-500 text-white py-3 rounded-xl font-semibold hover:bg-baobab-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
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
                disabled={!codeInput.trim() || !!success}
                className="w-full bg-baobab-500 text-white py-3 rounded-xl font-semibold hover:bg-baobab-600 transition disabled:opacity-50"
              >
                Activer mon abonnement
              </button>

              {success && (
                <button
                  onClick={() => router.push("/livreur/profil")}
                  className="w-full bg-vertbrume-100 text-baobab-500 py-3 rounded-xl font-semibold hover:bg-vertbrume-200 transition"
                >
                  Voir mon profil livreur
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
