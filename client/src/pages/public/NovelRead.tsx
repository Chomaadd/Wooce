import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, BookOpen, Clock,
  Settings2, X, Share2, Check, List, Quote, Download,
} from "lucide-react";
import type { NovelChapter, NovelStory, NovelSeason } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { renderRichContent } from "@/components/ui/rich-text-editor";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Reading Settings ──────────────────────────────────────────────────────────
type ReadingMode = "light" | "sepia" | "night";
type FontFamily = "sans" | "serif";

interface ReadingSettings {
  fontSize: number;
  fontFamily: FontFamily;
  mode: ReadingMode;
}

const DEFAULT_SETTINGS: ReadingSettings = { fontSize: 17, fontFamily: "sans", mode: "light" };

const MODE_STYLES: Record<ReadingMode, { bg: string; text: string; border: string; panelBg: string }> = {
  light:  { bg: "transparent",  text: "inherit",  border: "transparent", panelBg: "#ffffff" },
  sepia:  { bg: "#faf3e8",       text: "#5c3d1e",  border: "#e8d9c0",     panelBg: "#f5e9d5" },
  night:  { bg: "#0f1117",       text: "#c9d1d9",  border: "#21262d",     panelBg: "#161b22" },
};

function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    try {
      const saved = localStorage.getItem("novel-reading-settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const update = useCallback((patch: Partial<ReadingSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("novel-reading-settings", JSON.stringify(next));
      return next;
    });
  }, []);
  return { settings, update };
}

