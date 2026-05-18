import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, ChevronDown, ChevronRight, ArrowLeft,
  Clock, Eye, Play, Lock, BookMarked, List, Share2, Check,
  Bookmark, BookmarkCheck, Star, X, ImageDown, Heart, User,
} from "lucide-react";
import type { NovelStory, NovelSeason, NovelChapter } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

const STATUS_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  ongoing:   { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400", label: "Ongoing" },
  completed: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400",   label: "Completed" },
  hiatus:    { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400",  label: "Hiatus" },
};

const STATUS_LABEL_KEY: Record<string, string> = {
  ongoing: "novel.status.ongoing",
  completed: "novel.status.completed",
  hiatus: "novel.status.hiatus",
};

function timeAgo(date: string | Date, lang: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);
  if (lang === "id") {
    if (minutes < 1)  return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24)   return `${hours} jam lalu`;
    if (days < 30)    return `${days} hari lalu`;
    if (months < 12)  return `${months} bulan lalu`;
    return `${years} tahun lalu`;
  }
  if (minutes < 1)  return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 30)    return `${days}d ago`;
  if (months < 12)  return `${months}mo ago`;
  return `${years}y ago`;
}

function countdown(scheduledAt: string, lang: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return lang === "id" ? "Sebentar lagi" : "Very soon";
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (lang === "id") {
    if (days > 0) {
      let s = `${days} hari`;
      if (hours > 0) s += ` ${hours} jam`;
      if (mins > 0)  s += ` ${mins} menit`;
      return s;
    }
    if (hours > 0) return `${hours} jam ${mins} menit`;
    return `${mins} menit`;
  }
  if (days > 0) {
    let s = `${days}d`;
    if (hours > 0) s += ` ${hours}h`;
    if (mins > 0)  s += ` ${mins}m`;
    return s;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface UpcomingChapter {
  id: string;
  chapterNumber: number;
  title: string;
  scheduledAt: string | null;
}

function SeasonAccordion({ story, season }: { story: NovelStory; season: NovelSeason }) {
  const [open, setOpen] = useState(true);
  const { t, language } = useLanguage();

  const { data: chapters, isLoading, refetch: refetchChapters } = useQuery<NovelChapter[]>({
    queryKey: ["/api/novel/seasons", season.id, "chapters"],
    queryFn: () => fetch(`/api/novel/seasons/${season.id}/chapters`).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: upcoming, refetch: refetchUpcoming } = useQuery<UpcomingChapter[]>({
    queryKey: ["/api/novel/seasons", season.id, "upcoming"],
    queryFn: () => fetch(`/api/novel/seasons/${season.id}/upcoming`).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!upcoming?.length) return;
    const now = Date.now();
    const next = upcoming
      .filter(ch => ch.scheduledAt)
      .map(ch => new Date(ch.scheduledAt!).getTime())
      .filter(t => t > now)
      .sort((a, b) => a - b)[0];
    if (!next) return;
    const delay = next - now + 3000;
    const timer = setTimeout(() => {
      refetchChapters();
      refetchUpcoming();
    }, delay);
    return () => clearTimeout(timer);
  }, [upcoming, refetchChapters, refetchUpcoming]);

  const totalVisible = (chapters?.length ?? 0) + (upcoming?.length ?? 0);

  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
        data-testid={`button-season-${season.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="text-xs font-bold">{season.seasonNumber}</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Season {season.seasonNumber}</p>
            <p className="text-xs text-muted-foreground">{season.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{totalVisible} {t("novel.detail.chapters")}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ overflow: "hidden" }}
      >
        <div className="border-t border-border/40 divide-y divide-border/40">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))
          ) : chapters?.length === 0 && !upcoming?.length ? (
            <div className="px-5 py-5 text-sm text-muted-foreground text-center">{t("novel.detail.noChapters")}</div>
          ) : (
            <>
              {chapters?.map(ch => (
                <Link
                  key={ch.id}
                  href={`/${story.slug}/season-${season.seasonNumber}/bab-${ch.chapterNumber}`}
                  data-testid={`link-chapter-${ch.id}`}
                >
                  <div className="px-5 py-3.5 hover:bg-primary/5 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-xs text-muted-foreground/60 font-mono w-8">
                        {ch.chapterNumber}
                      </span>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors font-medium truncate">
                        {ch.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/60 shrink-0 ml-2">
                      <Clock size={10} />
                      <span>{(ch.scheduledAt ?? ch.createdAt) ? timeAgo((ch.scheduledAt ?? ch.createdAt)!, language) : "—"}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {upcoming?.map(ch => (
                <div
                  key={ch.id}
                  className="px-5 py-3.5 flex items-center justify-between opacity-50"
                  data-testid={`upcoming-chapter-${ch.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 text-xs text-muted-foreground/60 font-mono w-8">{ch.chapterNumber}</span>
                    <Lock size={11} className="shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground italic truncate">{ch.title}</span>
                  </div>
                  {ch.scheduledAt && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-full ml-2">
                      <Clock size={9} />
                      <span>{countdown(ch.scheduledAt, language)}</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface ReadingProgress {
  seasonNum: number;
  chapterNum: number;
  chapterTitle: string;
  updatedAt: string;
}

function useBookmark(slug: string) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("novel-bookmarks") || "[]");
      setBookmarked(saved.includes(slug));
    } catch {}
  }, [slug]);

  const toggle = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("novel-bookmarks") || "[]");
      let next: string[];
      if (saved.includes(slug)) {
        next = saved.filter((s: string) => s !== slug);
      } else {
        next = [...saved, slug];
      }
      localStorage.setItem("novel-bookmarks", JSON.stringify(next));
      setBookmarked(!saved.includes(slug));
    } catch {}
  };

  return { bookmarked, toggle };
}

