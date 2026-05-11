import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, BookOpen, Shield } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();

  const parts = location.split("/").filter(Boolean);
  const isReading = parts.length === 3;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-5 lg:px-8">

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <BookOpen size={16} className="text-primary-foreground" />
            </div>
            {!isReading && (
              <span className="font-bold text-base text-foreground tracking-tight hidden sm:block">
                WOOCE<span className="text-primary">.</span>
              </span>
            )}
          </Link>

          <div className="flex items-center gap-1">
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
