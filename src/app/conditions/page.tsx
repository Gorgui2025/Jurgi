export default function ConditionsPage() {
  return (
    <div className="page-container max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-charbon-500 mb-6">Conditions d&apos;utilisation</h1>
      <div className="card p-6 space-y-6 text-sm text-charbon-400 leading-relaxed">
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">1. Acceptation des conditions</h2>
          <p>
            En utilisant la plateforme Jurgi, vous acceptez les présentes conditions
            d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas
            utiliser la plateforme.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">2. Description du service</h2>
          <p>
            Jurgi est une plateforme de mise en relation entre les acteurs de
            l&apos;élevage au Sénégal. La plateforme ne vend pas d&apos;animaux, de produits
            ou de services. Elle facilite la prise de contact entre les parties.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">3. Responsabilité</h2>
          <p>
            Jurgi ne garantit pas la qualité, l&apos;état sanitaire, la solvabilité ou
            la fiabilité des annonces publiées par les utilisateurs. Chaque
            transaction est conclue entre les parties. La vérification de
            l&apos;identité du vendeur et de l&apos;animal est fortement recommandée.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">4. Compte utilisateur</h2>
          <p>
            Chaque utilisateur est responsable de son compte et de ses actions sur
            la plateforme. Le compte est lié au numéro de téléphone. Un seul
            compte par numéro est autorisé.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">5. Contenus interdits</h2>
          <p>
            Sont interdits sur Jurgi : les annonces frauduleuses, les animaux
            malades non signalés, les produits non autorisés, les offres de
            médicaments vétérinaires sans licence, le spam et tout contenu
            illicite. La plateforme se réserve le droit de supprimer tout
            contenu non conforme.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-charbon-500 mb-2">6. Modifications</h2>
          <p>
            Jurgi se réserve le droit de modifier ces conditions à tout moment.
            Les utilisateurs seront notifiés des changements importants.
          </p>
        </div>
      </div>
    </div>
  );
}
