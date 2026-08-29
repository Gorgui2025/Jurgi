"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  MapPin,
  Truck,
  Clock,
  Phone,
  MessageCircle,
  Shield,
  Star,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react"

export interface DeliveryProfile {
  id: string
  userId: string | null
  name: string
  photo: string | null
  zone: string
  vehicleType: string
  availability: string
  verified: boolean
  bio: string
  capacity: string
  zones: string[]
  acceptedTypes: string[]
  refusedTypes: string[]
  schedule: string
  tariff: string
  urgentDelivery: boolean
  weekendDelivery: boolean
  phone: string | null
  whatsapp: string | null
}

export default function LivreurDetailClient({ initialProfile }: { initialProfile: DeliveryProfile }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<DeliveryProfile | null>(initialProfile)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [contactMessage, setContactMessage] = useState("")

  const handleCall = () => {
    if (profile?.phone) {
      window.location.href = `tel:${profile.phone}`
    }
  }

  const handleWhatsApp = () => {
    if (profile?.whatsapp) {
      window.open(`https://wa.me/${profile.whatsapp}`, "_blank")
    }
  }

  const handleInternalMessage = async () => {
    if (!session?.user?.id || !profile?.userId) return
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: session.user.id,
          receiverId: profile.userId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const conversationId = data.id
        const message = (contactMessage || "").trim()
        if (message) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              senderId: session.user.id,
              content: message,
            }),
          })
        }
        router.push(`/messages/${conversationId}`)
      }
    } catch (err) {
      console.error("Erreur création conversation", err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-beigebrume-200 border-t-terrevent-500" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-16 w-16 text-terrevent-500" />
        <h1 className="text-2xl font-bold text-terrevent-900">
          Profil non trouvé
        </h1>
        <p className="text-beigebrume-500">
          Ce livreur n&apos;existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => router.push("/livreurs")}
          className="btn-outline mt-4"
        >
          <ArrowLeft className="mr-2 inline h-4 w-4" />
          Retour à la liste
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={() => router.push("/livreurs")}
        className="mb-6 flex items-center gap-2 text-beigebrume-500 transition-colors hover:text-terrevent-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour à la liste
      </button>

      {/* Header */}
      <div className="card mb-6 flex items-start gap-6">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-beigebrume-200 bg-beigebrume-100">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-terrevent-400">
              {profile.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-terrevent-900">
              {profile.name}
            </h1>
            {profile.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-terrevent-100 px-2.5 py-0.5 text-xs font-medium text-terrevent-700">
                <Shield className="h-3.5 w-3.5" />
                Vérifié
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-beigebrume-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.zone}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              {profile.vehicleType}
            </span>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile.availability === "Disponible"
                  ? "bg-green-100 text-green-700"
                  : profile.availability === "Occupé"
                    ? "bg-red-100 text-red-700"
                    : "bg-beigebrume-100 text-beigebrume-600"
              }`}
            >
              {profile.availability === "Disponible" ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {profile.availability}
            </span>
          </div>
        </div>
      </div>

      {/* Présentation */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Présentation
        </h2>
        <p className="text-beigebrume-600 leading-relaxed">{profile.bio}</p>
      </section>

      {/* Véhicule & capacité */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Véhicule &amp; capacité
        </h2>
        <p className="text-beigebrume-600">{profile.capacity}</p>
      </section>

      {/* Zones d'intervention */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Zones d&apos;intervention
        </h2>
        <div className="flex flex-wrap gap-2">
          {profile.zones.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1 rounded-full bg-beigebrume-100 px-3 py-1 text-sm text-beigebrume-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              {z}
            </span>
          ))}
        </div>
      </section>

      {/* Types acceptés / refusés */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Types acceptés / refusés
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-green-700">
              Acceptés
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.acceptedTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                >
                  <CheckCircle className="h-3 w-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-red-700">Refusés</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.refusedTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                >
                  <X className="h-3 w-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Disponibilité & horaires */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Disponibilité &amp; horaires
        </h2>
        <p className="flex items-center gap-2 text-beigebrume-600">
          <Clock className="h-4 w-4" />
          {profile.schedule}
        </p>
      </section>

      {/* Tarif indicatif */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Tarif indicatif
        </h2>
        <p className="text-beigebrume-600">{profile.tariff}</p>
      </section>

      {/* Livraison urgente / week-end */}
      <section className="card mb-4">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Livraison urgente / week-end
        </h2>
        <div className="flex gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              profile.urgentDelivery
                ? "bg-green-100 text-green-700"
                : "bg-beigebrume-100 text-beigebrume-500"
            }`}
          >
            {profile.urgentDelivery ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Livraison urgente
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              profile.weekendDelivery
                ? "bg-green-100 text-green-700"
                : "bg-beigebrume-100 text-beigebrume-500"
            }`}
          >
            {profile.weekendDelivery ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Week-end
          </span>
        </div>
      </section>

      {/* Moyens de contact */}
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold text-terrevent-900">
          Moyens de contact
        </h2>

        <div className="mb-4 flex flex-wrap gap-3">
          {profile.phone && (
            <button onClick={handleCall} className="btn-primary">
              <Phone className="mr-2 inline h-4 w-4" />
              Appeler
            </button>
          )}
          {profile.whatsapp && (
            <button onClick={handleWhatsApp} className="btn-primary">
              <MessageCircle className="mr-2 inline h-4 w-4" />
              WhatsApp
            </button>
          )}
        </div>

        {session?.user && (
          <div className="border-t border-beigebrume-200 pt-4">
            <label className="mb-2 block text-sm font-medium text-terrevent-800">
              Message interne
            </label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Bonjour, je souhaiterais discuter d'une livraison..."
              className="mb-3 w-full rounded-lg border border-beigebrume-200 bg-white px-3 py-2 text-sm text-terrevent-900 placeholder-beigebrume-400 focus:border-terrevent-500 focus:outline-none focus:ring-1 focus:ring-terrevent-500"
              rows={3}
            />
            <button onClick={handleInternalMessage} className="btn-primary">
              <MessageCircle className="mr-2 inline h-4 w-4" />
              Message interne
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
