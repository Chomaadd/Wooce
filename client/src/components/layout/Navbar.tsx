import { useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Shield, Search, X, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSearchContext } from "@/lib/search-context";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { NovelStory } from "@shared/schema";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

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
  );
}
