"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Crown, Zap, CheckCircle, Clock, CreditCard, ArrowRight, AlertTriangle,
  Package, Image, Film, Loader2, Receipt, ShieldCheck,
} from "lucide-react";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  durationDays: number;
  maxActiveListings: number;
  maxPhotosPerListing: number;
  maxVideosPerListing: number;
  maxVideoSizeMb: number;
  autoRenew: boolean;
  isTrialEligible: boolean;
  commercialMessage: string | null;
}

interface Quotas {
  maxActiveListings: number;
  maxPhotosPerListing: number;
  maxVideosPerListing: number;
  maxVideoSizeMb: number;
  activeListings: number;
  remainingListings: number;
}

interface Payment {
  id: string;
  amount: number;
  finalAmount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  plan: { name: string; slug: string };
  promotion: { name: string; code: string | null } | null;
  createdAt: string;
}

interface SubscriptionData {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  plan: Plan;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  gratuit: <Package className="w-6 h-6" />,
  express: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  gratuit: "border-charbon-200 bg-beigebrume-50",
  express: "border-ocre-300 bg-ocre-50",
  pro: "border-baobab-300 bg-baobab-50",
};

const PLAN_TEXT: Record<string, string> = {
  gratuit: "text-charbon-500",
  express: "text-ocre-600",
  pro: "text-baobab-600",
};

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " FCFA";
}

