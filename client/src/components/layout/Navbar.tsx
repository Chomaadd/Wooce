import { useRef, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Shield, Search, X, BookOpen, Bookmark, Library, PenLine } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSearchContext } from "@/lib/search-context";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { NovelStory } from "@shared/schema";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

function WriterModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
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

          <a href="mailto:wooce.novel@gmail.com" className="block">
            <button
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              data-testid="button-writer-contact"
            >
              {t("writer.contact")}
            </button>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { search, setSearch } = useSearchContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parts = location.split("/").filter(Boolean);
  const isReading = parts.length === 3;
  const isHome = location === "/";
  const [writerModalOpen, setWriterModalOpen] = useState(false);

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
                                  <img
                                    src={story.coverUrl}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                  />
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
            <Link href="/bookmarks">
              <button
                className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                data-testid="button-bookmarks"
                aria-label="Bookmark"
              >
                <Bookmark size={15} />
              </button>
            </Link>
            {user && (
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
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-xs font-semibold"
              data-testid="button-language-toggle"
            >
              <Globe size={14} />
              {language === "id" ? "EN" : "ID"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
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
