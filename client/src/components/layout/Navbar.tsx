import { useRef, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Shield, Search, X, BookOpen, Bookmark, Library, PenLine, LogIn, LogOut, User, Clock, Bell, CheckCircle2, AlertCircle, AlertTriangle, BellOff, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSearchContext } from "@/lib/search-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { NovelStory, AppNotification } from "@shared/schema";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { apiRequest } from "@/lib/queryClient";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

function WriterModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isLoggedIn = !!user && !user.isAdmin;
  const isPending = user?.role === "writer" && user?.status === "pending";
  const isActive = user?.role === "writer" && user?.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[88vh] overflow-y-auto"
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-close-writer-modal"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PenLine size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-tight">{t("writer.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("writer.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{t("writer.req.title")}</h3>
            <ol className="space-y-3">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <li key={n} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`writer.req.${n}`)}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">{t("writer.note")}</p>
          </div>

          {isPending ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock size={18} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Permohonan sedang ditinjau</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin akan menghubungimu segera.</p>
              </div>
            </div>
          ) : isActive ? (
            <Link href="/writer/cerita">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-go-writer-dashboard"
              >
                Kelola Cerita →
              </button>
            </Link>
          ) : isLoggedIn ? (
            <Link href="/daftar-penulis">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-register-writer"
              >
                Daftar sebagai Penulis →
              </button>
            </Link>
          ) : (
            <a href="/auth/google" className="block">
              <button
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-writer-contact"
              >
                <LogIn size={15} className="inline mr-2" />
                Login Google untuk Mendaftar
              </button>
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function notifIcon(type: AppNotification["type"]) {
  if (type === "approved") return <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />;
  if (type === "rejected") return <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />;
  if (type === "suspended") return <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />;
  return <Clock size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />;
}

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { search, setSearch } = useSearchContext();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const parts = location.split("/").filter(Boolean);
  const isReading = parts.length === 3;
  const isHome = location === "/";
  const [writerModalOpen, setWriterModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showNotifBell = !!user && !user.isAdmin;

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
    enabled: showNotifBell,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const { data: stories } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
    enabled: isHome,
  });

  const results = useMemo(() => {
    if (!search.trim() || !stories) return [];
    const q = search.toLowerCase().trim();
    return stories.filter(s => s.title.toLowerCase().includes(q)).slice(0, 8);
  }, [search, stories]);

  const showDropdown = isHome && search.trim().length > 0;

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setSearch]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
    <AnnouncementBanner />
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-14 items-center gap-3 px-5 lg:px-8">

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              <img
                src="/image/icon-navbar.png"
                alt="WOOCE Novel"
                className="w-full h-full object-cover scale-[1.4] object-center"
              />
            </div>
          </Link>

          <button
            onClick={() => setWriterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            data-testid="button-become-writer"
          >
            <PenLine size={11} />
            <span className="hidden sm:inline">{t("writer.button")}</span>
            <span className="sm:hidden">Penulis</span>
          </button>

          {isHome ? (
            <div className="flex-1 max-w-sm mx-auto relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t("novel.search.placeholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-full border border-border bg-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-search-novel"
                autoComplete="off"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X size={12} />
                </button>
              )}

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {results.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <p className="text-sm text-muted-foreground">Tidak ada novel ditemukan</p>
                      </div>
                    ) : (
                      <div className="py-2 max-h-[420px] overflow-y-auto">
                        {results.map(story => (
                          <Link key={story.id} href={`/${story.slug}`}>
                            <div
                              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors cursor-pointer"
                              onClick={() => setSearch("")}
                              data-testid={`search-result-${story.id}`}
                            >
                              <div className="w-9 aspect-[2/3] rounded-md overflow-hidden bg-muted flex-shrink-0">
                                {story.coverUrl ? (
                                  <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen size={12} className="text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{story.title}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{story.category}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Link href="/novels">
              <button
                className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                data-testid="button-all-novels"
                aria-label="Semua Novel"
              >
                <Library size={15} />
              </button>
            </Link>
            <div className="hidden sm:block">
              <Link href="/bookmarks">
                <button
                  className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="button-bookmarks"
                  aria-label="Bookmark"
                >
                  <Bookmark size={15} />
                </button>
              </Link>
            </div>
            {user?.isAdmin && (
              <Link href="/admin/novel">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-1"
                  data-testid="button-admin-link"
                >
                  <Shield size={13} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </Link>
            )}
            {user && !user.isAdmin && user.role === "writer" && user.status === "active" && (
              <Link href="/writer/cerita">
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  data-testid="button-writer-dashboard-nav"
                  aria-label="Dapur Cerita"
                >
                  <PenLine size={13} />
                  <span className="hidden sm:inline">Cerita</span>
                </button>
              </Link>
            )}

            {/* ── Notification Bell ── */}
            {showNotifBell && (
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(prev => !prev);
                    if (!notifOpen && unreadCount > 0) {
                      markAllReadMutation.mutate();
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="button-notification-bell"
                  aria-label="Notifikasi"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Notifikasi</p>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-[11px] text-primary hover:underline"
                            data-testid="button-mark-all-read"
                          >
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                            <BellOff size={24} strokeWidth={1.5} />
                            <p className="text-xs">Belum ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              className={`flex gap-3 px-4 py-3 border-b border-border/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                              data-testid={`notif-item-${n.id}`}
                            >
                              {notifIcon(n.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                {n.createdAt && (
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                )}
                              </div>
                              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── User menu (click-based, no hover gap issue) ── */}
            {user && !user.isAdmin && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(prev => !prev)}
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="button-user-avatar"
                  aria-expanded={userMenuOpen}
                >
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name ?? ""}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20"
                      data-testid="img-user-avatar"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs"
                      data-testid="img-user-avatar-fallback"
                    >
                      {(user.name ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-border">
                        <div className="flex items-center gap-2 mb-1">
                          {user.photoUrl && (
                            <img src={user.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          )}
                          <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        {user.role === "writer" && user.status === "pending" && (
                          <span className="text-[10px] text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1">
                            <Clock size={9} /> Menunggu approval
                          </span>
                        )}
                        {user.role === "writer" && user.status === "active" && (
                          <span className="text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full mt-1.5 inline-block">
                            ✓ Penulis Aktif
                          </span>
                        )}
                      </div>

                      <Link href="/profile">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-profile-menu"
                        >
                          <User size={12} /> Profil
                        </button>
                      </Link>

                      <div className="hidden sm:block">
                        <Link href="/bookmarks">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-bookmarks-menu"
                          >
                            <Bookmark size={12} /> Bookmark
                          </button>
                        </Link>
                      </div>

                      {/* Mobile-only: Bookmark & Notifikasi */}
                      <Link href="/bookmarks">
                        <button
                          className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="button-bookmarks-mobile-menu"
                        >
                          <Bookmark size={12} /> Bookmark
                        </button>
                      </Link>
                      <button
                        className="sm:hidden w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-between"
                        onClick={() => { setUserMenuOpen(false); setNotifOpen(true); }}
                        data-testid="button-notif-mobile-menu"
                      >
                        <span className="flex items-center gap-2"><Bell size={12} /> Notifikasi</span>
                        {unreadCount > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                      </button>

                      {user.role === "writer" && user.status === "active" && (
                        <Link href="/writer/cerita">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-writer-menu"
                          >
                            <PenLine size={12} /> Kelola Cerita
                          </button>
                        </Link>
                      )}

                      {user.role === "reader" && (
                        <Link href="/daftar-penulis">
                          <button
                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            onClick={() => setUserMenuOpen(false)}
                            data-testid="button-become-writer-menu"
                          >
                            <PenLine size={12} /> Daftar sebagai Penulis
                          </button>
                        </Link>
                      )}

                      {/* Mobile-only: Bahasa & Tampilan expandable */}
                      <div className="sm:hidden border-t border-border">
                        <button
                          onClick={() => setSettingsOpen(p => !p)}
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><Globe size={12} /> Bahasa & Tampilan</span>
                          <ChevronDown size={11} className={`transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
                        </button>
                        {settingsOpen && (
                          <div className="bg-muted/40 border-t border-border/50 px-3 py-2 space-y-1">
                            <button
                              onClick={() => setLanguage(language === "id" ? "en" : "id")}
                              className="w-full text-left py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <Globe size={11} />
                              <span>Bahasa: <strong>{language.toUpperCase()}</strong></span>
                              <span className="ml-auto text-[10px] opacity-60">→ {language === "id" ? "EN" : "ID"}</span>
                            </button>
                            <button
                              onClick={toggleTheme}
                              className="w-full text-left py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              {theme === "light" ? <Moon size={11} /> : <Sun size={11} />}
                              <span>Tema: <strong>{theme === "light" ? "Terang" : "Gelap"}</strong></span>
                              <span className="ml-auto text-[10px] opacity-60">→ {theme === "light" ? "Gelap" : "Terang"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await fetch("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 border-t border-border"
                        data-testid="button-user-logout"
                      >
                        <LogOut size={12} /> Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!user && !isLoading && (
              <a href="/auth/google">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  data-testid="button-google-login"
                >
                  <LogIn size={13} />
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden">Masuk</span>
                </button>
              </a>
            )}
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-xs font-semibold"
              data-testid="button-language-toggle"
            >
              <Globe size={14} />
              {language === "id" ? "EN" : "ID"}
            </button>
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
      <AnimatePresence>
        {writerModalOpen && <WriterModal onClose={() => setWriterModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
