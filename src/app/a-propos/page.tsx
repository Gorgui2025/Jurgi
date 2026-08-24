import { Shield, MapPin, Users, TrendingUp, Heart } from "lucide-react";

export default function AProposPage() {
  return (
    <div className="page-container max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-baobab-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-3xl">J</span>
        </div>
        <h1 className="text-3xl font-bold text-charbon-500 mb-3">
          Jurgi — Tout l&apos;écosystème de l&apos;élevage, au même endroit
        </h1>
        <p className="text-lg text-charbon-300 max-w-2xl mx-auto">
          Jurgi est la plateforme numérique qui connecte tous les acteurs de
          l&apos;élevage au Sénégal : éleveurs, vendeurs, vétérinaires,
          transporteurs, fournisseurs et acheteurs.
        </p>
      </div>

      {/* Mission */}
      <div className="card p-8 mb-8">
        <h2 className="text-xl font-bold text-charbon-500 mb-4">Notre mission</h2>
        <p className="text-charbon-400 leading-relaxed mb-4">
          L&apos;élevage est un pilier essentiel de l&apos;économie sénégalaise.
          Pourtant, trouver des animaux de qualité, des aliments, du matériel,
          des services vétérinaires ou des partenaires commerciaux reste un
          défi quotidien pour des millions d&apos;éleveurs et de professionnels.
        </p>
        <p className="text-charbon-400 leading-relaxed">
          Jurgi a été créé pour résoudre ce problème : centraliser l&apos;offre,
          faciliter la mise en relation, améliorer la confiance et soutenir la
          digitalisation progressive du secteur. Notre objectif est simple —
          permettre à chaque acteur de l&apos;élevage de trouver ce dont il a
          besoin, rapidement et près de chez lui.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: <MapPin className="w-6 h-6" />,
            title: "Proximité",
            desc: "Nous connectons les acteurs de chaque région, chaque commune, chaque village du Sénégal.",
          },
          {
            icon: <Shield className="w-6 h-6" />,
            title: "Confiance",
            desc: "Profils vérifiés, signalements et modération pour un marché sécurisé et fiable.",
          },
          {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Progression",
            desc: "Un outil qui évolue avec les besoins du secteur, de la mise en relation à la gestion complète.",
          },
        ].map((v) => (
          <div key={v.title} className="card p-6 text-center">
            <div className="w-12 h-12 bg-baobab-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-baobab-500">
              {v.icon}
            </div>
            <h3 className="font-semibold text-charbon-500 mb-2">{v.title}</h3>
            <p className="text-sm text-charbon-300">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-baobab-500 to-vertprofond-500 rounded-2xl p-8 text-white text-center">
        <h2 className="text-xl font-bold mb-6">Jurgi en chiffres (objectifs)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "10 000+", label: "Utilisateurs visés" },
            { value: "5 000+", label: "Annonces visées" },
            { value: "14", label: "Régions couvertes" },
            { value: "9", label: "Domaines couverts" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-baobab-100">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
