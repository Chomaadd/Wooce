import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Shield, Search, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSearchContext } from "@/lib/search-context";

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { search, setSearch } = useSearchContext();

  const parts = location.split("/").filter(Boolean);
  const isReading = parts.length === 3;
  const isHome = location === "/";

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-14 items-center gap-3 px-5 lg:px-8">

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/image/icon-navbar.png"
              alt="WOOCE Novel"
              className="w-8 h-8 rounded-lg object-cover shrink-0 transition-transform group-hover:scale-105"
            />
          </Link>

          {isHome ? (
            <div className="flex-1 max-w-sm mx-auto relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t("novel.search.placeholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-full border border-border bg-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-search-novel"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={12} />
                </button>
              )}
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