function StarRating({ slug, initialSum, initialCount }: { slug: string; initialSum: number; initialCount: number }) {
  const { t } = useLanguage();
  const [ratingSum, setRatingSum] = useState(initialSum);
  const [ratingCount, setRatingCount] = useState(initialCount);
  const [userRating, setUserRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`novel-rated-${slug}`);
      if (saved) {
        setHasVoted(true);
        setUserRating(Number(saved));
      }
    } catch {}
  }, [slug]);

  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
  const displayRating = hovered || userRating || Math.round(avgRating);

  const handleRate = async (star: number) => {
    if (hasVoted || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/novel/stories/${slug}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: star }),
      });
      if (res.ok) {
        const data = await res.json();
        setRatingSum(data.ratingSum);
        setRatingCount(data.ratingCount);
        setUserRating(star);
        setHasVoted(true);
        localStorage.setItem(`novel-rated-${slug}`, String(star));
      }
    } catch {}
    setVoting(false);
  };

  return (
    <div className="flex items-center gap-3" data-testid="star-rating">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            disabled={hasVoted || voting}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !hasVoted && setHovered(star)}
            onMouseLeave={() => !hasVoted && setHovered(0)}
            className={`transition-all duration-100 disabled:cursor-default ${hasVoted ? "" : "hover:scale-110 cursor-pointer"}`}
            data-testid={`button-star-${star}`}
            aria-label={`Beri ${star} bintang`}
          >
            <Star
              size={18}
              className={`transition-colors ${
                star <= displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-sm">
        {ratingCount > 0 ? (
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            {" "}({ratingCount.toLocaleString()} rating)
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">{t("novel.detail.noRating")}</span>
        )}
      </div>
      {hasVoted && (
        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
          {t("novel.detail.yourRating")}: {userRating}★
        </span>
      )}
    </div>
  );
}

function ShareCardModal({ story, onClose }: { story: NovelStory; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 540, H = 675;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function renderCard(coverImg?: HTMLImageElement) {
      if (!ctx) return;
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#1a1030");
      bg.addColorStop(0.5, "#0e0b1f");
      bg.addColorStop(1, "#0a0818");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (coverImg) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.drawImage(coverImg, -30, -30, W + 60, H * 0.72);
        ctx.restore();
        const veil = ctx.createLinearGradient(0, 0, 0, H * 0.72);
        veil.addColorStop(0, "rgba(14,11,31,0.2)");
        veil.addColorStop(1, "rgba(14,11,31,1)");
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, W, H * 0.72);

        const cW = 155, cH = 232;
        const cX = (W - cW) / 2, cY = 48;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 16;
        ctx.beginPath();
        const r = 10;
        ctx.moveTo(cX + r, cY);
        ctx.lineTo(cX + cW - r, cY);
        ctx.quadraticCurveTo(cX + cW, cY, cX + cW, cY + r);
        ctx.lineTo(cX + cW, cY + cH - r);
        ctx.quadraticCurveTo(cX + cW, cY + cH, cX + cW - r, cY + cH);
        ctx.lineTo(cX + r, cY + cH);
        ctx.quadraticCurveTo(cX, cY + cH, cX, cY + cH - r);
        ctx.lineTo(cX, cY + r);
        ctx.quadraticCurveTo(cX, cY, cX + r, cY);
        ctx.closePath();
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.clip();
        ctx.shadowColor = "transparent";
        ctx.drawImage(coverImg, cX, cY, cW, cH);
        ctx.restore();
      }

      const titleY = coverImg ? 340 : 220;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 26px Georgia, "Times New Roman", serif`;
      const words = story.title.split(" ");
      let line = "";
      let y = titleY;
      const maxW = W - 80;
      for (const word of words) {
        const test = line + (line ? " " : "") + word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, W / 2, y);
          line = word;
          y += 34;
        } else { line = test; }
      }
      ctx.fillText(line, W / 2, y);

      if (story.category) {
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.font = "13px sans-serif";
        ctx.fillText(story.category.toUpperCase(), W / 2, y + 30);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, H - 96);
      ctx.lineTo(W - 60, H - 96);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("WOOCE NOVEL", W / 2, H - 64);
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.font = "11px sans-serif";
      ctx.fillText("Dunia novel, tanpa batas imaginasi", W / 2, H - 42);
    }

    if (story.coverUrl) {
      const img = new Image();
      img.onload = () => renderCard(img);
      img.onerror = () => renderCard();
      img.src = story.coverUrl;
    } else {
      renderCard();
    }
  }, [story]);

  useEffect(() => { draw(); }, [draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${story.slug}-wooce.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">{t("novel.shareCard.title")}</p>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-close-sharecard"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-3">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl"
            style={{ imageRendering: "auto" }}
          />
          <p className="text-[11px] text-muted-foreground text-center mt-2 mb-3">
            {t("novel.shareCard.note")}
          </p>
          <button
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            data-testid="button-download-sharecard"
          >
            <ImageDown size={15} />
            {t("novel.shareCard.download")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function NovelDetail() {
  const [, params] = useRoute("/:slug");
  const { t } = useLanguage();
  const slug = params?.slug ?? "";
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const { bookmarked, toggle: toggleBookmark } = useBookmark(slug);

  const handleShare = async (title: string, description?: string | null) => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, text: description ?? "", url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {}
    }
  };

  const { data: story, isLoading: storyLoading } = useQuery<NovelStory>({
    queryKey: ["/api/novel/stories", slug],
    queryFn: () => fetch(`/api/novel/stories/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/novel/stories/${slug}/view`, { method: "PATCH" })
      .then(r => r.json())
      .then(data => setViewCount(data.viewCount))
      .catch(() => {});
    try {
      const saved = localStorage.getItem(`novel-progress-${slug}`);
      if (saved) setReadingProgress(JSON.parse(saved));
    } catch {}
  }, [slug]);

  const { data: seasons, isLoading: seasonsLoading } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", story?.id, "seasons"],
    queryFn: () => fetch(`/api/novel/stories/${story!.id}/seasons`).then(r => r.json()),
    enabled: !!story?.id,
  });

  const { data: stats } = useQuery<{ totalSeasons: number; totalChapters: number }>({
    queryKey: ["/api/novel/stories", story?.id, "stats"],
    queryFn: () => fetch(`/api/novel/stories/${story!.id}/stats`).then(r => r.json()),
    enabled: !!story?.id,
  });

  const isLoading = storyLoading || seasonsLoading;

  const firstChapter = seasons && seasons.length > 0 ? { seasonNum: seasons[0].seasonNumber } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-64 bg-muted/30" />
        <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <Skeleton className="w-36 aspect-[2/3] rounded-2xl flex-shrink-0 -mt-20" />
            <div className="flex-1 space-y-3 pt-2">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <BookOpen size={48} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t("novel.detail.notFound")}</p>
          <Link href="/">
            <button className="mt-4 text-sm text-primary hover:underline">{t("novel.detail.back")}</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={story.title}
        description={story.description ?? `Baca ${story.title}.`}
        url={`/${story.slug}`}
        image={story.coverUrl ?? undefined}
      />
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-52 sm:h-64 overflow-hidden">
        {story.coverUrl ? (
          <>
            <img src={story.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm" aria-hidden />
            <div className="absolute inset-0 bg-black/65" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <main className="max-w-4xl mx-auto px-5 lg:px-8">
        {/* Back */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 mt-2" data-testid="button-back-novel">
            <ArrowLeft size={14} />
            {t("novel.detail.allStories")}
          </button>
        </Link>

        {/* Story Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-6 mb-8 -mt-28 sm:-mt-36 relative"
        >
          {/* Cover */}
          <div className="w-28 sm:w-40 flex-shrink-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-2xl border border-border/30">
              {story.coverUrl ? (
                <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen size={32} className="text-primary/40" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-20 sm:pt-24">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {t(STATUS_LABEL_KEY[story.status] ?? "novel.status.ongoing")}
              </span>
              <span className="text-[11px] capitalize bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                {story.category}
              </span>
              {(story.tags ?? []).map(tag => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight" data-testid="text-story-title">
              {story.title}
            </h1>
            {story.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-xl">{story.description}</p>
            )}

            {/* Rating */}
            <div className="mb-4">
              <StarRating
                slug={slug}
                initialSum={(story as any).ratingSum ?? 0}
                initialCount={(story as any).ratingCount ?? 0}
              />
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-5">
              <span className="flex items-center gap-1.5">
                <BookMarked size={13} className="text-primary/60" />
                {stats?.totalSeasons ?? seasons?.length ?? 0} Season
              </span>
              <span className="text-border">·</span>
              <span>{stats?.totalChapters ?? 0} {t("novel.detail.chapters")}</span>
              {viewCount !== null && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1"><Eye size={12} />{viewCount.toLocaleString()}</span>
                </>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2">
              {readingProgress ? (
                <Link href={`/${slug}/season-${readingProgress.seasonNum}/bab-${readingProgress.chapterNum}`}>
                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/30"
                    data-testid="button-continue-reading"
                  >
                    <Play size={13} fill="currentColor" />
                    {t("novel.detail.continueRead")} {readingProgress.chapterNum}
                  </button>
                </Link>
              ) : firstChapter ? (
                <Link href={`/${slug}/season-${firstChapter.seasonNum}/bab-1`}>
                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/30"
                    data-testid="button-start-reading"
                  >
                    <Play size={13} fill="currentColor" />
                    {t("novel.detail.startRead")}
                  </button>
                </Link>
              ) : null}
              <a href="#chapters">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  <List size={14} />
                  {t("novel.detail.tableOfContents")}
                </button>
              </a>
              <button
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  bookmarked
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
                data-testid="button-bookmark"
              >
                {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {bookmarked ? t("novel.detail.saved") : t("novel.detail.save")}
              </button>
              <button
                onClick={() => handleShare(story.title, story.description)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                data-testid="button-share-story"
              >
                {shareCopied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                {shareCopied ? t("novel.share.copied") : t("novel.share")}
              </button>
              <button
                onClick={() => setShowShareCard(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                data-testid="button-open-sharecard"
              >
                <ImageDown size={14} />
                {t("novel.shareCard.title")}
              </button>
              {(story as any).donationUrl && (
                <a
                  href={(story as any).donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/8 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
                  data-testid="button-donate-story"
                >
                  <Heart size={13} fill="currentColor" />
                  Dukung Penulis
                </a>
              )}
            </div>
            {(story as any).author && (
              <div className="mt-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {(story as any).author.photoUrl
                    ? <img src={(story as any).author.photoUrl} alt={(story as any).author.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-primary/10"><User size={12} className="text-primary/60" /></div>
                  }
                </div>
                <Link href={`/penulis/${(story as any).author.slug}`}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-story-author">
                    oleh <span className="font-medium text-foreground">{(story as any).author.name}</span>
                  </span>
                </Link>
                {(story as any).author.userStatus === "suspended" && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    Suspended
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue Reading banner */}
        {readingProgress && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl bg-primary/8 border border-primary/20"
            data-testid="banner-continue-reading"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{t("novel.detail.lastReadLabel")}</p>
              <p className="font-medium text-foreground text-sm truncate">
                Bab {readingProgress.chapterNum}: {readingProgress.chapterTitle}
              </p>
            </div>
            <Link href={`/${slug}/season-${readingProgress.seasonNum}/bab-${readingProgress.chapterNum}`}>
              <button className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline" data-testid="button-continue-reading-banner">
                {t("novel.detail.continueBtn")} <ChevronRight size={12} />
              </button>
            </Link>
          </motion.div>
        )}

        {/* Table of Contents */}
        <motion.div
          id="chapters"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t("novel.detail.tableOfContents")}</h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {!seasons || seasons.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground border border-border/50 rounded-2xl bg-muted/20">
              <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("novel.detail.noSeasons")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map(season => (
                <SeasonAccordion key={season.id} story={story} season={season} />
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <RecommendationsSection currentSlug={slug} category={story.category} />

      <Footer />

      <AnimatePresence>
        {showShareCard && (
          <ShareCardModal story={story} onClose={() => setShowShareCard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Recommendations ───────────────────────────────────────────────────────────
function RecommendationsSection({ currentSlug, category }: { currentSlug: string; category: string }) {
  const { t } = useLanguage();
  const { data: allStories } = useQuery<(NovelStory & { totalChapters: number; lastChapterAt: string | null })[]>({
    queryKey: ["/api/novel/stories"],
  });

  const recs = useMemo(
    () => (allStories ?? []).filter(s => s.slug !== currentSlug && s.category === category).slice(0, 6),
    [allStories, currentSlug, category]
  );

  if (recs.length === 0) return null;

  const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
    ongoing:   { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
    completed: { color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
    hiatus:    { color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400" },
  };

  return (
    <section className="max-w-2xl mx-auto px-5 sm:px-8 border-t border-border/40 pt-8 mt-4 pb-10">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-base font-bold text-foreground">{t("novel.detail.mayLike")}</h2>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {recs.map((story, i) => {
          const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
          return (
            <motion.div key={story.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/${story.slug}`} data-testid={`link-rec-${story.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                    {story.coverUrl ? (
                      <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen size={18} className="text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                        {story.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{story.title}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
