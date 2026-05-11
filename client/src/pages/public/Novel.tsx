import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, X, BookMarked, Sparkles, TrendingUp, Star } from "lucide-react";
import type { NovelStory } from "@shared/schema";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

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
          {/* Cover */}
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

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                {STATUS_LABEL[story.status] ?? story.status}
              </span>
            </div>

            {/* New badge */}
            {updated && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-lg">
                  <Sparkles size={8} />
                  Baru
                </span>
              </div>
            )}

            {/* Hover CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 text-center">
                <span className="text-white text-xs font-semibold">Baca Sekarang</span>
              </div>
            </div>
          </div>

          {/* Info */}
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

function FeaturedCard({ story }: { story: StoryWithStats }) {
  const { t } = useLanguage();
  const STATUS_LABEL: Record<string, string> = {
    ongoing: t("novel.status.ongoing"),
    completed: t("novel.status.completed"),
    hiatus: t("novel.status.hiatus"),
  };
  const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;

  return (
    <Link href={`/${story.slug}`} data-testid={`link-featured-${story.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer h-56 sm:h-64 mb-10 shadow-xl"
      >
        {/* Background */}
        {story.coverUrl ? (
          <img src={story.coverUrl} alt={story.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/10" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
              <Star size={10} fill="currentColor" /> Featured
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
              <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
              {STATUS_LABEL[story.status]}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2 leading-tight">{story.title}</h2>
          {story.description && (
            <p className="text-white/60 text-sm line-clamp-2 max-w-lg mb-3">{story.description}</p>
          )}
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <span className="capitalize">{CATEGORY_ICONS[story.category] ?? "📝"} {story.category}</span>
            {story.totalChapters > 0 && (
              <span className="flex items-center gap-1"><BookMarked size={11} /> {story.totalChapters} bab</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Novel() {
  const { t, language } = useLanguage();
  const STATUS_LABEL: Record<string, string> = {
    ongoing: t("novel.status.ongoing"),
    completed: t("novel.status.completed"),
    hiatus: t("novel.status.hiatus"),
  };
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: stories, isLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    stories?.forEach(s => cats.add(s.category));
    return Array.from(cats).sort();
  }, [stories]);

  const featured = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    const manual = stories.find(s => s.featured);
    if (manual) return manual;
    // Fallback: novel dengan viewCount tertinggi (booming)
    return [...stories].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))[0] ?? null;
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

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen size={14} className="text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Perpustakaan</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 leading-tight">
              {t("novel.heading")}
            </h1>
            <p className="text-muted-foreground text-base max-w-xl">{t("novel.description")}</p>

            {!isLoading && stories && (
              <div className="flex items-center gap-4 mt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-primary" />{stories.length} {language === "id" ? "cerita" : "stories"}</span>
                <span>·</span>
                <span>{categories.length} {language === "id" ? "kategori" : "categories"}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

        {/* Featured */}
        {!isFiltering && featured && <FeaturedCard story={featured} />}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("novel.search.placeholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl border border-border bg-background/60 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              data-testid="input-search-novel"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
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
              <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="mt-3 text-sm text-primary hover:underline">
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
