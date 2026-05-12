import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { useSearchContext } from "@/lib/search-context";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, BookMarked, Sparkles, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
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
  novel: "📖",
  komik: "🎨",
  cerpen: "✍️",
  puisi: "🌸",
  lainnya: "📝",
};

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

  return (
    <div
      className="relative w-full h-[220px] sm:h-[380px] overflow-hidden select-none"
      onPointerDown={e => { dragStartRef.current = e.clientX; }}
      onPointerUp={e => {
        if (dragStartRef.current === null) return;
        const diff = e.clientX - dragStartRef.current;
        dragStartRef.current = null;
        if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
      }}
      onPointerLeave={() => { dragStartRef.current = null; }}
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          style={{ pointerEvents: i === idx ? "auto" : "none" }}
        >
          <img
            src={banner.imageUrl}
            alt={banner.title ?? ""}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          {banner.link && (
            <a href={banner.link} className="absolute inset-0 z-10" aria-label={banner.title} />
          )}
          {(banner.title || banner.subtitle) && (
            <div className="absolute bottom-10 sm:bottom-16 left-5 sm:left-12 text-white pointer-events-none z-20">
              {banner.title && (
                <h2 className="text-lg sm:text-3xl font-bold drop-shadow-md mb-0.5 sm:mb-1 leading-tight">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="text-xs sm:text-base text-white/80 drop-shadow leading-snug max-w-md">
                  {banner.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); resetTimer(); }}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
            aria-label="Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
            aria-label="Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

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

  const activeBanners = useMemo(() =>
    (banners ?? []).filter(b => b.active).sort((a, b) => a.order - b.order),
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
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [stories, activeCategory, search]);

  const isFiltering = !!activeCategory || !!search.trim();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Novel — Perpustakaan"
        description="Kumpulan novel, komik, dan cerita pendek yang kaya dunia dan karakter penuh warna."
        url="/"
      />
      <Navbar />

      {/* Banner Slideshow — Full Width at Top */}
      <BannerSlideshow banners={activeBanners} />

      {/* Hero — below banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen size={14} className="text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Perpustakaan</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-3 leading-tight">
              {t("novel.heading")}
            </h1>
            <p className="text-muted-foreground text-base max-w-xl">{t("novel.description")}</p>

            {!isLoading && stories && (
              <div className="flex items-center gap-4 mt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  {stories.length} {language === "id" ? "cerita" : "stories"}
                </span>
                <span>·</span>
                <span>{categories.length} {language === "id" ? "kategori" : "categories"}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

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
              {isFiltering ? `${filtered.length} hasil` : (language === "id" ? "Semua Cerita" : "All Stories")}
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
            {isFiltering && (
              <button
                onClick={() => { setSearch(""); setActiveCategory(null); }}
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

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
