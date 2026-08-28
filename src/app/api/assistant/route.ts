import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYMENT_PHONE = "+221 77 981 95 88";

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
  if (hasAny(q, ["publier", "annonce", "mettre en vente", "vendre", "vendre mon", "create", "ajouter une annonce", "afficher mon produit"])) return "how_publish";
  if (hasAny(q, ["paiement", "payer", "payer mon abonnement", "mobile money", "wave", "orange money", "paiement wave", "transition", "activer mon compte", "code d'activation", "abonnement"])) return "payment";
  if (hasAny(q, ["prix", "abonnement", "plan", "forfait", "combien coute", "tarif", "formule", "inscription gratuite", "gratuit"])) return "plans";
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

function faqAnswer(intent: string): { answer: string; replies: string[] } {
  const replies = [
    "Comment publier une annonce ?",
    "Comment payer mon abonnement ?",
    "Trouver un vétérinaire près de chez moi",
    "Combien coûte un abonnement ?",
  ];
  switch (intent) {
    case "how_publish":
      return {
        answer:
          "Pour publier une annonce sur Jurgi, c'est simple :\n\n1. Créez votre **compte** (gratuit) via l'onglet \"Créer un compte\".\n2. Cliquez sur le bouton **+ Publier / Vendre**.\n3. Remplissez le formulaire : titre, description, prix, photos, région et catégorie.\n4. Validez : votre annonce apparaît aussitôt dans la **Marketplace**.\n\n💡 Astuce : des photos claires et un prix précis augmentent beaucoup vos chances. Une fois publiée, les acheteurs peuvent vous contacter directement (appel ou WhatsApp).",
        replies: ["Vendre un animal", "Comment passer une annonce ?", "Comment payer ?", "Trouver un vétérinaire"],
    };
    case "how_register":
      return {
        answer:
          "Créer un compte sur Jurgi est **gratuit et immédiat** :\n\n1. Cliquez sur **\"Créer un compte\"** en haut de la page.\n2. Renseignez votre numéro de téléphone et votre nom.\n3. Ajoutez votre mot de passe.\n4. C'est fait ! Vous pouvez publier, répondre aux demandes et envoyer des messages.\n\nVous pouvez aussi choisir un profil professionnel (vétérinaire, transporteur, institution ou livreur) — celui-ci sera validé par un administrateur avant activation.",
        replies: ["Comment publier une annonce ?", "Devenir vétérinaire", "Combien ça coûte ?", "Payer mon abonnement"],
    };
    case "how_login":
      return {
        answer:
          "Pour vous connecter à Jurgi :\n\n1. Cliquez sur **\"Se connecter\"** en haut de la page.\n2. Saisissez votre **numéro de téléphone** (ou email) et votre **mot de passe**.\n3. Vous arrivez sur votre espace personnel.\n\nSi vous avez oublié votre mot de passe, utilisez le lien **\"Mot de passe oublié ?\"** en bas du formulaire : un nouveau mot de passe vous sera envoyé.",
        replies: ["Mot de passe oublié", "Comment publier ?", "Payer mon abonnement", "Contacter le support"],
    };
    case "about":
      return {
        answer:
          "**Jurgi** est la plateforme numérique qui connecte tous les acteurs de l'élevage au Sénégal : éleveurs, vendeurs, vétérinaires, transporteurs, institutions et acheteurs.\n\nEn un seul endroit vous pouvez :\n• 🐑 Acheter / vendre des animaux et produits (marketplace)\n• 🔬 Trouver des vétérinaires et services\n• 🚚 Connector des transporteurs et livreurs\n• 📢 Poster ou consulter des demandes d'achat\n\nNotre mission : centraliser l'offre, faciliter la mise en relation et soutenir la digitalisation progressive du secteur.",
        replies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Les abonnements", "Contacter le support"],
    };
    case "contact":
      return {
        answer:
          "Vous pouvez nous joindre par le formulaire de la page **Contact** sur le site, en écrivant un message que notre équipe lira.\n\n📞 **Paiements (Mobile Money)** : **+221 77 981 95 88**\n\nNotre équipe support vous répondra rapidement pour toute question, remarque ou problème rencontré.",
        replies: ["Comment payer mon abonnement ?", "Comment publier une annonce ?", "Autre question"],
    };
    default:
      return {
        answer:
          "Je suis votre secrétariat Jurgi. 🤝 Je peux vous aider à :\n• 📝 **Publier une annonce**\n• 🐑 **Trouver un animal / produit**\n• 🔬 **Trouver un vétérinaire, transporteur, livreur ou institution**\n• 💳 **Payer votre abonnement**\n• ❓ Répondre à vos questions sur la plateforme\n\nPosez-moi votre question, ou tapez par exemple « comment publier une annonce ».",
        replies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Comment payer ?"],
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question: string = String(body.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Question vide" }, { status: 400 });
    }

    const intent = findIntent(question);

    if (intent === "greeting") {
      return NextResponse.json({
        reply: {
          intent,
          answer:
            "Bonjour et bienvenue sur Jurgi ! 👋 Je suis votre secrétariat virtuel. Comment puis-je vous aider aujourd'hui ?",
          quickReplies: ["Comment publier une annonce ?", "Trouver un vétérinaire", "Combien coûte un abonnement ?", "Payer mon abonnement"],
        },
      });
    }

    if (intent === "how_publish" || intent === "how_register" || intent === "how_login" || intent === "about" || intent === "contact") {
      return NextResponse.json({ reply: { intent, ...faqAnswer(intent) } });
    }

    if (intent === "payment") {
      const plan = await prisma.plan.findUnique({ where: { slug: "livreur" } }).catch(() => null);
      const livreurMsg = plan ? `**${plan.price.toLocaleString("fr-FR")} FCFA / ${plan.durationDays} jours** (avec 7 jours d'essai gratuit)` : "1500 FCFA / 30 jours (avec essai gratuit)";
      return NextResponse.json({
        reply: {
          intent,
          answer:
            "Pour payer votre abonnement Jurgi :\n\n1. Rendez-vous dans votre espace et choisissez votre **formule** (page Abonnements).\n2. Effectuez le paiement **Mobile Money** (Wave / Orange Money) vers :\n   **📞 +221 77 981 95 88**\n3. Envoyez-nous votre **preuve de paiement** : notre équipe valide et active votre compte (vous recevez un **code d'activation**).\n\nConcernant le **profil livreur** : l'abonnement est à " + livreurMsg + ".\n\n💡 Le paiement est validé par notre équipe, généralement sous quelques heures.",
          quickReplies: ["Combien coûtent les abonnements ?", "Comment publier ?", "Puis-je vendre gratuitement ?", "Autre question"],
        },
      });
    }

    if (intent === "plans") {
      const plans = await prisma.plan.findMany({
        where: { isActive: true, isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, description: true, price: true, durationDays: true, isTrialEligible: true },
      }).catch(() => []);
      let answer =
        "Voici les formules d'abonnement Jurgi :\n\n";
      if (plans.length === 0) {
        answer += "Les détails des formules sont disponibles sur la page **Abonnements** (/abonnement). L'inscription de base et la publication d'annonces peuvent être gratuites selon votre plan.\n\nVous pouvez aussi payer via **Mobile Money** : 📞 **+221 77 981 95 88**.";
      } else {
        answer += plans
          .map((p) => `• **${p.name}** — ${p.price.toLocaleString("fr-FR")} FCFA / ${p.durationDays} j${p.isTrialEligible ? " (essai gratuit possible)" : ""}${p.description ? " — " + p.description : ""}`)
          .join("\n");
        answer += "\n\nVous pouvez payer via **Mobile Money** : 📞 **+221 77 981 95 88**.";
      }
      return NextResponse.json({
        reply: {
          intent,
          answer,
          quickReplies: ["Comment payer ?", "Comment publier une annonce ?", "Je veux vendre gratuitement", "Autre question"],
          data: plans,
        },
      });
    }

    if (intent === "find_listing") {
      const rows = await prisma.listing.findMany({
        where: { status: "active", availability: "available" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }).catch(() => []);
      return NextResponse.json({ reply: buildListingAnswer(rows, question) });
    }

    if (intent === "find_vet") {
      const rows = await prisma.vetProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return NextResponse.json({ reply: buildVetAnswer(rows) });
    }

    if (intent === "find_transporter") {
      const rows = await prisma.transporterProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return NextResponse.json({
        reply: rows.length === 0
          ? { intent, answer: "Je n'ai pas trouvé de transporteur correspondant en ce moment. Consultez l'annuaire **/transporteurs** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Comment publier ?", "Autre question"] }
          : {
              intent,
              answer: `Voici des transporteurs disponibles :\n\n${rows.map((t, i) => `${i + 1}. **${t.displayName || t.user?.name}** — ${t.vehicleType || ""} ${t.zones ? "· " + (() => { try { const z = JSON.parse(t.zones); return Array.isArray(z) ? z[0]?.region || "" : ""; } catch { return ""; } })() : ""} ${t.phone ? "· 📞 " + t.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/transporteurs** pour les joindre.`,
              quickReplies: ["Trouver un vétérinaire", "Publier une annonce", "Autre question"],
              data: rows.slice(0, 4),
            },
      });
    }

    if (intent === "find_livreur") {
      const rows = await prisma.deliveryProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return NextResponse.json({
        reply: rows.length === 0
          ? { intent, answer: "Je n'ai pas trouvé de livreur en ce moment. Consultez l'annuaire **/livreurs** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Autre question"] }
          : {
              intent,
              answer: `Voici des livreurs disponibles :\n\n${rows.map((d, i) => `${i + 1}. **${d.displayName || d.user?.name}** — ${d.vehicleType || ""} ${d.phone ? "· 📞 " + d.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/livreurs** pour les joindre.`,
              quickReplies: ["Trouver un transporteur", "Publier une annonce", "Autre question"],
              data: rows.slice(0, 4),
            },
      });
    }

    if (intent === "find_institution") {
      const rows = await prisma.institutionProfile.findMany({
        where: { isActive: true, OR: [{ status: "active" }, { status: "trial" }] },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }).catch(() => []);
      return NextResponse.json({
        reply: rows.length === 0
          ? { intent, answer: "Je n'ai pas trouvé d'institution en ce moment. Consultez l'annuaire **/institutions** ou posez une autre question.", quickReplies: ["Trouver un vétérinaire", "Autre question"] }
          : {
              intent,
              answer: `Voici des institutions disponibles :\n\n${rows.map((ins, i) => `${i + 1}. **${ins.displayName || ins.user?.name}** — ${ins.institutionType || ""} ${ins.phone ? "· 📞 " + ins.phone : ""}`).join("\n")}\n\nConsultez l'annuaire **/institutions** pour en savoir plus.`,
              quickReplies: ["Trouver un vétérinaire", "Publier une annonce", "Autre question"],
              data: rows.slice(0, 4),
            },
      });
    }

    if (intent === "post_request") {
      return NextResponse.json({
        reply: {
          intent,
          answer:
            "Vous pouvez poster une **demande d'achat** sur Jurgi :\n\n1. Connectez-vous à votre compte.\n2. Allez dans l'onglet **Demandes** (/demandes).\n3. Cliquez sur **\"Poster une demande\"**.\n4. Décrivez ce dont vous avez besoin (quantité, budget, région...) puis publiez.\n\nLes vendeurs de la plateforme verront votre demande et pourront vous proposer leurs produits. C'est **gratuit**.",
          quickReplies: ["Trouver un vétérinaire", "Comment publier une annonce ?", "Autre question"],
        },
      });
    }

    return NextResponse.json({ reply: { intent: "fallback", ...faqAnswer("fallback") } });
  } catch (e) {
    return NextResponse.json(
      { reply: { intent: "error", answer: "Une erreur est survenue. Veuillez réessayer dans un instant. 🙏", quickReplies: ["Comment publier une annonce ?", "Contacter le support"] } },
      { status: 200 }
    );
  }
}
