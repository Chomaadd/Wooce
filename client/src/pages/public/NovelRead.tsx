import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, BookOpen, Clock, ChevronLeft, Settings2, X, Share2, Check, List } from "lucide-react";
import type { NovelChapter, NovelStory, NovelSeason } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { renderRichContent } from "@/components/ui/rich-text-editor";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Reading Settings ────────────────────────────────────────────────────────

type ReadingMode = "light" | "sepia" | "night";
type FontFamily = "sans" | "serif";

interface ReadingSettings {
  fontSize: number;
  fontFamily: FontFamily;
  mode: ReadingMode;
}

const DEFAULT_SETTINGS: ReadingSettings = { fontSize: 17, fontFamily: "sans", mode: "light" };

const MODE_STYLES: Record<ReadingMode, { bg: string; text: string; border: string }> = {
  light: { bg: "transparent", text: "inherit", border: "transparent" },
  sepia: { bg: "#faf3e8", text: "#5c3d1e", border: "#e8d9c0" },
  night: { bg: "#161b22", text: "#c9d1d9", border: "#21262d" },
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function estimateReadTime(content: string) {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({
  settings, update, onClose,
}: {
  settings: ReadingSettings;
  update: (p: Partial<ReadingSettings>) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const modes: ReadingMode[] = ["light", "sepia", "night"];
  const fonts: FontFamily[] = ["sans", "serif"];
  const modeKey: Record<ReadingMode, string> = {
    light: "novel.read.modeLight",
    sepia: "novel.read.modeSepia",
    night: "novel.read.modeNight",
  };
  const fontKey: Record<FontFamily, string> = {
    sans: "novel.read.fontSans",
    serif: "novel.read.fontSerif",
  };
  const fontPreview: Record<FontFamily, string> = {
    sans: "font-sans",
    serif: "font-serif",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.18 }}
      className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      data-testid="panel-reading-settings"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm text-foreground">{t("novel.read.settings")}</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-settings">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("novel.read.fontSize")}</span>
            <span className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded-md">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={22}
            step={1}
            value={settings.fontSize}
            onChange={e => update({ fontSize: Number(e.target.value) })}
            className="w-full accent-primary h-1.5 rounded-full"
            data-testid="slider-font-size"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>A</span>
            <span className="text-sm">A</span>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">{t("novel.read.fontFamily")}</span>
          <div className="grid grid-cols-2 gap-2">
            {fonts.map(f => (
              <button
                key={f}
                onClick={() => update({ fontFamily: f })}
                className={`py-2 rounded-xl border text-sm transition-all ${fontPreview[f]} ${
                  settings.fontFamily === f
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`button-font-${f}`}
              >
                {t(fontKey[f])}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Mode */}
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">{t("novel.read.readingMode")}</span>
          <div className="grid grid-cols-3 gap-2">
            {modes.map(m => (
              <button
                key={m}
                onClick={() => update({ mode: m })}
                className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                  settings.mode === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/60"
                }`}
                style={m !== "light" ? {
                  background: settings.mode === m ? undefined : MODE_STYLES[m].bg,
                  color: settings.mode === m ? undefined : MODE_STYLES[m].text,
                  borderColor: settings.mode === m ? undefined : MODE_STYLES[m].border,
                } : {}}
                data-testid={`button-mode-${m}`}
              >
                {t(modeKey[m])}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── TOC Panel ─────────────────────────────────────────────────────────────────

function TOCPanel({
  chapters, currentChapterNum, slug, seasonNum, onClose,
}: {
  chapters: NovelChapter[];
  currentChapterNum: number;
  slug: string;
  seasonNum: number;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-72 sm:w-80 bg-background border-l border-border shadow-2xl flex flex-col"
        data-testid="panel-toc"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <List size={15} className="text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">{t("novel.read.tocTitle")}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-toc">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {chapters.map(ch => {
            const isCurrent = ch.chapterNumber === currentChapterNum;
            return (
              <a
                key={ch.id}
                href={`/${slug}/season-${seasonNum}/bab-${ch.chapterNumber}`}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${isCurrent ? "bg-primary/10" : "hover:bg-muted/60"}`}
                data-testid={`toc-chapter-${ch.chapterNumber}`}
              >
                <span className={`text-xs font-mono w-7 flex-shrink-0 ${isCurrent ? "text-primary font-bold" : "text-muted-foreground/50"}`}>
                  {ch.chapterNumber}
                </span>
                <span className={`text-sm leading-snug line-clamp-2 ${isCurrent ? "text-primary font-semibold" : "text-foreground/80 group-hover:text-foreground"}`}>
                  {ch.title}
                </span>
                {isCurrent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              </a>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NovelRead() {
  const { t } = useLanguage();
  const [, params] = useRoute("/:slug/:seasonSlug/:chapterSlug");
  const slug = params?.slug ?? "";
  const seasonNum = Number(params?.seasonSlug?.replace("season-", "") ?? 1);
  const chapterNum = Number(params?.chapterSlug?.replace("bab-", "") ?? 1);

  const { settings, update } = useReadingSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const restoredRef = useRef(false);

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

  const currentSeason = seasons?.find(s => s.seasonNumber === seasonNum);
  const currentIndex  = chapterList?.findIndex(c => c.chapterNumber === chapterNum) ?? -1;
  const prevChapter   = currentIndex > 0 ? chapterList?.[currentIndex - 1] : null;
  const nextChapter   = currentIndex >= 0 && chapterList && currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;
  const prevSeason    = seasons?.find(s => s.seasonNumber === seasonNum - 1);
  const nextSeason    = seasons?.find(s => s.seasonNumber === seasonNum + 1);

  // Scroll progress bar
  useEffect(() => {
    const handler = () => {
      const scrollY    = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
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
          seasonNum,
          chapterNum,
          chapterTitle: chapter.title,
          scrollY: window.scrollY,
          updatedAt: new Date().toISOString(),
        }));
      }, 800);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => { window.removeEventListener("scroll", handler); clearTimeout(timer); };
  }, [chapter, slug, seasonNum, chapterNum]);

  // Restore scroll position on mount
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

  const modeStyle = MODE_STYLES[settings.mode];
  const fontClass = settings.fontFamily === "serif" ? "font-serif" : "font-sans";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-muted z-50" />
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-12 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">{t("novel.read.notFound")}</p>
          <Link href={`/${slug}`}>
            <button className="mt-6 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity" data-testid="button-back-to-story">
              {t("novel.read.backToStory")}
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border/30">
        <div
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollPercent}%` }}
          data-testid="bar-reading-progress"
        />
      </div>

      <Navbar />

      <main className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 flex-wrap">
          <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Novel</span></Link>
          <ChevronLeft size={12} className="rotate-180" />
          <Link href={`/${slug}`}><span className="hover:text-foreground transition-colors cursor-pointer">{story?.title ?? slug}</span></Link>
          <ChevronLeft size={12} className="rotate-180" />
          <span>Season {seasonNum}</span>
          <ChevronLeft size={12} className="rotate-180" />
          <span className="text-foreground font-medium">{t("novel.read.chapter")} {chapterNum}</span>
        </div>

        {/* Chapter Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pb-6 border-b"
          style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
        >
          <p className="text-sm text-muted-foreground mb-1">Season {seasonNum} — {currentSeason?.title}</p>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-3"
            style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined }}
            data-testid="text-chapter-title"
          >
            {t("novel.read.chapter")} {chapter.chapterNumber}: {chapter.title}
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>~{estimateReadTime(chapter.content)} {t("novel.read.minRead")}</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`prose prose-gray dark:prose-invert max-w-none prose-p:leading-[1.95] prose-headings:font-bold prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-ul:my-2 prose-ol:my-2 prose-strong:font-bold prose-em:italic prose-p:my-4 prose-hr:my-8 ${fontClass}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
          }}
          data-testid="text-chapter-content"
          dangerouslySetInnerHTML={{ __html: renderRichContent(chapter.content) }}
        />

        {/* Navigation */}
        <div
          className="mt-12 pt-8 border-t flex items-center justify-between gap-4"
          style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
        >
          {prevChapter ? (
            <Link href={`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm" data-testid="button-prev-chapter">
                <ArrowLeft size={16} />
                <div className="text-left hidden sm:block">
                  <div className="text-xs text-muted-foreground">{t("novel.read.prev")}</div>
                  <div className="font-medium line-clamp-1">{t("novel.read.chapter")} {prevChapter.chapterNumber}</div>
                </div>
              </button>
            </Link>
          ) : prevSeason ? (
            <Link href={`/${slug}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm" data-testid="button-prev-season">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">{t("novel.read.prev")}</span>
              </button>
            </Link>
          ) : (
            <Link href={`/${slug}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm" data-testid="button-back-story">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">{t("novel.detail.tableOfContents")}</span>
              </button>
            </Link>
          )}

          <Link href={`/${slug}`}>
            <button className="p-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors" title={t("novel.read.chapterList")} data-testid="button-chapter-list">
              <BookOpen size={18} />
            </button>
          </Link>

          {nextChapter ? (
            <Link href={`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm" data-testid="button-next-chapter">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">{t("novel.read.next")}</div>
                  <div className="font-medium line-clamp-1">{t("novel.read.chapter")} {nextChapter.chapterNumber}</div>
                </div>
                <ArrowRight size={16} />
              </button>
            </Link>
          ) : nextSeason ? (
            <Link href={`/${slug}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm" data-testid="button-next-season">
                <span className="hidden sm:inline">{t("novel.read.next")}</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          ) : (
            <div className="w-28" />
          )}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-2">
        <button
          onClick={() => handleShare(chapter.title, story?.title)}
          className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
          data-testid="button-share-chapter"
          title={t("novel.share")}
        >
          {shareCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
        </button>
        {chapterList && chapterList.length > 1 && (
          <button
            onClick={() => { setTocOpen(v => !v); setSettingsOpen(false); }}
            className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
            data-testid="button-toc"
            title={t("novel.read.toc")}
          >
            <List size={16} />
          </button>
        )}
        <button
          onClick={() => { setSettingsOpen(v => !v); setTocOpen(false); }}
          className="w-11 h-11 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          data-testid="button-reading-settings"
          title={t("novel.read.settings")}
        >
          <Settings2 size={18} />
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
    </div>
  );
}
