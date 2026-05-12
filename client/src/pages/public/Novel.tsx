import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { useSearchContext } from "@/lib/search-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, BookMarked, Sparkles, TrendingUp,
  ChevronLeft, ChevronRight, Star, Eye, Search,
} from "lucide-react";
import type { NovelStory } from "@shared/schema";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
}

function isNewlyUpdated(lastChapterAt: string | null): boolean {
  if (!lastChapterAt) return false;
  const diff = Date.now() - new Date(lastChapterAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  ongoing:   { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  hiatus:    { color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400" },
};

const CATEGORY_ICONS: Record<string, string> = {
  novel: "📖", komik: "🎨", cerpen: "✍️", puisi: "🌸", lainnya: "📝",
};

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// ── Banner Slideshow ──────────────────────────────────────────────────────────
function BannerSlideshow({ banners }: { banners: BannerSlide[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dragStartRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdx(i => (i + 1) % banners.length), 5000);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, resetTimer, banners.length]);

  if (banners.length === 0) return null;

  const go = (dir: 1 | -1) => {
    setIdx(i => (i + dir + banners.length) % banners.length);
    resetTimer();
  };

  const cur = banners[idx];

  return (
    <div
      className="relative w-full select-none"
      onPointerDown={e => { dragStartRef.current = e.clientX; }}
      onPointerUp={e => {
        if (dragStartRef.current === null) return;
        const diff = e.clientX - dragStartRef.current;
        dragStartRef.current = null;
        if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
      }}
      onPointerLeave={() => { dragStartRef.current = null; }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Featured dark card style */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {cur.link ? (
              <a href={cur.link} className="block">
                <BannerCard banner={cur} />
              </a>
            ) : (
              <BannerCard banner={cur} />
            )}
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2 mb-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); resetTimer(); }}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-8 lg:left-10 top-[calc(50%-12px)] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-8 lg:right-10 top-[calc(50%-12px)] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function BannerCard({ banner }: { banner: BannerSlide }) {
  return (
    <div className="relative my-5 rounded-2xl overflow-hidden aspect-[16/4] shadow-xl">
      {/* Background image */}
      <img
        src={banner.imageUrl}
        alt={banner.title ?? ""}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow">
            <Star size={9} fill="currentColor" /> Featured
          </span>
          {banner.subtitle && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">
              {banner.subtitle}
            </span>
          )}
        </div>
        {banner.title && (
          <h2 className="text-white font-bold text-lg sm:text-2xl leading-tight drop-shadow-md line-clamp-1">
            {banner.title}
          </h2>
        )}
      </div>
    </div>
  );
}

// ── Novel Unggulan (horizontal scroll, same card style as StoryCard) ──────────
function NovelUnggulan({ stories }: { stories: StoryWithStats[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const featured = useMemo(
    () => stories.filter(s => s.featured).length > 0
      ? stories.filter(s => s.featured)
      : stories.slice().sort((a, b) => b.viewCount - a.viewCount).slice(0, 12),
    [stories]
  );

  if (featured.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-10 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-0.5">
            Baca nonstop dari awal sampai akhir
          </p>
          <h2 className="text-xl font-bold text-foreground">Novel Unggulan</h2>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {featured.map((story, i) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          const updated = isNewlyUpdated(story.lastChapterAt);
          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex-shrink-0 w-[160px] sm:w-[190px] lg:w-[220px]"
            >
              <Link href={`/${story.slug}`} data-testid={`link-unggulan-${story.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-muted relative shadow-sm">
                    {story.coverUrl ? (
                      <img
                        src={story.coverUrl}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-background gap-2">
                        <BookOpen size={28} className="text-primary/50" />
                        <span className="text-[10px] text-muted-foreground font-medium px-2 text-center line-clamp-2">{story.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                        {story.status}
                      </span>
                    </div>
                    {updated && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-lg">
                          <Sparkles size={8} />
                          Baru
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 text-center">
                        <span className="text-white text-xs font-semibold">Baca Sekarang</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {CATEGORY_ICONS[story.category] ?? "📝"} {story.category}
                      </span>
                      {story.totalChapters > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                          <BookMarked size={9} />
                          {story.totalChapters}
                        </span>
                      )}
                    </div>
                    {(story.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {(story.tags ?? []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Search Results Overlay ────────────────────────────────────────────────────
function SearchResults({ stories, search, onClose }: {
  stories: StoryWithStats[];
  search: string;
  onClose: () => void;
}) {
  const q = search.toLowerCase().trim();
  const results = useMemo(
    () => stories.filter(s => s.title.toLowerCase().includes(q)).slice(0, 12),
    [stories, q]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto px-5 lg:px-8 py-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-primary" />
          <span className="font-semibold text-foreground">
            {results.length} hasil untuk <span className="text-primary">"{search}"</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Tutup
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">Tidak ada novel ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4">
          {results.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/${story.slug}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted shadow-sm">
                    {story.coverUrl ? (
                      <img
                        src={story.coverUrl}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-background">
                        <BookOpen size={18} className="text-primary/40" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors text-center">
                    {story.title}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Story Card ────────────────────────────────────────────────────────────────
function StoryCard({ story, index }: { story: StoryWithStats; index: number }) {
  const { t } = useLanguage();
  const STATUS_LABEL: Record<string, string> = {
    ongoing: t("novel.status.ongoing"),
    completed: t("novel.status.completed"),
    hiatus: t("novel.status.hiatus"),
  };
  const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
  const updated = isNewlyUpdated(story.lastChapterAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link href={`/${story.slug}`} data-testid={`link-story-${story.id}`}>
        <div className="group cursor-pointer">
          <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-muted relative shadow-sm">
            {story.coverUrl ? (
              <img
                src={story.coverUrl}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-background gap-2">
                <BookOpen size={28} className="text-primary/50" />
                <span className="text-[10px] text-muted-foreground font-medium px-2 text-center line-clamp-2">{story.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 left-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                {STATUS_LABEL[story.status] ?? story.status}
              </span>
            </div>
            {updated && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-lg">
                  <Sparkles size={8} />
                  Baru
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 text-center">
                <span className="text-white text-xs font-semibold">Baca Sekarang</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h3
              className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug"
              data-testid={`text-story-title-${story.id}`}
            >
              {story.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground capitalize">
                {CATEGORY_ICONS[story.category] ?? "📝"} {story.category}
              </span>
              {story.totalChapters > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                  <BookMarked size={9} />
                  {story.totalChapters}
                </span>
              )}
            </div>
            {(story.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {(story.tags ?? []).slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Novel() {
  const { t, language } = useLanguage();
  const { search, setSearch } = useSearchContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: stories, isLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
  });

  const { data: banners } = useQuery<BannerSlide[]>({
    queryKey: ["/api/banners"],
    queryFn: () => fetch("/api/banners").then(r => r.json()),
  });

  const activeBanners = useMemo(
    () => (banners ?? []).filter(b => b.active).sort((a, b) => a.order - b.order),
    [banners]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    stories?.forEach(s => cats.add(s.category));
    return Array.from(cats).sort();
  }, [stories]);

  const filtered = useMemo(() => {
    let result = stories ?? [];
    if (activeCategory) result = result.filter(s => s.category === activeCategory);
    return result;
  }, [stories, activeCategory]);

  const isSearching = !!search.trim();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Wooce - Perpustakaan Novel"
        description="Kumpulan novel, komik, dan cerita pendek yang kaya dunia dan karakter penuh warna."
        url="/"
      />
      <Navbar />

      {/* Banner Slideshow */}
      <BannerSlideshow banners={activeBanners} />

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {isSearching && stories ? (
          <SearchResults
            stories={stories}
            search={search}
            onClose={() => setSearch("")}
          />
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <main className="max-w-7xl mx-auto px-5 lg:px-8 py-6">
              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap mb-8">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${!activeCategory ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  data-testid="button-category-all"
                >
                  Semua
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold capitalize transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    data-testid={`button-category-${cat}`}
                  >
                    {CATEGORY_ICONS[cat] ?? "📝"} {cat}
                  </button>
                ))}
              </div>

              {/* Section label */}
              {!isLoading && filtered.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {activeCategory ? `${filtered.length} hasil` : (language === "id" ? "Semua Cerita" : "All Stories")}
                  </h2>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
              )}

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[2/3] rounded-xl" />
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground font-medium">{t("novel.empty")}</p>
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Reset filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-7">
                  {filtered.map((story, i) => (
                    <StoryCard key={story.id} story={story} index={i} />
                  ))}
                </div>
              )}
            </main>

            {/* Novel Unggulan — below Semua Cerita */}
            {!isLoading && stories && stories.length > 0 && (
              <NovelUnggulan stories={stories} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