export default function AbonnementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialEnabled, setTrialEnabled] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = (session.user as any).id;

    Promise.all([
      fetch("/api/plans").then(r => r.json()),
      fetch(`/api/subscriptions?userId=${userId}`).then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
    ]).then(([plansData, subData, settingsData]) => {
      setPlans(plansData.plans || []);
      setSubscription(subData.subscription || null);
      setQuotas(subData.quotas || null);
      setPayments(subData.payments || []);
      setTrialEnabled(settingsData.settings?.trial_enabled === "true");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]);

  const handleSubscribe = async (planSlug: string) => {
    if (!session?.user?.id) return;
    const userId = (session.user as any).id;
    setSubscribing(planSlug);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planSlug, promotionCode: promoCode || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error || "Erreur");
        setSubscribing(null);
        return;
      }

      if (data.requiresPayment) {
        setPromoSuccess(`Paiement de ${formatPrice(data.payment.finalAmount)} en attente. Le paiement automatique sera disponible prochainement.`);
        setPayments(prev => [{ ...data.payment, plan: plans.find(p => p.slug === planSlug)!, promotion: null, status: "pending", paymentMethod: null, createdAt: new Date().toISOString() }, ...prev]);
      } else {
        setSubscription(data.subscription);
        setPromoSuccess("Abonnement activé avec succès !");
        fetch(`/api/subscriptions?userId=${userId}`).then(r => r.json()).then(d => {
          setSubscription(d.subscription);
          setQuotas(d.quotas);
          setPayments(d.payments || []);
        });
      }
    } catch {
      setPromoError("Erreur réseau");
    }
    setSubscribing(null);
  };

  const handleTrial = async () => {
    if (!session?.user?.id) return;
    setTrialLoading(true);
    setPromoError("");
    setPromoSuccess("");
    try {
      const res = await fetch("/api/subscriptions/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: (session.user as any).id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Erreur");
      } else {
        setSubscription(data.subscription);
        setPromoSuccess(data.message || "Essai activé !");
        fetch(`/api/subscriptions?userId=${(session.user as any).id}`).then(r => r.json()).then(d => {
          setSubscription(d.subscription);
          setQuotas(d.quotas);
        });
      }
    } catch {
      setPromoError("Erreur réseau");
    }
    setTrialLoading(false);
  };

  if (loading || status === "loading") {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-baobab-500 animate-spin" />
      </div>
    );
  }

  const currentPlan = subscription?.plan;
  const isFree = !currentPlan || currentPlan.slug === "gratuit";

  return (
    <div className="page-container max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charbon-500 flex items-center gap-2">
          <Crown className="w-6 h-6 text-baobab-500" /> Mon abonnement
        </h1>
        <p className="text-sm text-charbon-300 mt-1">Gérez votre plan et consultez votre historique</p>
      </div>

      {currentPlan && (
        <div className={`card p-6 border-2 ${PLAN_COLORS[currentPlan.slug] || "border-charbon-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={PLAN_TEXT[currentPlan.slug] || "text-charbon-500"}>{PLAN_ICONS[currentPlan.slug]}</div>
            <div>
              <h2 className="text-lg font-bold text-charbon-500">{currentPlan.name}</h2>
              <p className="text-sm text-charbon-300">{formatPrice(currentPlan.price)} {currentPlan.durationDays > 0 ? `/ ${currentPlan.durationDays} jours` : "— illimité"}</p>
            </div>
            <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${
              subscription?.status === "active" ? "bg-vertprofond-100 text-vertprofond-600" :
              subscription?.status === "pending_payment" ? "bg-ocre-100 text-ocre-600" :
              "bg-charbon-100 text-charbon-400"
            }`}>
              {subscription?.status === "active" ? "Actif" : subscription?.status === "pending_payment" ? "En attente de paiement" : subscription?.status || "Gratuit"}
            </span>
          </div>

          {subscription?.endDate && (
            <p className="text-xs text-charbon-400 mb-3">
              <Clock className="w-3 h-3 inline mr-1" />
              Expire le {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
            </p>
          )}

          {quotas && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-baobab-500">{quotas.activeListings}</p>
                <p className="text-[10px] text-charbon-300">/ {quotas.maxActiveListings} annonces</p>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-baobab-500">{quotas.maxPhotosPerListing}</p>
                <p className="text-[10px] text-charbon-300">photos/annonce</p>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-baobab-500">{quotas.maxVideosPerListing}</p>
                <p className="text-[10px] text-charbon-300">vidéos/annonce</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!isFree && subscription?.autoRenew && (
        <div className="card p-4 bg-vertbrume-50 border border-vertprofond-200">
          <p className="text-sm text-vertprofond-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Renouvellement automatique activé
          </p>
          <p className="text-xs text-charbon-400 mt-1">Le renouvellement sera effectué avec votre consentement explicite.</p>
        </div>
      )}

      <div className="card p-4 bg-ocre/5 border border-ocre/20">
        <a href="/activer" className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charbon-500">Vous avez un code d&apos;activation ?</p>
            <p className="text-xs text-charbon-300">Entrez votre code pour activer votre abonnement</p>
          </div>
          <ArrowRight className="w-5 h-5 text-baobab" />
        </a>
      </div>

      <div>
        <h2 className="text-lg font-bold text-charbon-500 mb-4">Choisir un plan</h2>

        {promoError && (
          <div className="card p-3 bg-rougeterre-50 border border-rougeterre-200 mb-4">
            <p className="text-sm text-rougeterre-600">{promoError}</p>
          </div>
        )}
        {promoSuccess && (
          <div className="card p-3 bg-vertprofond-50 border border-vertprofond-200 mb-4">
            <p className="text-sm text-vertprofond-600">{promoSuccess}</p>
          </div>
        )}

        {trialEnabled && isFree && !subscription && (
          <div className="card p-4 bg-ocre-50 border border-ocre-200 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ocre-600">Essai gratuit disponible</p>
              <p className="text-xs text-charbon-400">Testez Jurgi Express pendant 7 jours sans engagement.</p>
            </div>
            <button
              onClick={handleTrial}
              disabled={trialLoading}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-ocre-500 text-white hover:bg-ocre-600 disabled:opacity-50"
            >
              {trialLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Activer l&apos;essai
            </button>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs text-charbon-300 mb-1 block">Code promotionnel (facultatif)</label>
          <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="ex: TABASKI2026" className="input-field text-sm max-w-xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrent = currentPlan?.slug === plan.slug;
            const isDisabled = isCurrent || subscribing !== null;
            return (
              <div key={plan.id} className={`card p-5 border-2 ${isCurrent ? "border-baobab-400 bg-baobab-50" : "border-beigebrume-200 hover:border-baobab-200"} transition-all`}>
                <div className="text-center mb-4">
                  <div className={`mx-auto mb-2 ${PLAN_TEXT[plan.slug]}`}>{PLAN_ICONS[plan.slug]}</div>
                  <h3 className="font-bold text-charbon-500">{plan.name}</h3>
                  <p className="text-2xl font-bold text-charbon-500 mt-2">{formatPrice(plan.price)}</p>
                  {plan.durationDays > 0 && <p className="text-xs text-charbon-300">{plan.durationDays} jours</p>}
                  {plan.durationDays === 0 && <p className="text-xs text-charbon-300">Illimité</p>}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-charbon-400">
                    <CheckCircle className="w-3 h-3 text-vertprofond-500 shrink-0" />
                    <span>{plan.maxActiveListings} annonces actives</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charbon-400">
                    <CheckCircle className="w-3 h-3 text-vertprofond-500 shrink-0" />
                    <span>{plan.maxPhotosPerListing} photos par annonce</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charbon-400">
                    <CheckCircle className="w-3 h-3 text-vertprofond-500 shrink-0" />
                    <span>{plan.maxVideosPerListing} vidéos par annonce</span>
                  </div>
                </div>

                {plan.commercialMessage && (
                  <p className="text-[10px] text-charbon-300 italic mb-4">{plan.commercialMessage}</p>
                )}

                <button
                  onClick={() => {
                    if (plan.price === 0) {
                      handleSubscribe(plan.slug);
                    } else {
                      router.push(`/paiement?plan=${plan.id}`);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    isCurrent
                      ? "bg-baobab-100 text-baobab-600 cursor-default"
                      : plan.price === 0
                        ? "bg-charbon-500 text-white hover:bg-charbon-600"
                        : "bg-baobab-500 text-white hover:bg-baobab-600"
                  } disabled:opacity-50`}
                >
                  {isCurrent ? (
                    "Plan actuel"
                  ) : subscribing === plan.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plan.price === 0 ? (
                    "Activer"
                  ) : (
                    <>Souscrire <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-charbon-500 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-ocre-500" /> Historique des paiements
          </h2>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-beigebrume-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-charbon-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charbon-500">{p.plan.name}</p>
                  <p className="text-xs text-charbon-300">
                    {formatPrice(p.finalAmount)}
                    {p.promotion && <span className="text-vertprofond-500 ml-1">({p.promotion.name})</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    p.status === "completed" ? "bg-vertprofond-100 text-vertprofond-600" :
                    p.status === "pending" ? "bg-ocre-100 text-ocre-600" :
                    "bg-rougeterre-100 text-rougeterre-600"
                  }`}>
                    {p.status === "completed" ? "Payé" : p.status === "pending" ? "En attente" : "Échoué"}
                  </span>
                  <p className="text-[10px] text-charbon-200 mt-1">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 bg-beigebrume-50 border border-beigebrume-200">
        <p className="text-xs text-charbon-400 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-ocre-400" />
          Le paiement automatique Mobile Money (Wave, Orange Money) sera disponible prochainement via UnitechPay.
        </p>
      </div>
    </div>
  );
}
