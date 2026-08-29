import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAYMENT_PHONE = "+221 77 981 95 88";

interface AssistantReply {
  intent: string;
  answer: string;
  quickReplies: string[];
  data?: unknown[];
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text: string, words: string[]): boolean {
  const t = normalize(text);
  return words.some((w) => t.includes(normalize(w)));
}

function findIntent(q: string): string {
  if (hasAny(q, ["bonjour", "salut", "hello", "bonsoir", "coucou", "bjr", "slt"])) return "greeting";
  if (hasAny(q, ["video", "vidéo", "filmer", "video sur mon annonce", "publier des videos", "mettre une video", "envoyer une video", "telecharger une video"])) return "how_video";
  if (hasAny(q, ["publier", "annonce", "mettre en vente", "vendre", "vendre mon", "create", "ajouter une annonce", "afficher mon produit"])) return "how_publish";
  if (hasAny(q, ["paiement", "payer", "payer mon abonnement", "mobile money", "wave", "orange money", "paiement wave", "transition", "activer mon compte", "code d'activation", "abonnement"])) return "payment";
  if (hasAny(q, ["prix", "abonnement", "plan", "forfait", "combien coute", "tarif", "formule", "inscription gratuite", "gratuit"])) return "plans";
  if (hasAny(q, ["profil professionnel", "profil pro", "compte professionnel", "compte pro", "devenir vet", "devenir veterinaire", "devenir transporteur", "devenir livreur", "devenir un vet", "devenir un veterinaire", "devenir un transporteur", "devenir un livreur", "espace pro", "creer un profil professionnel", "professionnel"])) return "professional_profile";
  if ((hasAny(q, ["profil"]) && hasAny(q, ["completer", "remplir", "modifier", "mettre a jour", "editer", "mon profil"]))) return "complete_profile";
  if (hasAny(q, ["vet", "veterinaire", "docteur", "soigner", "vaccination", "sante animale", "maladie", "soin"])) return "find_vet";
  if (hasAny(q, ["transport", "transporteur", "livraison", "camelion", "camion"])) return "find_transporter";
  if (hasAny(q, ["livreur", "livreur livreur", "course", "deplace"])) return "find_livreur";
  if (hasAny(q, ["institution", "ong", "cooperative", "organisation"])) return "find_institution";
  if (hasAny(q, ["poster une demande", "faire une demande", "demande d'achat", "poster ma demande", "creer une demande", "lancer une demande"])) return "post_request";
  if (hasAny(q, ["acheter", "achat", "animal", "mouton", "boeuf", "veau", "chevre", "poulet", "volaille", "aliment", "graine", "fourrage", "je cherche", "recherche un", "besoin de"])) return "find_listing";
  if (hasAny(q, ["inscription", "inscrire", "creer un compte", "nouveau compte", "s'inscrire"])) return "how_register";
  if (hasAny(q, ["connexion", "connecter", "login", "se connecter", "mon compte", "mot de passe", "mdp", "identifiants"])) return "how_login";
  if (hasAny(q, ["jurgi", "plateforme", "qu'est-ce", "c'est quoi", "mission", "a propos", "qui etes", "role de jurgi", "ecosysteme"])) return "about";
  if (hasAny(q, ["contact", "telephone", "support", "aide", "contacter", "assistance", "joindre", "numero"])) return "contact";
  if (hasAny(q, ["lister", "vendre", "offre", "annonces disponibles", "produits"])) return "find_listing";
  return "fallback";
}

