import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, BookMarked, Eye, Sparkles, Library, BadgeCheck, Star } from "lucide-react";
import type { NovelStory } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

type StoryWithStats = NovelStory & {
  totalChapters: number;
  lastChapterAt: string | null;
  authorName: string | null;
  authorSlug: string | null;
  authorVerified: boolean;
};

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  ongoing:   { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  hiatus:    { color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400" },
};

const CATEGORY_ICONS: Record<string, string> = {
  fantasy: "⚔️", romance: "💕", mystery: "🔍", horror: "👻",
  thriller: "😰", sci_fi: "🚀", adventure: "🌍", slice_of_life: "☕",
  comedy: "😄", drama: "🎭", action: "💥",
};

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

function isNewlyUpdated(lastChapterAt: string | null): boolean {
  if (!lastChapterAt) return false;
  return Date.now() - new Date(lastChapterAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function AllNovels() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const { data: stories, isLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    stories?.forEach(s => s.category && cats.add(s.category));
    return Array.from(cats).sort();
  }, [stories]);

  const filtered = useMemo(() => {
    let result = stories ?? [];
    if (activeCategory) result = result.filter(s => s.category === activeCategory);
    if (activeStatus) result = result.filter(s => s.status === activeStatus);
    return result;
  }, [stories, activeCategory, activeStatus]);

  const statusLabels: Record<string, string> = {
    ongoing:   t("novel.status.ongoing"),
    completed: t("novel.status.completed"),
    hiatus:    t("novel.status.hiatus"),
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${t("novel.allNovels.title")} — WOOCE Novel`}
        description="Jelajahi semua novel, komik, dan cerita pendek di WOOCE Novel."
        url="/novels"
      />
      <Navbar />

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Library size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("novel.allNovels.title")}
            </h1>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} {t("novel.allNovels.count")}
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-7">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !activeCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="button-cat-all"
            >
              {t("novel.filter.all")}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`button-cat-${cat}`}
              >
                {CATEGORY_ICONS[cat] ?? "📝"} {cat}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {(["ongoing", "completed", "hiatus"] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveStatus(activeStatus === s ? null : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeStatus === s
                    ? `${STATUS_CONFIG[s].color} font-semibold`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`button-status-${s}`}
              >
                <span className="inline-flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  {statusLabels[s]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-xl" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground mb-1">
              {t("novel.allNovels.noResults")}
            </p>
            <button
              onClick={() => { setActiveCategory(null); setActiveStatus(null); }}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {t("novel.allNovels.resetFilter")}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((story, i) => {
              const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
              const updated = isNewlyUpdated(story.lastChapterAt);
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  data-testid={`card-novel-${story.id}`}
                >
                  <Link href={`/${story.slug}`}>
                    <div className="group cursor-pointer">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                        {story.coverUrl ? (
                          <img
                            src={story.coverUrl}
                            alt={story.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-background gap-1">
                            <BookOpen size={18} className="text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-1.5 left-1.5">
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                            {statusLabels[story.status] || story.status}
                          </span>
                        </div>
                        {updated && (
                          <div className="absolute top-1.5 right-1.5">
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full bg-orange-500 text-white">
                              <Sparkles size={7} />
                              {t("novel.new")}
                            </span>
                          </div>
                        )}
                        {(story.ratingCount ?? 0) > 0 && (
                          <div className="absolute bottom-7 left-1.5 flex items-center gap-0.5 bg-black/55 rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Star size={7} className="text-amber-400 fill-amber-400" />
                            <span className="text-[8px] font-semibold text-white">
                              {((story.ratingSum ?? 0) / (story.ratingCount ?? 1)).toFixed(1)}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 px-2 py-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white">
                            <Eye size={8} /> {formatViewCount(story.viewCount)}
                          </span>
                          {story.totalChapters > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white">
                              <BookMarked size={8} /> {story.totalChapters} {t("novel.read.chapterUnit")}
                            </span>
                          )}
                        </div>
                        {story.featured && (
                          <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/90 text-amber-900">
                              ★ {t("novel.allNovels.featured")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-center">
                        <h3 className="font-bold text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {story.title}
                        </h3>
                        {story.authorName && (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="text-[10px] text-muted-foreground/80 truncate leading-none">
                              {story.authorName}
                            </span>
                            {story.authorVerified && (
                              <BadgeCheck size={10} className="text-blue-400 shrink-0" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
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
