import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jurgi_admin_token")?.value;
  if (token) redirect("/admin");

  const showError = searchParams.error === "1";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1F2925", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "64px", height: "64px", backgroundColor: "#1F6B4F", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "32px", color: "white" }}>
            🛡️
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: 0 }}>Administration Jurgi</h1>
          <p style={{ fontSize: "14px", color: "#A7AFA9", marginTop: "4px" }}>Centre de contrôle sécurisé</p>
        </div>

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px" }}>
          {showError && (
            <div style={{ backgroundColor: "#F9EDEB", border: "1px solid #E7B7AF", borderRadius: "12px", padding: "12px", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#B84A3B", margin: 0 }}>Identifiants incorrects</p>
            </div>
          )}

          <form method="POST" action="/api/admin/login" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#4F5F53", marginBottom: "6px" }}>
                Email administrateur
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@jurgi.sn"
                required
                autoFocus
                style={{ width: "100%", padding: "12px 16px", border: "1px solid #D8D0C3", borderRadius: "12px", fontSize: "16px", color: "#1F2925", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#4F5F53", marginBottom: "6px" }}>
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                style={{ width: "100%", padding: "12px 16px", border: "1px solid #D8D0C3", borderRadius: "12px", fontSize: "16px", color: "#1F2925", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            <button
              type="submit"
              style={{ width: "100%", backgroundColor: "#1F6B4F", color: "white", padding: "12px 24px", borderRadius: "12px", fontSize: "16px", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Connexion admin
            </button>

            <p style={{ fontSize: "11px", color: "#7B877E", textAlign: "center", margin: 0 }}>
              Accès réservé aux administrateurs autorisés
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