function faqAnswer(intent: string, phone: string = DEFAULT_PAYMENT_PHONE): { answer: string; quickReplies: string[] } {
  const replies = [
    "Comment publier une annonce ?",
    "Comment payer mon abonnement ?",
    "Trouver un vétérinaire près de chez moi",
    "Combien coûte un abonnement ?",
  ];
  switch (intent) {
    case "how_video":
      return {
        answer:
          "Oui, vous pouvez **publier des vidéos** sur vos annonces Jurgi ! 🎬\n\n1. Pendant la publication (ou en modifiant une annonce), ajoutez vos **vidéos** (au format MP4) dans la section média.\n2. Référez-vous au **nombre de vidéos** autorisé selon votre formule (voir les abonnements).\n3. Vos acheteurs pourront voir la vidéo directement sur votre annonce.\n\n💡 Le nombre de vidéos et la taille max varient selon votre **abonnement** : consultez la page Abonnements pour connaître votre plafond exact.",
        quickReplies: ["Trouver un vétérinaire", "Comment publier une annonce ?", "Combien coûte un abonnement ?", "Comment payer ?"],
      };
    case "how_publish":
      return {
        answer:
          "Pour publier une annonce sur Jurgi, c'est simple :\n\n1. Créez votre **compte** (gratuit) via l'onglet \"Créer un compte\".\n2. Cliquez sur le bouton **+ Publier / Vendre**.\n3. Remplissez le formulaire : titre, description, prix, photos, région et catégorie.\n4. Validez : votre annonce apparaît aussitôt dans la **Marketplace**.\n\n💡 Astuce : des photos claires et un prix précis augmentent beaucoup vos chances. Une fois publiée, les acheteurs peuvent vous contacter directement (appel ou WhatsApp).",
        quickReplies: ["Vendre un animal", "Comment passer une annonce ?", "Comment payer ?", "Trouver un vétérinaire"],
    };
    case "how_register":
      return {
        answer:
          "Créer un compte sur Jurgi est **gratuit et immédiat** :\n\n1. Cliquez sur **\"Créer un compte\"** en haut de la page.\n2. Renseignez votre numéro de téléphone et votre nom.\n3. Ajoutez votre mot de passe.\n4. C'est fait ! Vous pouvez publier, répondre aux demandes et envoyer des messages.\n\nVous pouvez aussi choisir un profil professionnel (vétérinaire, transporteur, institution ou livreur) — celui-ci sera validé par un administrateur avant activation.",
        quickReplies: ["Comment publier une annonce ?", "Devenir vétérinaire", "Combien ça coûte ?", "Payer mon abonnement"],
    };
    case "how_login":
      return {
        answer:
          "Pour vous connecter à Jurgi :\n\n1. Cliquez sur **\"Se connecter\"** en haut de la page.\n2. Saisissez votre **numéro de téléphone** (ou email) et votre **mot de passe**.\n3. Vous arrivez sur votre espace personnel.\n\nSi vous avez oublié votre mot de passe, utilisez le lien **\"Mot de passe oublié ?\"** en bas du formulaire : un nouveau mot de passe vous sera envoyé.",
        quickReplies: ["Mot de passe oublié", "Comment publier ?", "Payer mon abonnement", "Contacter le support"],
    };
    case "professional_profile":
      return {
        answer:
          "Pour créer un **profil professionnel** sur Jurgi, c'est simple : 🛡️\n\n1. Cliquez sur **\"Créer un compte\"** en haut de la page.\n2. Renseignez vos informations (nom, téléphone ou email, mot de passe).\n3. À l'étape **Rôle**, choisissez votre métier parmi les profils marqués **Pro** :\n   • 🩺 **Vétérinaire / Technicien**\n   • 🚛 **Transporteur**\n   • 🛵 **Livreur**\n   • 🏛️ **Institution / Coopérative**\n4. Indiquez votre **région**, puis validez.\n\n🎯 Votre compte professionnel sera alors **examiné et validé par notre équipe** (sous quelques heures) avant d'être activé. Vous pouvez aussi publier votre fiche pro détaillée (services, zones desservies, tarifs...) une fois connecté dans votre espace.\n\n💡 Un compte pro vous permet d'apparaître dans les annuaires, de publier des offres et d'être contacté directement par les éleveurs.",
        quickReplies: ["Comment publier une annonce ?", "Devenir vétérinaire", "Combien ça coûte ?", "Payer mon abonnement"],
    };
    case "complete_profile":
      return {
        answer:
          "Pour **compléter votre profil** (vendeur, vétérinaire, transporteur, livreur, institution...), c'est simple :\n\n1. **Connectez-vous** à votre compte Jurgi.\n2. Rendez-vous dans votre **espace** : cliquez sur votre compte / profil, puis **\"Mon profil\"** (ou la section correspondant à votre métier, ex. la page **/livreur/profil** pour un livreur).\n3. Remplissez les informations demandées selon votre activité :\n   • 🧑 **Nom / raison sociale** et **photo**\n   • 📞 **Téléphone / WhatsApp** de contact\n   • 🚚 **Véhicule / capacité** (pour transporteur ou livreur)\n   • 📍 **Zones desservies** et **disponibilité**\n   • 🛒 **Types de produits acceptés / tarifs**\n4. **Enregistrez** : vos informations sont immédiatement prises en compte sur votre fiche publique.\n\n💡 Un profil complet rassure vos clients et améliore vos chances d'être contacté.",
        quickReplies: ["Comment publier une annonce ?", "Devenir un livreur", "Combien ça coûte ?", "Payer mon abonnement"],
    };
    case "about":
      return {
        answer:
          "**Jurgi** est la plateforme numérique qui connecte tous les acteurs de l'élevage au Sénégal : éleveurs, vendeurs, vétérinaires, transporteurs, institutions et acheteurs.\n\nEn un seul endroit vous pouvez :\n• 🐑 Acheter / vendre des animaux et produits (marketplace)\n• 🔬 Trouver des vétérinaires et services\n • 🚚 Connecter des transporteurs et livreurs\n• 📢 Poster ou consulter des demandes d'achat\n\nNotre mission : centraliser l'offre, faciliter la mise en relation et soutenir la digitalisation progressive du secteur.",
        quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Les abonnements", "Contacter le support"],
    };
    case "contact":
      return {
        answer:
          "Vous pouvez nous joindre par le formulaire de la page **Contact** sur le site, en écrivant un message que notre équipe lira.\n\n📞 **Paiements (Mobile Money)** : **" + phone + "**\n\nNotre équipe support vous répondra rapidement pour toute question, remarque ou problème rencontré.",
        quickReplies: ["Comment payer mon abonnement ?", "Comment publier une annonce ?", "Autre question"],
    };
    default:
      return {
        answer:
          "Je suis votre secrétariat Jurgi. 🤝 Je peux vous aider à :\n• 📝 **Publier une annonce**\n• 🐑 **Trouver un animal / produit**\n• 🔬 **Trouver un vétérinaire, transporteur, livreur ou institution**\n• 💳 **Payer votre abonnement**\n• ❓ Répondre à vos questions sur la plateforme\n\nPosez-moi votre question, ou tapez par exemple « comment publier une annonce ».",
        quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Comment payer ?"],
    };
  }
}