function estimateReadTime(content: string) {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ settings, update, onClose }: {
  settings: ReadingSettings;
  update: (p: Partial<ReadingSettings>) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const modes: ReadingMode[] = ["light", "sepia", "night"];
  const fonts: FontFamily[] = ["sans", "serif"];
  const modeMeta: Record<ReadingMode, { label: string; icon: string; preview: string }> = {
    light: { label: t("novel.read.modeLight"), icon: "☀", preview: "bg-white border-slate-200 text-slate-800" },
    sepia: { label: t("novel.read.modeSepia"), icon: "📖", preview: "bg-[#faf3e8] border-[#e8d9c0] text-[#5c3d1e]" },
    night: { label: t("novel.read.modeNight"), icon: "🌙", preview: "bg-[#0f1117] border-[#21262d] text-[#c9d1d9]" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="fixed bottom-20 right-4 z-50 w-72 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      data-testid="panel-reading-settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="font-semibold text-sm text-foreground">{t("novel.read.settings")}</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-settings">
          <X size={15} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("novel.read.fontSize")}</span>
            <span className="text-xs font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md">{settings.fontSize}px</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => update({ fontSize: Math.max(14, settings.fontSize - 1) })}
              className="w-8 h-8 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground font-bold text-sm flex-shrink-0"
            >
              A
            </button>
            <input
              type="range" min={14} max={22} step={1}
              value={settings.fontSize}
              onChange={e => update({ fontSize: Number(e.target.value) })}
              className="flex-1 accent-primary h-1.5 rounded-full"
              data-testid="slider-font-size"
            />
            <button
              onClick={() => update({ fontSize: Math.min(22, settings.fontSize + 1) })}
              className="w-8 h-8 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground font-bold text-base flex-shrink-0"
            >
              A
            </button>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">{t("novel.read.fontFamily")}</span>
          <div className="grid grid-cols-2 gap-2">
            {fonts.map(f => (
              <button
                key={f}
                onClick={() => update({ fontFamily: f })}
                className={`py-2.5 rounded-xl border text-sm transition-all ${f === "serif" ? "font-serif" : "font-sans"} ${
                  settings.fontFamily === f
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`button-font-${f}`}
              >
                {t(f === "sans" ? "novel.read.fontSans" : "novel.read.fontSerif")}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Mode */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">{t("novel.read.readingMode")}</span>
          <div className="grid grid-cols-3 gap-2">
            {modes.map(m => (
              <button
                key={m}
                onClick={() => update({ mode: m })}
                className={`py-2.5 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                  settings.mode === m
                    ? "border-primary ring-1 ring-primary/30"
                    : ""
                } ${modeMeta[m].preview}`}
                data-testid={`button-mode-${m}`}
              >
                <span className="text-base leading-none">{modeMeta[m].icon}</span>
                <span>{modeMeta[m].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── TOC Panel ─────────────────────────────────────────────────────────────────
function TOCPanel({ chapters, currentChapterNum, slug, seasonNum, onClose }: {
  chapters: NovelChapter[];
  currentChapterNum: number;
  slug: string;
  seasonNum: number;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-72 sm:w-80 bg-background border-l border-border shadow-2xl flex flex-col"
        data-testid="panel-toc"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-2">
            <List size={15} className="text-primary" />
            <span className="font-bold text-sm text-foreground">{t("novel.read.toc")}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-toc">
            <X size={16} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground px-4 py-2 border-b border-border/50 bg-muted/10">
          {chapters.length} {t("novel.read.chapterUnit")} · {t("novel.read.chapterOf")} {currentChapterNum} {t("novel.read.currentlyReading")}
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {chapters.map(ch => {
            const isCurrent = ch.chapterNumber === currentChapterNum;
            return (
              <a
                key={ch.id}
                ref={isCurrent ? activeRef : undefined}
                href={`/${slug}/season-${seasonNum}/bab-${ch.chapterNumber}`}
                onClick={onClose}
                className={`flex items-start gap-3 px-4 py-3 transition-colors group ${isCurrent ? "bg-primary/10" : "hover:bg-muted/60"}`}
                data-testid={`toc-chapter-${ch.chapterNumber}`}
              >
                <span className={`text-[11px] font-mono w-7 flex-shrink-0 pt-0.5 ${isCurrent ? "text-primary font-bold" : "text-muted-foreground/40"}`}>
                  {ch.chapterNumber}
                </span>
                <span className={`text-sm leading-snug line-clamp-2 ${isCurrent ? "text-primary font-semibold" : "text-foreground/80 group-hover:text-foreground"}`}>
                  {ch.title}
                </span>
                {isCurrent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
              </a>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ── Reader Header ─────────────────────────────────────────────────────────────
function ReaderHeader({ story, chapter, chapterNum, slug, onTOC, onSettings, settingsOpen, tocOpen }: {
  story?: NovelStory;
  chapter?: NovelChapter;
  chapterNum: number;
  slug: string;
  onTOC: () => void;
  onSettings: () => void;
  settingsOpen: boolean;
  tocOpen: boolean;
}) {
  return (
    <header className="fixed top-0.5 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="max-w-3xl mx-auto px-3 sm:px-5 h-11 flex items-center gap-2 sm:gap-3">
        {/* Back */}
        <Link href={`/${slug}`}>
          <button
            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground"
            data-testid="button-reader-back"
          >
            <ArrowLeft size={17} />
          </button>
        </Link>

        {/* Title info */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted-foreground truncate leading-none">{story?.title ?? slug}</div>
          <div className="text-xs font-semibold text-foreground truncate leading-tight">
            Bab {chapterNum}{chapter?.title ? `: ${chapter.title}` : ""}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onTOC}
            className={`p-1.5 rounded-lg transition-colors ${tocOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            data-testid="button-reader-toc"
            title="Daftar bab"
          >
            <List size={16} />
          </button>
          <button
            onClick={onSettings}
            className={`p-1.5 rounded-lg transition-colors ${settingsOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            data-testid="button-reader-settings"
            title="Pengaturan baca"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NovelRead() {
  const { t } = useLanguage();
  const [, params] = useRoute("/:slug/:seasonSlug/:chapterSlug");
  const slug = params?.slug ?? "";
  const seasonNum = Number(params?.seasonSlug?.replace("season-", "") ?? 1);
  const chapterNum = Number(params?.chapterSlug?.replace("bab-", "") ?? 1);

  const [, navigate] = useLocation();
  const { settings, update } = useReadingSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const restoredRef = useRef(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteCardOpen, setQuoteCardOpen] = useState(false);
  const quoteCanvasRef = useRef<HTMLCanvasElement>(null);

  const { data: chapter, isLoading } = useQuery<NovelChapter>({
    queryKey: ["/api/novel/read", slug, seasonNum, chapterNum],
    queryFn: () => fetch(`/api/novel/read/${slug}/season-${seasonNum}/bab-${chapterNum}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug && !isNaN(seasonNum) && !isNaN(chapterNum),
  });

  const { data: story } = useQuery<NovelStory>({
    queryKey: ["/api/novel/stories", slug],
    queryFn: () => fetch(`/api/novel/stories/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: seasons } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", story?.id, "seasons"],
    queryFn: () => fetch(`/api/novel/stories/${story!.id}/seasons`).then(r => r.json()),
    enabled: !!story?.id,
  });

  const { data: chapterList } = useQuery<NovelChapter[]>({
    queryKey: ["/api/novel/seasons", chapter?.seasonId, "chapters"],
    queryFn: () => fetch(`/api/novel/seasons/${chapter!.seasonId}/chapters`).then(r => r.json()),
    enabled: !!chapter?.seasonId,
  });

  const currentSeason  = seasons?.find(s => s.seasonNumber === seasonNum);
  const currentIndex   = chapterList?.findIndex(c => c.chapterNumber === chapterNum) ?? -1;
  const prevChapter    = currentIndex > 0 ? chapterList?.[currentIndex - 1] : null;
  const nextChapter    = currentIndex >= 0 && chapterList && currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;

  // Track chapter view count
  useEffect(() => {
    if (!chapter?.id) return;
    const key = `novel-chapter-viewed-${chapter.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/novel/chapters/${chapter.id}/view`, { method: "PATCH" }).catch(() => {});
  }, [chapter?.id]);

  // Scroll progress
  useEffect(() => {
    const handler = () => {
      const scrollY   = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPercent(docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-save reading progress
  useEffect(() => {
    if (!chapter || !slug) return;
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.setItem(`novel-progress-${slug}`, JSON.stringify({
          seasonNum, chapterNum,
          chapterTitle: chapter.title,
          scrollY: window.scrollY,
          updatedAt: new Date().toISOString(),
        }));
      }, 800);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => { window.removeEventListener("scroll", handler); clearTimeout(timer); };
  }, [chapter, slug, seasonNum, chapterNum]);

  // Restore scroll position
  useEffect(() => {
    if (!chapter || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(`novel-progress-${slug}`);
      if (saved) {
        const { seasonNum: sn, chapterNum: cn, scrollY } = JSON.parse(saved);
        if (sn === seasonNum && cn === chapterNum && scrollY > 200) {
          setTimeout(() => window.scrollTo({ top: scrollY, behavior: "smooth" }), 150);
        }
      }
    } catch {}
  }, [chapter, slug, seasonNum, chapterNum]);

  // Close settings on scroll
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = () => setSettingsOpen(false);
    window.addEventListener("scroll", handler, { passive: true, once: true });
    return () => window.removeEventListener("scroll", handler);
  }, [settingsOpen]);

  // Quote text selection
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const text = sel.toString().trim();
      if (text.length >= 10 && text.length <= 500) {
        setQuoteText(text);
      } else if (!text) {
        setQuoteText("");
      }
    };
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, []);

  // Draw quote card on canvas
  useEffect(() => {
    if (!quoteCardOpen || !quoteCanvasRef.current) return;
    const canvas = quoteCanvasRef.current;
    const W = 540, H = 540;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1a1030");
    bg.addColorStop(0.5, "#0e0b1f");
    bg.addColorStop(1, "#0a0818");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const accent = ctx.createLinearGradient(0, 0, W, 0);
    accent.addColorStop(0, "#7c3aed");
    accent.addColorStop(1, "#4f46e5");
    ctx.fillStyle = accent;
    ctx.fillRect(40, 70, 4, H - 140);
    ctx.fillRect(W - 44, 70, 4, H - 140);

    ctx.font = `bold 72px serif`;
    ctx.fillStyle = "rgba(124,58,237,0.25)";
    ctx.fillText("\u201C", 42, 140);

    const maxW = W - 110;
    const words = quoteText.split(" ");
    const lines: string[] = [];
    let line = "";
    ctx.font = `italic ${quoteText.length > 200 ? 18 : quoteText.length > 100 ? 21 : 24}px serif`;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineH = quoteText.length > 200 ? 28 : quoteText.length > 100 ? 32 : 36;
    const totalTextH = lines.length * lineH;
    let y = (H - totalTextH) / 2 + lineH * 0.5;

    ctx.fillStyle = "#e2d9f3";
    for (const l of lines) {
      ctx.fillText(l, 65, y);
      y += lineH;
    }

    ctx.fillStyle = "rgba(124,58,237,0.7)";
    ctx.fillRect(65, H - 90, W - 130, 1);
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#a78bfa";
    ctx.fillText(story?.title ?? "WOOCE Novel", 65, H - 68);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(167,139,250,0.6)";
    ctx.fillText("wooce.replit.app", 65, H - 50);
  }, [quoteCardOpen, quoteText, story?.title]);

  // Keyboard navigation (← prev, → next)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevChapter) {
        navigate(`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        navigate(`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevChapter, nextChapter, slug, seasonNum, navigate]);

  const handleShare = async (title: string, storyTitle?: string) => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${title} — ${storyTitle ?? ""}`, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {}
    }
  };

  const modeStyle   = MODE_STYLES[settings.mode];
  const fontClass   = settings.fontFamily === "serif" ? "font-serif" : "font-sans";
  const proseInvert = settings.mode === "light" ? "dark:prose-invert" : settings.mode === "night" ? "prose-invert" : "";

  const proseColorVars: React.CSSProperties =
    settings.mode === "sepia" ? {
      "--tw-prose-body":          "#5c3d1e",
      "--tw-prose-headings":      "#3d2810",
      "--tw-prose-bold":          "#3d2810",
      "--tw-prose-links":         "#7a4f26",
      "--tw-prose-code":          "#5c3d1e",
      "--tw-prose-quotes":        "#7a5230",
      "--tw-prose-quote-borders": "#c4a882",
      "--tw-prose-captions":      "#7a5230",
      "--tw-prose-hr":            "#d4c4a8",
    } as React.CSSProperties :
    settings.mode === "night" ? {
      "--tw-prose-body":          "#c9d1d9",
      "--tw-prose-headings":      "#e6edf3",
      "--tw-prose-bold":          "#e6edf3",
      "--tw-prose-links":         "#58a6ff",
      "--tw-prose-code":          "#c9d1d9",
      "--tw-prose-quotes":        "#8b949e",
      "--tw-prose-quote-borders": "#30363d",
      "--tw-prose-captions":      "#8b949e",
      "--tw-prose-hr":            "#21262d",
    } as React.CSSProperties : {};

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-muted z-50" />
        <div className="fixed top-0.5 left-0 right-0 z-40 bg-background/90 border-b border-border/50 h-11" />
        <div className="max-w-2xl mx-auto px-5 pt-24 pb-12 space-y-4">
          <Skeleton className="h-5 w-1/4 rounded-full" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/5 rounded-full" />
          <div className="pt-8 space-y-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${75 + (i % 5) * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6 py-20 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
            <BookOpen size={28} className="text-muted-foreground opacity-40" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">{t("novel.read.notFound")}</h2>
          <p className="text-sm text-muted-foreground mb-6">Bab ini tidak ditemukan atau belum tersedia.</p>
          <Link href={`/${slug}`}>
            <button className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity" data-testid="button-back-to-story">
              {t("novel.read.backToStory")}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: modeStyle.bg !== "transparent" ? modeStyle.bg : undefined,
        color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
      }}
    >
      <SeoHead
        title={`${chapter.title} — ${story?.title ?? slug}`}
        description={`Baca Bab ${chapter.chapterNumber}: ${chapter.title} dari ${story?.title ?? slug}.`}
        url={`/${slug}/season-${seasonNum}/bab-${chapterNum}`}
        image={story?.coverUrl ?? undefined}
      />

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border/20">
        <div
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollPercent}%` }}
          data-testid="bar-reading-progress"
        />
      </div>

      {/* Custom reader header */}
      <ReaderHeader
        story={story}
        chapter={chapter}
        chapterNum={chapterNum}
        slug={slug}
        onTOC={() => { setTocOpen(v => !v); setSettingsOpen(false); }}
        onSettings={() => { setSettingsOpen(v => !v); setTocOpen(false); }}
        settingsOpen={settingsOpen}
        tocOpen={tocOpen}
      />

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-20 pb-24">

        {/* Chapter header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Cover + metadata */}
          <div
            className="relative rounded-2xl overflow-hidden mb-8"
            style={{
              background: modeStyle.bg !== "transparent"
                ? `color-mix(in srgb, ${modeStyle.bg} 85%, transparent)`
                : undefined,
            }}
          >
            {/* Blurred cover bg */}
            {story?.coverUrl && (
              <div className="absolute inset-0 opacity-[0.12]">
                <img src={story.coverUrl} alt="" className="w-full h-full object-cover blur-2xl scale-110" />
              </div>
            )}

            <div className="relative flex gap-4 p-5 sm:p-7">
              {/* Cover art */}
              {story?.coverUrl && (
                <div className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-border/20">
                  <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <Link href={`/${slug}`}>
                  <p className="text-xs text-primary font-semibold mb-0.5 hover:underline cursor-pointer truncate">
                    {story?.title ?? slug}
                  </p>
                </Link>
                <p className="text-xs text-muted-foreground mb-2">
                  Season {seasonNum}{currentSeason?.title ? ` — ${currentSeason.title}` : ""}
                </p>
                <h1
                  className={`text-xl sm:text-2xl font-bold leading-snug mb-3 ${fontClass}`}
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined }}
                  data-testid="text-chapter-title"
                >
                  {t("novel.read.chapterOf")} {chapter.chapterNumber}: {chapter.title}
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    ~{estimateReadTime(chapter.content)} {t("novel.read.minReadUnit")}
                  </span>
                  {chapterList && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} />
                      Bab {chapterNum} / {chapterList.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chapter content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className={`prose prose-gray max-w-none
            prose-p:leading-[2] prose-headings:font-bold
            prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
            prose-ul:my-2 prose-ol:my-2 prose-strong:font-bold prose-em:italic
            prose-p:my-5 prose-hr:my-10 ${proseInvert} ${fontClass}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
            ...proseColorVars,
          }}
          data-testid="text-chapter-content"
          dangerouslySetInnerHTML={{ __html: renderRichContent(chapter.content) }}
        />

        {/* End of chapter divider */}
        <div className="flex items-center gap-4 my-16">
          <div className="flex-1 h-px" style={{ background: modeStyle.border !== "transparent" ? modeStyle.border : "hsl(var(--border))" }} />
          <span className="text-xs text-muted-foreground px-3">— {t("novel.read.finished")} —</span>
          <div className="flex-1 h-px" style={{ background: modeStyle.border !== "transparent" ? modeStyle.border : "hsl(var(--border))" }} />
        </div>

        {/* Donation section */}
        {(() => {
          const author = (story as any)?.author;
          const hasSaweria  = !!author?.saweria;
          const hasTrakteer = !!author?.trakteer;
          const hasDonation = !!(story as any)?.donationUrl;
          if (!hasSaweria && !hasTrakteer && !hasDonation) return null;
          return (
            <div className="mb-10 text-center">
              <p className="text-xs text-muted-foreground mb-3">{t("novel.read.donatePrompt")}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {hasSaweria && (
                  <a
                    href={author.saweria}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md active:scale-95"
                    data-testid="button-donate-saweria"
                  >
                    ☕ Saweria
                  </a>
                )}
                {hasTrakteer && (
                  <a
                    href={author.trakteer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md active:scale-95"
                    data-testid="button-donate-trakteer"
                  >
                    🎁 Trakteer
                  </a>
                )}
                {hasDonation && !hasSaweria && !hasTrakteer && (
                  <a
                    href={(story as any).donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md active:scale-95"
                    data-testid="button-donate-link"
                  >
                    💝 {t("novel.read.donateBtn")}
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* Chapter navigation cards */}
        <div className="grid grid-cols-2 gap-3 mb-8" data-testid="section-chapter-nav">
          {/* Prev */}
          {prevChapter ? (
            <Link href={`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`}>
              <div
                className="p-4 rounded-2xl border hover:border-primary/40 transition-all group cursor-pointer h-full"
                style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
                data-testid="button-prev-chapter"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                  <ArrowLeft size={11} />
                  <span>{t("novel.read.prevChapter")}</span>
                </div>
                <div className={`text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors ${fontClass}`}
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined }}
                >
                  {t("novel.read.chapterOf")} {prevChapter.chapterNumber}: {prevChapter.title}
                </div>
              </div>
            </Link>
          ) : (
            <Link href={`/${slug}`}>
              <div
                className="p-4 rounded-2xl border border-dashed hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer h-full flex flex-col justify-center"
                data-testid="button-back-story"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <ArrowLeft size={11} />
                  <span>{t("novel.read.backLabel")}</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground">{t("novel.read.novelPage")}</div>
              </div>
            </Link>
          )}

          {/* Next */}
          {nextChapter ? (
            <Link href={`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`}>
              <div
                className="p-4 rounded-2xl border hover:border-primary/40 transition-all group cursor-pointer h-full text-right"
                style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
                data-testid="button-next-chapter"
              >
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground mb-2">
                  <span>{t("novel.read.nextChapter")}</span>
                  <ArrowRight size={11} />
                </div>
                <div className={`text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors ${fontClass}`}
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined }}
                >
                  {t("novel.read.chapterOf")} {nextChapter.chapterNumber}: {nextChapter.title}
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="p-4 rounded-2xl border border-dashed flex flex-col items-end justify-center"
              style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                <span>{t("novel.read.finished")}</span>
                <ArrowRight size={11} />
              </div>
              <div className="text-sm text-muted-foreground">{t("novel.read.lastChapter")}</div>
            </div>
          )}
        </div>

        {/* Back to story button */}
        <div className="text-center">
          <Link href={`/${slug}`}>
            <button
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-medium hover:bg-muted/50 transition-colors"
              style={{
                borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined,
                color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
              }}
              data-testid="button-back-to-detail"
            >
              <BookOpen size={15} />
              {t("novel.read.backToDetail")}
            </button>
          </Link>
        </div>
      </main>

      {/* Floating action buttons */}
      <div className="fixed bottom-5 right-4 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {quoteText && !quoteCardOpen && (
            <motion.button
              key="quote-btn"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              onClick={() => setQuoteCardOpen(true)}
              className="w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              data-testid="button-open-quote-card"
              title="Buat kartu kutipan"
            >
              <Quote size={15} />
            </motion.button>
          )}
        </AnimatePresence>
        <button
          onClick={() => handleShare(chapter.title, story?.title)}
          className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
          data-testid="button-share-chapter"
          title={t("novel.share")}
        >
          {shareCopied ? <Check size={15} className="text-green-500" /> : <Share2 size={15} />}
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel settings={settings} update={update} onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>

      {/* TOC Panel */}
      <AnimatePresence>
        {tocOpen && chapterList && (
          <TOCPanel
            chapters={chapterList}
            currentChapterNum={chapterNum}
            slug={slug}
            seasonNum={seasonNum}
            onClose={() => setTocOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quote Card Modal */}
      <AnimatePresence>
        {quoteCardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setQuoteCardOpen(false)}
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
                <p className="text-sm font-semibold flex items-center gap-2"><Quote size={14} className="text-violet-500" /> Kartu Kutipan</p>
                <button onClick={() => setQuoteCardOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-quote-card">
                  <X size={15} />
                </button>
              </div>
              <div className="p-3">
                <canvas ref={quoteCanvasRef} className="w-full rounded-xl" style={{ imageRendering: "auto" }} />
                <p className="text-[11px] text-muted-foreground text-center mt-2 mb-3">Tap download untuk simpan kartu kutipan</p>
                <button
                  onClick={() => {
                    const canvas = quoteCanvasRef.current;
                    if (!canvas) return;
                    const a = document.createElement("a");
                    a.download = `kutipan-${story?.slug ?? "wooce"}.png`;
                    a.href = canvas.toDataURL("image/png");
                    a.click();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
                  data-testid="button-download-quote-card"
                >
                  <Download size={15} />
                  Download Kartu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
