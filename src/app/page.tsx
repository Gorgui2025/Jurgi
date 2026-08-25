import Link from "next/link";
export const dynamic = "force-dynamic";
import {
  Search, MapPin, TrendingUp, Shield, MessageCircle,
  ChevronRight, Phone, ArrowRight, BadgeCheck, Clock,
  AlertTriangle, Beef, Wheat, Fence, Stethoscope,
  Wrench, Truck, BookOpen, ShoppingBag,
} from "lucide-react";
import prisma from "@/lib/prisma";
import HomeHero from "@/components/HomeHero";
import HomeListings from "@/components/HomeListings";
import HomeRequests from "@/components/HomeRequests";

const DOMAINS = [
  { slug: "animaux", label: "Animaux", icon: "Beef", color: "bg-baobab-50", border: "border-baobab-200", description: "Bovins, ovins, volailles et autres espèces" },
  { slug: "alimentation", label: "Alimentation", icon: "Wheat", color: "bg-ocre-50", border: "border-ocre-200", description: "Provende, aliments, fourrages et compléments" },
  { slug: "equipement", label: "Équipements", icon: "Fence", color: "bg-vertbrume-50", border: "border-vertbrume-200", description: "Mangeoires, cages, bâtiments, matériel" },
  { slug: "sante", label: "Santé animale", icon: "Stethoscope", color: "bg-rougeterre-50", border: "border-rougeterre-200", description: "Vétérinaires, pharmacies, urgences" },
  { slug: "service", label: "Services", icon: "Wrench", color: "bg-ambre-50", border: "border-ambre-200", description: "Conseil, installation, maintenance" },
  { slug: "transport", label: "Transport", icon: "Truck", color: "bg-sable-100", border: "border-sable-300", description: "Livraison d'animaux et produits" },
  { slug: "formation", label: "Formation", icon: "BookOpen", color: "bg-vertprofond-50", border: "border-vertprofond-200", description: "Formations, fiches techniques, webinaires" },
  { slug: "debouche", label: "Débouchés", icon: "ShoppingBag", color: "bg-baobab-50", border: "border-baobab-200", description: "Boucheries, laiteries, grossistes" },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Beef: <Beef className="w-6 h-6" />,
  Wheat: <Wheat className="w-6 h-6" />,
  Fence: <Fence className="w-6 h-6" />,
  Stethoscope: <Stethoscope className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Truck: <Truck className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  ShoppingBag: <ShoppingBag className="w-6 h-6" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function parsePhotos(photos?: string | null): string[] {
  if (!photos) return [];
  try { return JSON.parse(photos); } catch { return []; }
}

function videoThumbnail(videoUrl: string): string {
  if (!videoUrl.includes("cloudinary.com")) return "";
  return videoUrl.replace("/video/upload/", "/video/upload/w_480,h_360,c_fill,so_0/").replace(/\.mp4$/, ".jpg");
}

async function getStats() {
  const [users, listings, requests] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.request.count(),
  ]);
  return { users: Math.max(users, 120), listings: Math.max(listings, 85), requests: Math.max(requests, 45) };
}

