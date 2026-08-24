"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container">
      <div className="card p-8 max-w-lg mx-auto text-center mt-12">
        <h2 className="text-lg font-bold text-rougeterre-500 mb-2">
          Erreur dans le panneau admin
        </h2>
        <p className="text-sm text-charbon-400 mb-4">
          {error.message || "Une erreur inattendue s'est produite"}
        </p>
        {error.digest && (
          <p className="text-xs text-charbon-300 mb-4">
            Digest: {error.digest}
          </p>
        )}
        <pre className="text-xs text-left bg-charbon-50 p-3 rounded-lg overflow-auto max-h-48 mb-4 text-charbon-400">
          {error.stack}
        </pre>
        <button onClick={reset} className="btn-primary">
          Réessayer
        </button>
      </div>
    </div>
  );
}
