"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, MessageCircle, CheckCircle, Send } from "lucide-react";

interface Settings {
  platform_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Question générale");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const contactEmail = settings.contact_email || "contact@jurgi.sn";
  const phone = settings.contact_phone || "+221 77 000 00 00";
  const phoneRaw = phone.replace(/\s/g, "").replace("+", "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });

      if (res.ok) {
        setSent(true);
        setName("");
        setEmail("");
        setSubject("Question générale");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Impossible d'envoyer le message. Réessayez plus tard.");
    }
    setSending(false);
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-charbon-500 mb-2">Nous contacter</h1>
      <p className="text-sm text-charbon-300 mb-8">
        Une question, un problème ou une suggestion ? Contactez-nous.
      </p>

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={`mailto:${contactEmail}`} className="card-hover p-4 flex items-center gap-3">
            <div className="p-2 bg-baobab-50 rounded-lg text-baobab-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-charbon-500">Email</p>
              <p className="text-xs text-charbon-300">{contactEmail}</p>
            </div>
          </a>
          <a href={`tel:${phoneRaw}`} className="card-hover p-4 flex items-center gap-3">
            <div className="p-2 bg-ocre-50 rounded-lg text-ocre-500">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-charbon-500">Téléphone</p>
              <p className="text-xs text-charbon-300">{phone}</p>
            </div>
          </a>
          <a href={`https://wa.me/${phoneRaw}`} className="card-hover p-4 flex items-center gap-3">
            <div className="p-2 bg-vertprofond-50 rounded-lg text-vertprofond-500">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-charbon-500">WhatsApp</p>
              <p className="text-xs text-charbon-300">{phone}</p>
            </div>
          </a>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 bg-vertbrume-100 rounded-lg text-baobab-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-charbon-500">Adresse</p>
              <p className="text-xs text-charbon-300">Dakar, Sénégal</p>
            </div>
          </div>
        </div>

        <div className="border-t border-beigebrume-100 pt-6">
          <h2 className="font-semibold text-charbon-500 mb-4">Envoyez-nous un message</h2>

          {sent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-vertprofond-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-charbon-500 mb-1">Message envoyé !</p>
              <p className="text-sm text-charbon-300 mb-4">Nous vous répondrons dans les plus brefs délais.</p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-baobab-500 hover:text-baobab-600 font-medium"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Votre nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Sujet</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                >
                  <option>Question générale</option>
                  <option>Problème technique</option>
                  <option>Signalement</option>
                  <option>Partenariat</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="input-label">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande..."
                  className="input-field min-h-[120px] resize-y"
                />
              </div>

              {error && (
                <p className="text-sm text-rougeterre-500 bg-rougeterre-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
