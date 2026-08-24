import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_USER) return null;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const t = getTransporter();
  if (!t) {
    console.warn("[MAIL] SMTP non configuré — email non envoyé à", to);
    return { sent: false };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "Jurgi <noreply@jurgi.sn>",
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (e) {
    console.error("[MAIL] Erreur envoi:", e);
    return { sent: false, error: e };
  }
}

export function buildResetEmail(token: string, baseUrl: string) {
  const link = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;
  return {
    subject: "Jurgi — Réinitialisation de votre mot de passe",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
        <div style="background:#1F6B4F;color:white;text-align:center;padding:16px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">Jurgi</h1>
        </div>
        <div style="background:#F6F0E5;padding:24px;border-radius:0 0 12px 12px;">
          <h2 style="color:#1F2925;margin-top:0;">Réinitialisation du mot de passe</h2>
          <p style="color:#555;line-height:1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Jurgi</strong>.
          </p>
          <p style="color:#555;line-height:1.6;">
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expire dans <strong>1 heure</strong>.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="background:#1F6B4F;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;">
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
        </div>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:16px;">
          © 2026 Jurgi — Marketplace agricole du Sénégal
        </p>
      </div>
    `,
  };
}
