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
  BookOpen, BookMarked, Sparkles, Eye,
  ChevronLeft, ChevronRight, Star, Search, TrendingUp, Flame, Zap,
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { NovelStory } from "@shared/schema";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null; authorName?: string | null; authorSlug?: string | null; authorVerified?: boolean };

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

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// ── Banner Slideshow ──────────────────────────────────────────────────────────
function BannerSlideshow({ banners, featuredStory }: { banners: BannerSlide[]; featuredStory?: StoryWithStats }) {
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
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {cur.link ? (
              <Link href={cur.link.startsWith("/") ? cur.link : `/${cur.link}`} className="block">
                <BannerCard banner={cur} featuredStory={featuredStory} />
              </Link>
            ) : (
              <BannerCard banner={cur} featuredStory={featuredStory} />
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

function BannerCard({ banner, featuredStory }: { banner: BannerSlide; featuredStory?: StoryWithStats }) {
  const isFeaturedBanner = !!(
    featuredStory &&
    banner.link &&
    (
      banner.link === `/${featuredStory.slug}` ||
      banner.link === featuredStory.slug ||
      banner.link.endsWith(`/${featuredStory.slug}`)
    )
  );

  return (
    <div className="relative my-5 rounded-2xl overflow-hidden aspect-[16/5] shadow-xl">
      <img
        src={banner.imageUrl}
        alt={banner.title ?? ""}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {isFeaturedBanner && featuredStory?.coverUrl && (
        <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-20 w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 hover:ring-white/60 hover:scale-105 transition-all duration-200">
          <img src={featuredStory.coverUrl} alt={featuredStory.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          {isFeaturedBanner && featuredStory && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow">
              <Star size={9} fill="currentColor" /> {featuredStory.title}
            </span>
          )}
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

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  subtitle,
  title,
  scrollLeft,
  scrollRight,
}: {
  icon: React.ReactNode;
  subtitle?: string;
  title: string;
  scrollLeft?: () => void;
  scrollRight?: () => void;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div>
          {subtitle && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-0.5">{subtitle}</p>
          )}
          <h2 className="text-lg font-bold text-foreground leading-none">{title}</h2>
        </div>
      </div>
      {(scrollLeft || scrollRight) && (
        <div className="flex gap-1.5">
          <button
            onClick={scrollLeft}
            className="w-8 h-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={scrollRight}
            className="w-8 h-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Novel Unggulan ────────────────────────────────────────────────────────────
function NovelUnggulan({ stories }: { stories: StoryWithStats[] }) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const featured = useMemo(() => stories.filter(s => s.featured), [stories]);

  if (featured.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-10 pb-2">
      <SectionHeader
        icon={<Star size={15} fill="currentColor" />}
        subtitle={t("novel.unggulan.subtitle")}
        title={t("novel.unggulan.title")}
        scrollLeft={() => scroll(-1)}
        scrollRight={() => scroll(1)}
      />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
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
              className="flex-shrink-0 w-[calc((100vw-64px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-96px)/5)] lg:w-[calc((100vw-144px)/6)] max-w-[195px]"
            >
              <Link href={`/${story.slug}`} data-testid={`link-unggulan-${story.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-muted relative shadow-md">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                        {t(`novel.status.${story.status}`)}
                      </span>
                    </div>
                    {updated && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-lg">
                          <Sparkles size={8} />
                          {t("novel.new")}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/15 backdrop-blur-md rounded-lg px-3 py-2">
                        <div className="flex items-center justify-center gap-3 mb-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                            <Eye size={9} />
                            {formatViewCount(story.viewCount)}
                          </span>
                          {story.totalChapters > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                              <BookMarked size={9} />
                              {story.totalChapters} bab
                            </span>
                          )}
                        </div>
                        <span className="text-white text-xs font-semibold block text-center">{t("novel.readNow")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 px-0.5">
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center">
                      {story.title}
                    </h3>
                    {(story.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5 justify-center">
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

// ── Trending ──────────────────────────────────────────────────────────────────
function Trending({ stories }: { stories: StoryWithStats[] }) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trending = useMemo(
    () => [...stories].filter(s => s.viewCount > 0).sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
    [stories]
  );

  if (trending.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-2">
      <SectionHeader
        icon={<Flame size={15} />}
        title={t("novel.trending.title")}
        scrollLeft={() => scroll(-1)}
        scrollRight={() => scroll(1)}
      />
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {trending.map((story, i) => (
          <Link key={story.id} href={`/${story.slug}`} data-testid={`link-trending-${story.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex-shrink-0 w-[calc((100vw-64px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-96px)/5)] lg:w-[calc((100vw-144px)/6)] max-w-[195px] group cursor-pointer"
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                {story.coverUrl ? (
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <BookOpen size={18} className="text-primary/40" />
                  </div>
                )}
                {/* Rank badge */}
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shadow-lg ${
                  i === 0 ? "bg-amber-400 text-amber-900"
                  : i === 1 ? "bg-slate-300 text-slate-700"
                  : i === 2 ? "bg-orange-400 text-orange-900"
                  : "bg-black/60 text-white"
                }`}>
                  {i + 1}
                </div>
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/55 rounded-full px-1.5 py-0.5">
                  <Eye size={7} className="text-white" />
                  <span className="text-[8px] font-semibold text-white">{formatViewCount(story.viewCount)}</span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center">
                {story.title}
              </h3>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Lanjut Baca ───────────────────────────────────────────────────────────────
interface ProgressEntry {
  slug: string;
  seasonNum: number;
  chapterNum: number;
  chapterTitle?: string;
  updatedAt: string;
}

function LanjutBaca({ stories }: { stories: StoryWithStats[] }) {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progressList, setProgressList] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    const entries: ProgressEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("novel-progress-")) continue;
      const slug = key.replace("novel-progress-", "");
      try {
        const data = JSON.parse(localStorage.getItem(key)!);
        entries.push({ slug, ...data });
      } catch {}
    }
    entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setProgressList(entries);
  }, []);

  const items = progressList
    .map(p => ({ progress: p, story: stories.find(s => s.slug === p.slug) }))
    .filter((item): item is { progress: ProgressEntry; story: StoryWithStats } => !!item.story);

  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (language === "id") {
      if (h < 1) return "< 1j";
      if (h < 24) return `${h}j lalu`;
      return `${d}h lalu`;
    }
    if (h < 1) return "< 1h";
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-2">
      <SectionHeader
        icon={<BookOpen size={15} />}
        subtitle={language === "id" ? "Lanjutkan dari mana kamu berhenti" : "Pick up where you left off"}
        title={t("novel.lanjutBaca.title")}
        scrollLeft={() => scroll(-1)}
        scrollRight={() => scroll(1)}
      />
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map(({ progress, story }) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          return (
            <Link
              key={progress.slug}
              href={`/${progress.slug}/season-${progress.seasonNum}/bab-${progress.chapterNum}`}
              data-testid={`link-lanjutbaca-${progress.slug}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 w-[calc((100vw-64px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-96px)/5)] lg:w-[calc((100vw-144px)/6)] max-w-[195px] group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                  {story.coverUrl ? (
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen size={18} className="text-primary/40" />
                    </div>
                  )}
                  <div className={`absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                    <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                    {story.status}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-4 pb-1.5">
                    <p className="text-[9px] font-semibold text-white/90">
                      {t("novel.lanjutBaca.season")} {progress.seasonNum} · {t("novel.lanjutBaca.chapter")} {progress.chapterNum}
                    </p>
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <span className="text-[8px] text-white/80">{timeAgo(progress.updatedAt)}</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center">
                  {story.title}
                </h3>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Baru Diupdate ─────────────────────────────────────────────────────────────
function BaruDiupdate({ stories }: { stories: StoryWithStats[] }) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const recent = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return [...stories]
      .filter(s => s.lastChapterAt && new Date(s.lastChapterAt).getTime() > cutoff)
      .sort((a, b) => new Date(b.lastChapterAt!).getTime() - new Date(a.lastChapterAt!).getTime())
      .slice(0, 10);
  }, [stories]);

  if (recent.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (h < 1) return "< 1j";
    if (h < 24) return `${h}j lalu`;
    return `${d}h lalu`;
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-2">
      <SectionHeader
        icon={<Zap size={15} />}
        subtitle={t("novel.baruDiupdate.subtitle")}
        title={t("novel.baruDiupdate.title")}
        scrollLeft={() => scroll(-1)}
        scrollRight={() => scroll(1)}
      />
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {recent.map((story, i) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          return (
            <Link key={story.id} href={`/${story.slug}`} data-testid={`link-baru-${story.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex-shrink-0 w-[calc((100vw-64px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-96px)/5)] lg:w-[calc((100vw-144px)/6)] max-w-[195px] group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                  {story.coverUrl ? (
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen size={18} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                      {t(`novel.status.${story.status}`)}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-violet-600/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Zap size={7} className="text-white" />
                    <span className="text-[8px] font-semibold text-white">{timeAgo(story.lastChapterAt!)}</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center">
                  {story.title}
                </h3>
                {story.totalChapters > 0 && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5 justify-center">
                    <BookMarked size={9} /> {story.totalChapters} bab
                  </p>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Terbaru Rilis ─────────────────────────────────────────────────────────────
function TerbaruRilis({ stories }: { stories: StoryWithStats[] }) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const terbaru = useMemo(() => {
    return [...stories]
      .filter(s => !!(s as any).createdAt)
      .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime())
      .slice(0, 10);
  }, [stories]);

  if (terbaru.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-2">
      <SectionHeader
        icon={<Sparkles size={15} />}
        subtitle={t("novel.terbaruRilis.subtitle")}
        title={t("novel.terbaruRilis.title")}
        scrollLeft={() => scroll(-1)}
        scrollRight={() => scroll(1)}
      />
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {terbaru.map((story, i) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          return (
            <Link key={story.id} href={`/${story.slug}`} data-testid={`link-terbaru-${story.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex-shrink-0 w-[calc((100vw-64px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-96px)/5)] lg:w-[calc((100vw-144px)/6)] max-w-[195px] group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                  {story.coverUrl ? (
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen size={18} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                      {t(`novel.status.${story.status}`)}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                    {story.totalChapters > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white">
                        <BookMarked size={7} />
                        {story.totalChapters}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm">
                      <Sparkles size={7} />
                      {t("novel.new")}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center">
                  {story.title}
                </h3>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Rekomendasi ───────────────────────────────────────────────────────────────
function Rekomendasi({ stories }: { stories: StoryWithStats[] }) {
  const { t } = useLanguage();
  const recommended = useMemo(() => {
    return [...stories]
      .sort((a, b) => {
        const avgA = (a as any).ratingCount > 0 ? (a as any).ratingSum / (a as any).ratingCount : 0;
        const avgB = (b as any).ratingCount > 0 ? (b as any).ratingSum / (b as any).ratingCount : 0;
        if (avgB !== avgA) return avgB - avgA;
        return b.viewCount - a.viewCount;
      })
      .slice(0, 12);
  }, [stories]);

  if (recommended.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-10">
      <SectionHeader
        icon={<TrendingUp size={15} />}
        subtitle={t("novel.rekomendasi.subtitle")}
        title={t("novel.rekomendasi.title")}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {recommended.map((story, i) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          const updated = isNewlyUpdated(story.lastChapterAt);
          const avgRating = (story as any).ratingCount > 0
            ? ((story as any).ratingSum / (story as any).ratingCount).toFixed(1)
            : null;

          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
            >
              <Link href={`/${story.slug}`} data-testid={`link-rekomendasi-${story.id}`}>
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
                        {t(`novel.status.${story.status}`)}
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
                    {avgRating && (
                      <div className="absolute bottom-8 left-1.5 flex items-center gap-0.5 bg-black/55 rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Star size={7} className="text-amber-400 fill-amber-400" />
                        <span className="text-[8px] font-semibold text-white">{avgRating}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white">
                        <Eye size={8} />
                        {formatViewCount(story.viewCount)}
                      </span>
                      {story.totalChapters > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-semibold text-white">
                          <BookMarked size={8} />
                          {story.totalChapters} bab
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3
                      className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-center"
                      data-testid={`text-rec-title-${story.id}`}
                    >
                      {story.title}
                    </h3>
                    {story.authorName && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                        <span>oleh</span>
                        <span
                          onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/penulis/${story.authorSlug}`; }}
                          className="hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5 truncate"
                        >
                          <span className="truncate">{story.authorName}</span>
                          {story.authorVerified && <VerifiedBadge size="sm" />}
                        </span>
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

// ── Search Results ────────────────────────────────────────────────────────────
function SearchResults({ stories, search, onClose }: {
  stories: StoryWithStats[];
  search: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
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
            {results.length} {t("novel.search.results")} <span className="text-primary">"{search}"</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t("novel.search.close")}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">{t("novel.search.empty")}</p>
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

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function HomeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8">
      {/* Unggulan skeleton */}
      <div className="pt-10 pb-2">
        <Skeleton className="h-6 w-40 mb-5" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[240px] space-y-2">
              <Skeleton className="aspect-[2/3] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      {/* Trending skeleton */}
      <div className="pt-8 pb-2">
        <Skeleton className="h-6 w-28 mb-5" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[115px] space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Rekomendasi skeleton */}
      <div className="pt-8 pb-10">
        <Skeleton className="h-6 w-48 mb-5" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Novel() {
  const { search, setSearch } = useSearchContext();
  const { t } = useLanguage();

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

  const featuredStory = useMemo(
    () => stories?.find(s => s.featured) ?? undefined,
    [stories]
  );

  const isSearching = !!search.trim();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="WOOCE Novel — Perpustakaan Novel"
        description="Kumpulan novel, komik, dan cerita pendek yang kaya dunia dan karakter penuh warna."
        url="/"
      />
      <Navbar />

      <BannerSlideshow banners={activeBanners} featuredStory={featuredStory} />

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
            {isLoading ? (
              <HomeSkeleton />
            ) : stories && stories.length > 0 ? (
              <>
                <LanjutBaca stories={stories} />
                <NovelUnggulan stories={stories} />
                <TerbaruRilis stories={stories} />
                <Trending stories={stories} />
                <BaruDiupdate stories={stories} />
                <Rekomendasi stories={stories} />
              </>
            ) : (
              <div className="text-center py-32 max-w-7xl mx-auto px-5">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">{t("novel.empty")}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <Footer />
      </div>
    </div>
  );
}
