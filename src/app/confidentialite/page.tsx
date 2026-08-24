export default function ConfidentialitePage() {
  return (
    <div className="page-container max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-charbon-500 mb-6">Politique de confidentialité</h1>
      <div className="card p-6 space-y-6 text-sm text-charbon-400 leading-relaxed">
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">1. Collecte des données</h2>
          <p>
            Jurgi collecte les données suivantes : numéro de téléphone, nom,
            rôle(s), région, commune, et toutes les informations publiées
            dans vos annonces et profils. Les données sont collectées pour
            assurer le fonctionnement de la plateforme et faciliter la mise en
            relation.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">2. Utilisation des données</h2>
          <p>
            Vos données sont utilisées pour : gérer votre compte, afficher vos
            annonces, faciliter la mise en relation, envoyer des notifications,
            améliorer la plateforme et assurer la sécurité. Votre numéro de
            téléphone ne sera jamais affiché publiquement sans votre accord.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">3. Protection des données</h2>
          <p>
            Vos données sont stockées de manière sécurisée. Nous utilisons le
            chiffrement des communications et des contrôles d&apos;accès stricts.
            Nous ne vendons pas vos données à des tiers.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">4. Vos droits</h2>
          <p>
            Vous pouvez à tout moment consulter, modifier ou supprimer vos
            données personnelles. Contactez-nous à privacy@jurgi.sn pour
            exercer vos droits.
          </p>
        </div>
      </div>
    </div>
  );
}
