"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, Clock, CreditCard, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Shield } from "lucide-react";

interface SubInfo {
  subscribed: boolean;
  profile: { id: string; status: string; trialEndsAt: string | null; subscriptionEnd: string | null; isActive: boolean };
  plan: { price: number; name: string } | null;
}

export default function LivreurReactiverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/delivery-subscriptions?userId=${session.user.id}`)
        .then(r => r.json())
        .then(d => { setSubInfo(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-baobab-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <AlertTriangle className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Connexion requise</h2>
        <Link href="/connexion" className="btn-primary inline-flex items-center gap-2 mt-4">Se connecter</Link>
      </div>
    );
  }

  if (!subInfo?.subscribed) {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <Truck className="w-14 h-14 text-charbon-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-charbon-500 mb-2">Aucun profil livreur</h2>
        <p className="text-sm text-charbon-300 mb-6">Créez votre profil livreur d'abord.</p>
        <Link href="/livreur/profil" className="btn-primary inline-flex items-center gap-2">Créer mon profil <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  const { profile, plan } = subInfo;
  const isExpired = profile.status === "expired" || profile.status === "inactive";
  const isTrial = profile.status === "trial";
  const isActive = profile.status === "active";

  const handleReactivate = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/delivery-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session!.user.id, action: "subscribe" }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/livreur/profil"), 2000);
      }
    } catch {}
    setProcessing(false);
  };

  const handleStartTrial = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/delivery-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session!.user.id, action: "start_trial" }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/livreur/profil"), 2000);
      }
    } catch {}
    setProcessing(false);
  };

  if (success) {
    return (
      <div className="page-container max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="card p-8">
          <CheckCircle className="w-16 h-16 text-vertprofond-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-charbon-500 mb-2">Abonnement activé !</h2>
          <p className="text-sm text-charbon-300">Redirection vers votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto py-12 px-4">
      <Link href="/livreur/profil" className="flex items-center gap-1 text-sm text-charbon-400 hover:text-baobab-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au profil
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-baobab-100 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-baobab-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-charbon-500">Jurgi Livreur</h1>
            <p className="text-sm text-charbon-300">{plan?.name || "Jurgi Livreur"} — {plan?.price?.toLocaleString("fr-FR") || "1 500"} FCFA/mois</p>
          </div>
        </div>

        {isExpired && (
          <div className="p-4 bg-rougeterre-50 border border-rougeterre-200 rounded-xl mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rougeterre-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-rougeterre-600">Abonnement expiré</p>
                <p className="text-xs text-rougeterre-400 mt-1">Votre profil n'est plus visible dans l'annuaire. Réactivez pour redevenir visible.</p>
              </div>
            </div>
          </div>
        )}

        {isTrial && profile.trialEndsAt && (
          <div className="p-4 bg-ocre-50 border border-ocre-200 rounded-xl mb-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-ocre-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ocre-600">Essai en cours</p>
                <p className="text-xs text-ocre-400 mt-1">Se termine le {new Date(profile.trialEndsAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          </div>
        )}

        {isActive && (
          <div className="p-4 bg-vertbrume-100 border border-vertprofond-200 rounded-xl mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-vertprofond-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-vertprofond-600">Abonnement actif</p>
                {profile.subscriptionEnd && <p className="text-xs text-vertprofond-400 mt-1">Expire le {new Date(profile.subscriptionEnd).toLocaleDateString("fr-FR")}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-charbon-400"><CheckCircle className="w-4 h-4 text-vertprofond-500" /> Profil visible dans l'annuaire</div>
          <div className="flex items-center gap-2 text-sm text-charbon-400"><CheckCircle className="w-4 h-4 text-vertprofond-500" /> Accès aux demandes de livraison</div>
          <div className="flex items-center gap-2 text-sm text-charbon-400"><CheckCircle className="w-4 h-4 text-vertprofond-500" /> Répondre aux demandes</div>
          <div className="flex items-center gap-2 text-sm text-charbon-400"><CheckCircle className="w-4 h-4 text-vertprofond-500" /> Contact par téléphone, WhatsApp, messagerie</div>
        </div>

        {isExpired ? (
          <button onClick={handleReactivate} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            {processing ? "Activation..." : "Réactiver — 1 500 FCFA/mois"}
          </button>
        ) : isTrial ? (
          <button onClick={handleReactivate} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            {processing ? "Activation..." : "Passer à l'abonnement — 1 500 FCFA/mois"}
          </button>
        ) : (
          <div className="p-3 bg-vertbrume-50 rounded-xl text-center">
            <p className="text-sm text-vertprofond-600 font-medium">Votre abonnement est actif</p>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-charbon-300 mt-0.5 shrink-0" />
          <p className="text-xs text-charbon-300">Jurgi met en relation les demandeurs et les livreurs. Le livreur et le client conviennent des conditions pratiques, du délai, du prix de livraison et de la responsabilité de la prestation.</p>
        </div>
      </div>
    </div>
  );
}