function buildListingAnswer(rows: any[], q: string): AssistantReply {
  if (rows.length === 0) {
    return {
      intent: "find_listing",
      answer:
        "Je n'ai pas trouvé d'annonce correspondant à votre recherche en ce moment. 😕\n\nN'hésitez pas à :\n• Reformuler votre demande\n• Consulter directement la **Marketplace**\n• **Poster une demande d'achat** — c'est gratuit et les vendeurs vous contacteront.",
      quickReplies: ["Voir la marketplace", "Poster une demande d'achat", "Autre question"],
    };
  }
  const lines = rows.slice(0, 5).map((l, i) => `${i + 1}. **${l.title}** — ${l.price != null ? l.price.toLocaleString("fr-FR") + " FCFA" : "Prix à discuter"} · ${l.region || "Sénégal"} · ${l.user?.name || "Vendeur"}`);
  return {
    intent: "find_listing",
    answer: `Voici quelques annonces actives que j'ai trouvées :\n\n${lines.join("\n")}\n\n🗂️ Vous pouvez voir la fiche complète et contacter les vendeurs directement sur la **Marketplace**.`,
    quickReplies: ["Trouver un vétérinaire", "Publier une annonce", "Poster une demande d'achat"],
    data: rows.slice(0, 5),
  };
}

