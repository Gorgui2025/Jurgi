"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Plus,
  User,
  Bell,
  Store,
  Handshake,
  BookOpen,
  MessageSquare,
  LogOut,
  LogIn,
  ChevronDown,
  Crown,
  Truck,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace", icon: <Store className="w-4 h-4" /> },
  { href: "/livreurs", label: "Livreurs", icon: <Truck className="w-4 h-4" /> },
  { href: "/services", label: "Services", icon: <Handshake className="w-4 h-4" /> },
  { href: "/demandes", label: "Demandes", icon: <MessageSquare className="w-4 h-4" /> },
  { href: "/formation", label: "Formation", icon: <BookOpen className="w-4 h-4" /> },
];

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const user = session?.user;
  const isLoggedIn = !!user;

  const handleSignOut = () => {
    setUserMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const pathname = usePathname();

  const fetchUnread = useCallback(() => {
    if (user?.id) {
      fetch(`/api/notifications?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread, pathname]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchUnread]);

  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id, fetchUnread]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-beigebrume-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" aria-label="Jurgi — Accueil" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/brand/jurgi-logo.png"
              alt="Logo Jurgi"
              width={40}
              height={40}
              className="h-9 w-9 rounded-xl object-contain"
            />
            <span className="text-xl font-bold text-baobab-500">Jurgi</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
                else router.push("/marketplace");
              }}
              className="relative w-full"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Animaux, aliments, services..."
                className="w-full pl-10 pr-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                           placeholder:text-charbon-300 transition-all"
                aria-label="Rechercher sur Jurgi"
              />
            </form>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Link href="/marketplace" className="md:hidden p-2.5 rounded-lg hover:bg-vertbrume-50 transition-colors" aria-label="Rechercher">
              <Search className="w-5 h-5 text-charbon-400" />
            </Link>

            <Link href="/publier" className="hidden sm:flex btn-primary text-sm py-2 px-4 gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Publier</span>
            </Link>

            {isLoggedIn && (
              <>
                <Link href="/messages" className="relative p-2.5 rounded-lg hover:bg-vertbrume-50 transition-colors" aria-label="Messages">
                  <MessageSquare className="w-5 h-5 text-charbon-400" />
                </Link>

                <Link href="/notifications" className="relative p-2.5 rounded-lg hover:bg-vertbrume-50 transition-colors" aria-label="Notifications">
                  <Bell className="w-5 h-5 text-charbon-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rougeterre-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative hidden sm:block">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-vertbrume-50 transition-colors">
                    <div className="w-8 h-8 bg-baobab-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-baobab-600">{user.name?.charAt(0) || "U"}</span>
                    </div>
                    <span className="text-sm font-medium text-charbon-500 max-w-[100px] truncate">{user.name || "Mon compte"}</span>
                    <ChevronDown className="w-4 h-4 text-charbon-300" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-beigebrume-200 shadow-lg z-50 py-1">
                        <div className="px-4 py-3 border-b border-beigebrume-100">
                          <p className="text-sm font-semibold text-charbon-500 truncate">{user.name}</p>
                          <p className="text-xs text-charbon-300 truncate">{user.email || user.phone}</p>
                        </div>
                        <Link href="/profil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 transition-colors">
                          <User className="w-4 h-4" /> Mon profil
                        </Link>
                        <Link href="/mes-annonces" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 transition-colors">
                          <Store className="w-4 h-4" /> Mes annonces
                        </Link>
                        <Link href="/abonnement" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 transition-colors">
                          <Crown className="w-4 h-4" /> Abonnement
                        </Link>
                        <div className="border-t border-beigebrume-100 my-1" />
                        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-rougeterre-500 hover:bg-rougeterre-50 w-full transition-colors">
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {!isLoggedIn && (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/connexion" className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-baobab-500 border border-baobab-500 rounded-lg hover:bg-baobab-50 transition-colors">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline">Se connecter</span>
                </Link>
                <Link href="/inscription" className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-baobab-500 rounded-lg hover:bg-baobab-600 transition-colors">
                  <span className="hidden md:inline">Créer un compte</span>
                  <span className="md:hidden">Inscription</span>
                </Link>
              </div>
            )}

            <Link href="/publier" className="sm:hidden p-2.5 rounded-lg bg-baobab-500 text-white hover:bg-baobab-600 transition-colors" aria-label="Publier">
              <Plus className="w-5 h-5" />
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2.5 rounded-lg hover:bg-vertbrume-50 transition-colors" aria-label="Menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="w-5 h-5 text-charbon-400" /> : <Menu className="w-5 h-5 text-charbon-400" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
              else router.push("/marketplace");
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charbon-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 bg-sable-200 border border-beigebrume-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-baobab-500/20 focus:border-baobab-500
                         placeholder:text-charbon-300"
              aria-label="Rechercher sur Jurgi"
            />
          </form>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t border-beigebrume-200 pt-3">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                  {link.icon} {link.label}
                </Link>
              ))}
              <div className="border-t border-beigebrume-100 my-2" />

              {isLoggedIn ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-charbon-500">{user.name}</p>
                    <p className="text-xs text-charbon-300">{user.email || user.phone}</p>
                  </div>
                  <Link href="/profil" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                    <User className="w-4 h-4" /> Mon profil
                  </Link>
                  <Link href="/mes-annonces" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                    <Store className="w-4 h-4" /> Mes annonces
                  </Link>
                  <Link href="/abonnement" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                    <Crown className="w-4 h-4" /> Abonnement
                  </Link>
                  <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                    <MessageSquare className="w-4 h-4" /> Messages
                  </Link>
                  <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-charbon-400 hover:text-baobab-500 hover:bg-vertbrume-50 rounded-lg transition-colors">
                    <Bell className="w-4 h-4" /> Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-rougeterre-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </Link>
                  <div className="border-t border-beigebrume-100 my-2" />
                  <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-rougeterre-500 hover:bg-rougeterre-50 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 mx-4 mt-1 px-4 py-3 text-sm font-medium text-baobab-500 border border-baobab-500 rounded-xl hover:bg-baobab-50 transition-colors">
                    <LogIn className="w-4 h-4" /> Se connecter
                  </Link>
                  <Link href="/inscription" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 mx-4 mt-2 px-4 py-3 text-sm font-medium text-white bg-baobab-500 rounded-xl hover:bg-baobab-600 transition-colors">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