async function getRecentListings() {
  const listings = await prisma.listing.findMany({
    where: {
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      user: { select: { name: true, isVerified: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return listings.map((l) => {
    const photos = parsePhotos(l.photos);
    const videos = parsePhotos(l.videos);
    return {
      id: l.id,
      title: l.title,
      category: l.category?.name || "",
      price: l.priceOnDemand || !l.price ? "Prix à la demande" : l.price.toLocaleString("fr-FR") + " FCFA",
      location: l.commune ? `${l.commune}, ${l.region || ""}` : l.region || "",
      image: photos[0] || videoThumbnail(videos[0] || ""),
      seller: l.user?.name || "Anonyme",
      verified: l.user?.isVerified || false,
      time: timeAgo(l.createdAt.toISOString()),
      hasVideo: videos.length > 0 && photos.length === 0,
    };
  });
}

async function getRecentRequests() {
  const requests = await prisma.request.findMany({
    include: {
      user: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return requests.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category?.name || "",
    location: r.commune ? `${r.commune}, ${r.region || ""}` : r.region || "",
    quantity: r.quantity || "",
    deadline: r.deadline || "",
    responses: r._count.responses,
    postedAt: timeAgo(r.createdAt.toISOString()),
    user: r.user?.name || "Anonyme",
  }));
}

export default async function HomePage() {
  const [stats, listings, requests] = await Promise.all([
    getStats(),
    getRecentListings(),
    getRecentRequests(),
  ]);

  return (
    <div>
      <HomeHero stats={stats} />

      <section className="bg-white border-b border-beigebrume-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Search className="w-5 h-5" />, title: "Trouvez tout au même endroit", desc: "Animaux, aliments, équipements, services et plus." },
              { icon: <Shield className="w-5 h-5" />, title: "Profils vérifiés", desc: "Vendeurs et prestataires identifiés." },
              { icon: <MessageCircle className="w-5 h-5" />, title: "Contact direct", desc: "Appelez, WhatsApp ou messagerie interne." },
              { icon: <MapPin className="w-5 h-5" />, title: "Recherche par zone", desc: "Trouvez des offres près de chez vous." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="p-2 bg-vertbrume-100 rounded-lg text-baobab-500 shrink-0">{f.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-charbon-500">{f.title}</h3>
                  <p className="text-xs text-charbon-300 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Explorer par domaine</h2>
          <Link href="/marketplace" className="text-sm font-medium text-baobab-500 hover:text-baobab-600 flex items-center gap-1 transition-colors">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {DOMAINS.map((d) => (
            <Link key={d.slug} href={`/marketplace?domain=${d.slug}`} className={`card-hover p-4 text-center border ${d.border} ${d.color} group`}>
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center mx-auto mb-2.5 text-baobab-500 group-hover:scale-110 transition-transform">{ICON_MAP[d.icon]}</div>
              <h3 className="text-sm font-semibold text-charbon-500 group-hover:text-baobab-500 transition-colors">{d.label}</h3>
              <p className="text-[11px] text-charbon-300 mt-1 leading-tight">{d.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <HomeListings listings={listings} />
      <HomeRequests requests={requests} />

      <section className="bg-vertbrume-50 border-y border-vertbrume-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="section-title mb-2">La confiance sur Jurgi</h2>
            <p className="text-sm text-charbon-300 max-w-lg mx-auto">Jurgi facilite la mise en relation. Vérifiez toujours les informations avant toute transaction.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Phone className="w-5 h-5" />, title: "Numéro de téléphone vérifié", desc: "Chaque compte est lié à un numéro vérifié par SMS." },
              { icon: <BadgeCheck className="w-5 h-5" />, title: "Identité ou entreprise identifiée", desc: "Les profils vérifiés indiquent le niveau de vérification." },
              { icon: <MapPin className="w-5 h-5" />, title: "Localisation indiquée", desc: "Chaque annonce précise la région et la commune." },
              { icon: <Clock className="w-5 h-5" />, title: "Date de mise à jour visible", desc: "Vous voyez quand l'annonce a été publiée ou actualisée." },
              { icon: <AlertTriangle className="w-5 h-5" />, title: "Signalement possible", desc: "Toute annonce suspecte peut être signalée et examinée." },
              { icon: <MessageCircle className="w-5 h-5" />, title: "Contact direct", desc: "Appelez, envoyez un WhatsApp ou utilisez la messagerie interne." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-beigebrume-200">
                <div className="p-2 bg-baobab-50 rounded-lg text-baobab-500 shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-charbon-500">{item.title}</h3>
                  <p className="text-xs text-charbon-300 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-ocre-500 to-ocre-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Vous êtes professionnel de l&apos;élevage ?</h2>
          <p className="text-ocre-100 mb-2 max-w-xl mx-auto">Présentez votre activité aux éleveurs et professionnels de votre région.</p>
          <p className="text-ocre-200 text-sm mb-6 max-w-lg mx-auto">Créez votre profil professionnel, publiez vos offres et recevez des demandes adaptées à votre activité.</p>
          <Link href="/inscription" className="inline-flex items-center gap-2 bg-white text-ocre-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-sable-100 transition-colors">
            Créer un compte professionnel gratuit <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="page-container">
        <div className="text-center mb-8">
          <h2 className="section-title mb-2">Pourquoi Jurgi ?</h2>
          <p className="text-charbon-300 text-sm">La plateforme qui connecte tous les acteurs de l&apos;élevage</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-baobab-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-baobab-500"><TrendingUp className="w-6 h-6" /></div>
            <h3 className="font-semibold text-charbon-500 mb-2">Visibilité locale</h3>
            <p className="text-sm text-charbon-300 leading-relaxed">Trouvez des clients près de votre exploitation. Les annonces sont présentées aux acheteurs et partenaires de la zone sélectionnée.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-ocre-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-ocre-500"><MessageCircle className="w-6 h-6" /></div>
            <h3 className="font-semibold text-charbon-500 mb-2">Contact direct</h3>
            <p className="text-sm text-charbon-300 leading-relaxed">Recevez des demandes par appel, WhatsApp ou messagerie. Les utilisateurs choisissent le moyen de contact qui leur convient.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-vertprofond-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-vertprofond-500"><Shield className="w-6 h-6" /></div>
            <h3 className="font-semibold text-charbon-500 mb-2">Confiance renforcée</h3>
            <p className="text-sm text-charbon-300 leading-relaxed">Consultez des profils identifiés et signalez les offres douteuses. Les profils et annonces sont traités selon les règles de la plateforme.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
