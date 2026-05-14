import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Bookmark, BookmarkX, Eye, BookMarked, ArrowLeft } from "lucide-react";
import type { NovelStory } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

const STATUS_CONFIG: Record<string, { color: string; dot: string; labelKey: string }> = {
  ongoing:   { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400", labelKey: "novel.status.ongoing" },
  completed: { color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400",   labelKey: "novel.status.completed" },
  hiatus:    { color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400",  labelKey: "novel.status.hiatus" },
};

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

export default function Bookmarks() {
  const { t } = useLanguage();
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("novel-bookmarks") || "[]");
      setSlugs(Array.isArray(saved) ? saved : []);
    } catch { setSlugs([]); }
  }, []);

  const { data: allStories, isLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
  });

  const bookmarked = useMemo(
    () => (allStories ?? []).filter(s => slugs.includes(s.slug)),
    [allStories, slugs]
  );

  const removeBookmark = (slug: string) => {
    const next = slugs.filter(s => s !== slug);
    setSlugs(next);
    try { localStorage.setItem("novel-bookmarks", JSON.stringify(next)); } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${t("bookmark.title")} — WOOCE Novel`}
        description="Daftar novel yang kamu simpan di WOOCE Novel."
      />
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-7">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="button-back-bookmarks">
              <ArrowLeft size={13} /> {t("bookmark.back")}
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bookmark size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("bookmark.title")}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {slugs.length > 0
                  ? `${bookmarked.length} ${t("bookmark.count")}`
                  : t("bookmark.none")}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : slugs.length === 0 || bookmarked.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookmarkX size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground mb-1">{t("bookmark.empty.title")}</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {t("bookmark.empty.desc")}
            </p>
            <Link href="/">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity" data-testid="button-explore-novels">
                <BookOpen size={14} /> {t("bookmark.explore")}
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {bookmarked.map((story, i) => {
              const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
              const progress = (() => {
                try {
                  const saved = localStorage.getItem(`novel-progress-${story.slug}`);
                  return saved ? JSON.parse(saved) : null;
                } catch { return null; }
              })();

              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative"
                  data-testid={`card-bookmark-${story.id}`}
                >
                  <Link href={progress ? `/${story.slug}/season-${progress.seasonNum}/bab-${progress.chapterNum}` : `/${story.slug}`}>
                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm cursor-pointer">
                      {story.coverUrl ? (
                        <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <BookOpen size={20} className="text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5">
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                          <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                          {t(cfg.labelKey)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1">
                      {story.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Eye size={8} />{formatViewCount(story.viewCount)}</span>
                      {story.totalChapters > 0 && (
                        <span className="flex items-center gap-0.5"><BookMarked size={8} />{story.totalChapters}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); removeBookmark(story.slug); }}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors"
                      title={t("bookmark.remove")}
                      data-testid={`button-remove-bookmark-${story.id}`}
                    >
                      <BookmarkX size={12} />
                    </button>
                  </div>
                  {progress && (
                    <div className="mt-1 text-[9px] text-primary font-medium truncate">
                      {t("bookmark.chapterRead")} {progress.chapterNum}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