function buildVetAnswer(rows: any[]): AssistantReply {
  if (rows.length === 0) {
    return {
      intent: "find_vet",
      answer: "Je n'ai pas trouvé de vétérinaire correspondant en ce moment. Consultez l'annuaire **/veterinaires** ou posez une autre question.",
      quickReplies: ["Trouver un transporteur", "Contacter le support", "Autre question"],
    };
  }
  const lines = rows.slice(0, 4).map((v, i) => `${i + 1}. **${v.displayName || v.user?.name}** — ${v.region || "Sénégal"} ${v.phone ? "· 📞 " + v.phone : ""}`);
  return {
    intent: "find_vet",
    answer: `Voici des vétérinaires disponibles :\n\n${lines.join("\n")}\n\nConsultez l'annuaire complet sur **/veterinaires** pour les joindre (appel ou WhatsApp).`,
    quickReplies: ["Trouver un transporteur", "Comment publier ?", "Autre question"],
    data: rows.slice(0, 4),
  };
}

async function resolveAssistant(
  question: string,
  ctx: { sessionId: string; userId?: string | null }
): Promise<AssistantReply> {
  const configs = await prisma.siteConfig.findMany().catch(() => []);
  const getConfig = (key: string, fallback: string): string => {
    const found = configs.find((c) => c.key === key);
    return found ? found.value : fallback;
  };
  const paymentPhone = getConfig("payment_phone_number", DEFAULT_PAYMENT_PHONE) || DEFAULT_PAYMENT_PHONE;
  const videosEnabled = getConfig("videos_enabled", "true") !== "false";

  const intent = findIntent(question);

  if (intent === "greeting") {
    return {
      intent,
      answer:
        "Bonjour et bienvenue sur Jurgi ! 👋 Je suis votre secrétariat virtuel. Comment puis-je vous aider aujourd'hui ?",
      quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Payer mon abonnement"],
    };
  }

  if (intent === "how_publish" || intent === "how_register" || intent === "how_login" || intent === "professional_profile" || intent === "complete_profile" || intent === "about" || intent === "contact") {
    return { intent, ...faqAnswer(intent, paymentPhone) };
  }

    if (intent === "payment") {
      const plan = await prisma.plan.findUnique({ where: { slug: "livreur" } }).catch(() => null);
      const livreurMsg = plan ? `**${plan.price.toLocaleString("fr-FR")} FCFA / ${plan.durationDays} jours** (avec 7 jours d'essai gratuit)` : "1500 FCFA / 30 jours (avec essai gratuit)";
      return {
        intent,
        answer:
          "Pour payer votre abonnement Jurgi :\n\n1. Rendez-vous dans votre espace et choisissez votre **formule** (page Abonnements).\n2. Effectuez le paiement **Mobile Money** (Wave / Orange Money) vers :\n   **📞 " + paymentPhone + "**\n3. Envoyez-nous votre **preuve de paiement** : notre équipe valide et active votre compte (vous recevez un **code d'activation**).\n\nConcernant le **profil livreur** : l'abonnement est à " + livreurMsg + ".\n\n💡 Le paiement est validé par notre équipe, généralement sous quelques heures.",
        quickReplies: ["Combien coûtent les abonnements ?", "Comment publier ?", "Puis-je vendre gratuitement ?", "Autre question"],
      };
    }

    if (intent === "plans") {
      const plans = await prisma.plan.findMany({
        where: { isActive: true, isVisible: true, slug: { not: "livreur" } },
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          description: true,
          price: true,
          durationDays: true,
          isTrialEligible: true,
          dailyListingsQuota: true,
          maxActiveListings: true,
        },
      }).catch(() => []);
      let answer =
        "Voici les formules d'abonnement Jurgi :\n\n";
      const fmtDur = (d: number) => (d >= 365 ? "1 an" : `${d} jours`);
      if (plans.length === 0) {
        answer += "Les détails des formules sont disponibles sur la page **Abonnements** (/abonnement). L'inscription de base et la publication d'annonces peuvent être gratuites selon votre plan.\n\nVous pouvez aussi payer via **Mobile Money** : 📞 **" + paymentPhone + "**.";
      } else {
        answer += plans
          .map((p) => {
            const extra: string[] = [];
            if (p.maxActiveListings) extra.push(`${p.maxActiveListings} annonces actives`);
            if (p.dailyListingsQuota) extra.push(`${p.dailyListingsQuota} nouvelle publication/jour`);
            const desc = extra.length ? " (" + extra.join(", ") + ")" : "";
            return `• **${p.name}** — ${p.price.toLocaleString("fr-FR")} FCFA / ${fmtDur(p.durationDays)}${p.isTrialEligible ? " (essai gratuit 7 j)" : ""}${desc}${p.description ? " — " + p.description : ""}`;
          })
          .join("\n");
        answer += "\n\nVous pouvez payer via **Mobile Money** : 📞 **" + paymentPhone + "**.";
      }
      return {
        intent,
        answer,
        quickReplies: ["Comment payer ?", "Comment publier une annonce ?", "Je veux vendre gratuitement", "Autre question"],
        data: plans,
      };
    }

    if (intent === "how_video") {
      if (!videosEnabled) {
        return {
          intent,
          answer:
            "Actuellement, la publication de **vidéos** est **désactivée** sur la plateforme par l'équipe Jurgi. ⚠️\n\nVous pouvez toujours ajouter des **photos** à vos annonces. Si besoin, contactez le support pour plus d'informations.",
          quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Contacter le support", "Autre question"],
        };
      }
      const plans = await prisma.plan.findMany({
        where: { isActive: true, isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, price: true, maxVideosPerListing: true, maxVideoSizeMb: true },
      }).catch(() => []);
      let answer =
        "Oui, vous pouvez **publier des vidéos** sur vos annonces Jurgi ! 🎬\n\n1. Au moment de publier (ou en modifiant une annonce), ajoutez vos **vidéos** (format MP4) dans la section média.\n2. Le **nombre de vidéos** autorisé dépend de votre **abonnement**.\n3. Vos acheteurs pourront voir la vidéo directement sur votre annonce.\n\n";
      if (plans.length > 0) {
        const withVideos = plans.filter((p) => p.maxVideosPerListing > 0);
        const maxSize = plans.find((p) => p.maxVideoSizeMb > 0)?.maxVideoSizeMb || 50;
        if (withVideos.length > 0) {
          answer +=
            "Voici votre plafond de vidéos par annonce selon la formule :\n" +
            withVideos
              .map((p) => `• **${p.name}** — ${p.maxVideosPerListing} vidéo${p.maxVideosPerListing > 1 ? "s" : ""} / annonce`)
              .join("\n") +
            `\n\n📦 Taille maximale par vidéo : **${maxSize} Mo**.\n`;
        }
        const noVideos = plans.filter((p) => p.maxVideosPerListing === 0);
        if (noVideos.length > 0) {
          answer += `\nℹ️ Certains abonnements (${noVideos.map((p) => p.name).join(", ")}) n'incluent pas de vidéos : passez à une formule compatible si vous souhaitez en publier.\n`;
        }
        answer += "\nVous pouvez changer de formule à tout moment sur la page **Abonnements** (/abonnement).";
      } else {
        answer += "Pour connaître le nombre exact de vidéos autorisé, consultez la page **Abonnements** (/abonnement).";
      }
      return {
        intent,
        answer,
        quickReplies: ["Combien coûte un abonnement ?", "Comment publier une annonce ?", "Trouver un vétérinaire", "Autre question"],
        data: plans,
      };
    }

    if (intent === "find_listing") {
      const rows = await prisma.listing.findMany({
        where: { status: "active", availability: "available" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }).catch(() => []);
      return buildListingAnswer(rows, question);
    }

    if (intent === "find_vet") {
      const rows = await prisma.vetProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return buildVetAnswer(rows);
    }

    if (intent === "find_transporter") {
      const rows = await prisma.transporterProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return rows.length === 0
        ? { intent, answer: "Je n'ai pas trouvé de transporteur correspondant en ce moment. Consultez l'annuaire **/transporteurs** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Comment publier ?", "Autre question"] }
        : {
            intent,
            answer: `Voici des transporteurs disponibles :\n\n${rows.map((t, i) => `${i + 1}. **${t.displayName || t.user?.name}** — ${t.vehicleType || ""} ${t.zones ? "· " + (() => { try { const z = JSON.parse(t.zones); return Array.isArray(z) ? z[0]?.region || "" : ""; } catch { return ""; } })() : ""} ${t.phone ? "· 📞 " + t.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/transporteurs** pour les joindre.`,
            quickReplies: ["Trouver un vétérinaire", "Publier une annonce", "Autre question"],
            data: rows.slice(0, 4),
          };
    }

    if (intent === "find_livreur") {
      const rows = await prisma.deliveryProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return rows.length === 0
        ? { intent, answer: "Je n'ai pas trouvé de livreur en ce moment. Consultez l'annuaire **/livreurs** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Autre question"] }
        : {
            intent,
            answer: `Voici des livreurs disponibles :\n\n${rows.map((d, i) => `${i + 1}. **${d.displayName || d.user?.name}** — ${d.vehicleType || ""} ${d.phone ? "· 📞 " + d.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/livreurs** pour les joindre.`,
            quickReplies: ["Trouver un transporteur", "Publier une annonce", "Autre question"],
            data: rows.slice(0, 4),
          };
    }

    if (intent === "find_institution") {
      const rows = await prisma.institutionProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return rows.length === 0
        ? { intent, answer: "Je n'ai pas trouvé d'institution en ce moment. Consultez l'annuaire **/institutions** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Autre question"] }
        : {
            intent,
            answer: `Voici des institutions disponibles :\n\n${rows.map((ins, i) => `${i + 1}. **${ins.displayName || ins.user?.name}** — ${ins.institutionType || ""} ${ins.phone ? "· 📞 " + ins.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/institutions** pour en savoir plus.`,
            quickReplies: ["Trouver un vétérinaire", "Publier une annonce", "Autre question"],
            data: rows.slice(0, 4),
          };
    }

    if (intent === "post_request") {
      return {
        intent,
        answer:
          "Vous pouvez poster une **demande d'achat** sur Jurgi :\n\n1. Connectez-vous à votre compte.\n2. Allez dans l'onglet **Demandes** (/demandes).\n3. Cliquez sur **\"Poster une demande\"**.\n4. Décrivez ce dont vous avez besoin (quantité, budget, région...) puis publiez.\n\nLes vendeurs de la plateforme verront votre demande et pourront vous proposer leurs produits. C'est **gratuit**.",
        quickReplies: ["Trouver un vétérinaire", "Comment publier une annonce ?", "Autre question"],
      };
    }

    return { intent: "fallback", ...faqAnswer("fallback") };
}

export async function POST(request: NextRequest) {
  let sessionId = "";
  try {
    const body = await request.json();
    const question: string = String(body.question || "").trim();
    sessionId = String(body.sessionId || "unknown");
    if (!question) {
      return NextResponse.json({ error: "Question vide" }, { status: 400 });
    }

    let userId: string | null = null;
    let region: string | null = null;
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      const sid = (session?.user as any)?.id;
      if (sid) {
        userId = sid;
        const u = await prisma.user.findUnique({ where: { id: sid }, select: { region: true } }).catch(() => null);
        region = u?.region || null;
      }
    } catch {
      // session indéterminée — on log sans utilisateur
    }

    const reply = await resolveAssistant(question, { sessionId, userId });

    const answered =
      reply.intent !== "fallback" &&
      reply.intent !== "error";

    try {
      await prisma.secretaryLog.create({
        data: {
          sessionId,
          userId,
          question,
          intent: reply.intent,
          answer: reply.answer,
          answered,
          region,
        },
      });
    } catch {
      // ne jamais faire échouer la réponse à cause du logging
    }

    return NextResponse.json({ reply });
  } catch (e) {
    const fallbackReply = {
      intent: "error",
      answer: "Une erreur est survenue. Veuillez réessayer dans un instant. 🙏",
      quickReplies: ["Comment publier une annonce ?", "Contacter le support"],
    };
    try {
      await prisma.secretaryLog.create({
        data: {
          sessionId,
          userId: null,
          question: "erreur",
          intent: "error",
          answer: fallbackReply.answer,
          answered: false,
        },
      });
    } catch {
      // ignore
    }
    return NextResponse.json({ reply: fallbackReply }, { status: 200 });
  }
}
