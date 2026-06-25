import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, BookOpen, Clock,
  Settings2, X, Share2, Check, List, Quote, Download, Link2, Maximize2, Languages, Loader2, RotateCcw, Flag, ChevronLeft, ChevronRight, EllipsisVertical, Lock, LockOpen, Coins, ShoppingBag,
  Volume2, VolumeX, Pause, Play,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { NovelChapter, NovelStory, NovelSeason } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { renderRichContent } from "@/components/ui/rich-text-editor";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect, useRef, useCallback } from "react";
import { TopupModal } from "@/components/payment/TopupModal";

// ── Reading Settings ──────────────────────────────────────────────────────────
type ReadingMode = "light" | "sepia" | "night";
type FontFamily = "sans" | "serif" | "garamond" | "georgia";

interface ReadingSettings {
  fontSize: number;
  fontFamily: FontFamily;
  mode: ReadingMode;
  pageFlip: boolean;
}

const DEFAULT_SETTINGS: ReadingSettings = { fontSize: 17, fontFamily: "sans", mode: "light", pageFlip: false };

const FONT_CLASS_MAP: Record<FontFamily, string> = {
  sans: "font-sans",
  serif: "font-reading",
  garamond: "font-serif",
  georgia: "font-sans",
};
const FONT_FAMILY_VALUE: Record<FontFamily, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-reading)",
  garamond: "var(--font-serif)",
  georgia: "Georgia, 'Times New Roman', serif",
};

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
function SettingsPanel({ settings, update, onClose, ttsVoices, ttsVoiceURI, onTtsVoiceChange }: {
  settings: ReadingSettings;
  update: (p: Partial<ReadingSettings>) => void;
  onClose: () => void;
  ttsVoices: SpeechSynthesisVoice[];
  ttsVoiceURI: string;
  onTtsVoiceChange: (uri: string) => void;
}) {
  const { t } = useLanguage();
  const modes: ReadingMode[] = ["light", "sepia", "night"];

  const previewVoice = (voice: SpeechSynthesisVoice) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Halo, ini suara narator pilihan kamu.");
    u.lang = "id-ID";
    u.voice = voice;
    window.speechSynthesis.speak(u);
  };
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
      className="fixed bottom-20 right-4 z-50 w-72 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      data-testid="panel-reading-settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
        <span className="font-semibold text-sm text-foreground">{t("novel.read.settings")}</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-settings">
          <X size={15} />
        </button>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto flex-1">
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
            {([
              { key: "sans",     label: "Jakarta Sans", cls: "font-sans",    style: {} },
              { key: "serif",    label: "Lora",         cls: "font-reading", style: {} },
              { key: "garamond", label: "Garamond",     cls: "font-serif",   style: {} },
              { key: "georgia",  label: "Georgia",      cls: "",             style: { fontFamily: "Georgia, serif" } },
            ] as { key: FontFamily; label: string; cls: string; style: React.CSSProperties }[]).map(({ key, label, cls, style }) => (
              <button
                key={key}
                onClick={() => update({ fontFamily: key })}
                style={style}
                className={`py-2.5 rounded-xl border text-sm transition-all ${cls} ${
                  settings.fontFamily === key
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`button-font-${key}`}
              >
                {label}
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
        {/* TTS Voice Picker */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">{t("novel.read.ttsVoice")}</span>
          {ttsVoices.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t("novel.read.ttsVoiceNone")}</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
              {ttsVoices.map(v => {
                const isSelected = ttsVoiceURI === v.voiceURI;
                return (
                  <div
                    key={v.voiceURI}
                    onClick={() => onTtsVoiceChange(v.voiceURI)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`button-tts-voice-${v.voiceURI}`}
                  >
                    <span className={`flex-1 text-xs truncate ${isSelected ? "font-semibold" : ""}`}>{v.name}</span>
                    <button
                      onClick={e => { e.stopPropagation(); previewVoice(v); }}
                      className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-lg border border-current opacity-60 hover:opacity-100 transition-opacity"
                      data-testid={`button-tts-preview-${v.voiceURI}`}
                    >
                      {t("novel.read.ttsVoicePreview")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Page Flip toggle */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-foreground">Flip Halaman</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Geser kiri/kanan seperti buku</p>
          </div>
          <button
            onClick={() => update({ pageFlip: !settings.pageFlip })}
            className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${settings.pageFlip ? "bg-primary" : "bg-muted border border-border"}`}
            data-testid="button-toggle-pageflip"
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.pageFlip ? "left-5" : "left-1"}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Translate Panel ───────────────────────────────────────────────────────────
const TRANSLATE_LANGS = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文 (简体)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

function TranslatePanel({ targetLang, onLangChange, onTranslate, onReset, isTranslating, isTranslated, onClose }: {
  targetLang: string;
  onLangChange: (lang: string) => void;
  onTranslate: () => void;
  onReset: () => void;
  isTranslating: boolean;
  isTranslated: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="fixed bottom-20 right-4 z-50 w-72 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      data-testid="panel-translate"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Languages size={14} className="text-primary" />
          {t("novel.read.translate")}
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid="button-close-translate">
          <X size={15} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">{t("novel.read.translateTo")}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {TRANSLATE_LANGS.map(lang => (
              <button
                key={lang.code}
                onClick={() => onLangChange(lang.code)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left ${
                  targetLang === lang.code
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`button-lang-${lang.code}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {isTranslated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 rounded-xl px-3 py-2">
              <Check size={12} />
              <span>{t("novel.read.translateDone")}</span>
            </div>
            <button
              onClick={onReset}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              data-testid="button-translate-reset"
            >
              <RotateCcw size={14} />
              {t("novel.read.translateReset")}
            </button>
          </div>
        ) : (
          <button
            onClick={onTranslate}
            disabled={isTranslating}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="button-translate-start"
          >
            {isTranslating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("novel.read.translating")}
              </>
            ) : (
              <>
                <Languages size={14} />
                {t("novel.read.translateBtn")}
              </>
            )}
          </button>
        )}

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          {t("novel.read.translateNote")}
        </p>
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
function ReaderHeader({ story, chapter, chapterNum, slug, onTOC, onSettings, settingsOpen, tocOpen, focusMode }: {
  story?: NovelStory;
  chapter?: NovelChapter;
  chapterNum: number;
  slug: string;
  onTOC: () => void;
  onSettings: () => void;
  settingsOpen: boolean;
  tocOpen: boolean;
  focusMode: boolean;
}) {
  return (
    <header className={`fixed top-0.5 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50 transition-all duration-300 ${focusMode ? "-translate-y-full opacity-0 pointer-events-none" : ""}`}>
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

// ── Text-to-Speech Hook ────────────────────────────────────────────────────────
function useAvailableVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => {
      const all = window.speechSynthesis.getVoices();
      // Show Indonesian voices first, fall back to ALL voices so the list is never empty
      const idVoices = all.filter(v => v.lang.startsWith("id"));
      setVoices(idVoices.length > 0 ? idVoices : all);
    };
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  return voices;
}

function useTTS(preferredVoiceURI = "") {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalCancelRef = useRef(false);
  const charIndexRef = useRef(0);
  const textOffsetRef = useRef(0);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const getAbsoluteCharIndex = useCallback(() => {
    return textOffsetRef.current + charIndexRef.current;
  }, []);

  const stop = useCallback(() => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    if (supported) { intentionalCancelRef.current = false; window.speechSynthesis.cancel(); }
    charIndexRef.current = 0;
    textOffsetRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
  }, [supported]);

  const speak = useCallback((text: string, speechRate: number, startOffset = 0) => {
    if (!supported || !text.trim()) return;
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    intentionalCancelRef.current = true;
    window.speechSynthesis.cancel();

    charIndexRef.current = 0;
    textOffsetRef.current = startOffset;
    const utteranceText = startOffset > 0 ? text.slice(startOffset) : text;

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.lang = "id-ID";
    utterance.rate = Math.max(0.5, Math.min(2.0, speechRate));

    const pickVoice = (voices: SpeechSynthesisVoice[]) => {
      if (preferredVoiceURI) {
        const preferred = voices.find(v => v.voiceURI === preferredVoiceURI);
        if (preferred) return preferred;
      }
      const idVoices = voices.filter(v => v.lang.startsWith("id"));
      // FIX: fall back to any available voice instead of returning null
      if (idVoices.length === 0) return voices[0] ?? null;
      const femaleKeywords = ["damayanti", "female", "wanita", "perempuan", "woman", "girl", "siti", "sri"];
      const maleKeywords = ["male", "laki", "pria", "man", "boy"];
      const maleVoice = idVoices.find(v => {
        const name = v.name.toLowerCase();
        const hasFemaleMark = femaleKeywords.some(k => name.includes(k));
        const hasMaleMark   = maleKeywords.some(k => name.includes(k));
        return hasMaleMark || !hasFemaleMark;
      });
      return maleVoice || idVoices[0];
    };

    utterance.onstart = () => { intentionalCancelRef.current = false; };
    utterance.onboundary = (e) => { if (e.name === "word") charIndexRef.current = e.charIndex; };
    utterance.onend = () => {
      if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      charIndexRef.current = 0;
      textOffsetRef.current = 0;
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = (e) => {
      if (intentionalCancelRef.current) return;
      if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
      if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      setIsPlaying(false);
      setIsPaused(false);
    };

    // FIX: startSpeaking is called AFTER voice is assigned — critical for mobile
    const startSpeaking = (voices: SpeechSynthesisVoice[]) => {
      const picked = pickVoice(voices);
      if (picked) utterance.voice = picked;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
      // Keep-alive: prevent auto-stop on Chrome desktop AND mobile browsers
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 14000);
    };

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices.length > 0) {
      // Desktop: voices already available — speak immediately
      startSpeaking(currentVoices);
    } else {
      // Mobile: voices load async — MUST wait before calling speak()
      // Calling speak() before voices are set causes silent failure on mobile
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        startSpeaking(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    }
  }, [supported, preferredVoiceURI]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [supported]);

  useEffect(() => () => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { isPlaying, isPaused, supported, rate, setRate, speak, pause, resume, stop, getAbsoluteCharIndex };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NovelRead() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, params] = useRoute("/:slug/:seasonSlug/:chapterSlug");
  const slug = params?.slug ?? "";
  const seasonNum = Number(params?.seasonSlug?.replace("season-", "") ?? 1);
  const chapterNum = Number(params?.chapterSlug?.replace("bab-", "") ?? 1);

  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { settings, update } = useReadingSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusHint, setFocusHint] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const restoredRef = useRef(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteCardOpen, setQuoteCardOpen] = useState(false);
  const quoteCanvasRef = useRef<HTMLCanvasElement>(null);

  // Page flip state
  const [flipPages, setFlipPages] = useState<string[]>([]);
  const [flipPage, setFlipPage] = useState(0);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const lastTapRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Translate state
  const [translateOpen, setTranslateOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translateLang, setTranslateLang] = useState("en");
  const [unlockError, setUnlockError] = useState("");
  const [showTopup, setShowTopup] = useState(false);
  const [ttsVoiceURI, setTtsVoiceURI] = useState(() => localStorage.getItem("tts-voice") || "");
  const availableVoices = useAvailableVoices();
  const tts = useTTS(ttsVoiceURI);
  const [ttsText, setTtsText] = useState("");

  const handleTtsVoiceChange = (uri: string) => {
    setTtsVoiceURI(uri);
    localStorage.setItem("tts-voice", uri);
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

  const isLocked = !!(chapter as any)?.isLocked;
  const coinPrice = (chapter as any)?.coinPrice as number | undefined;

  const { data: coinData } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    queryFn: () => fetch("/api/coins/balance", { credentials: "include" }).then(r => r.json()),
    enabled: isLocked && !!user && !user.isAdmin,
  });
  const coinBalance = coinData?.coins ?? 0;

  const unlockMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/coins/unlock", { chapterId: chapter?.id }),
    onSuccess: () => {
      setUnlockError("");
      queryClient.invalidateQueries({ queryKey: ["/api/novel/read", slug, seasonNum, chapterNum] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
    },
    onError: (err: any) => setUnlockError(err?.message ?? "Gagal membuka chapter"),
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

  // Track server-side read history (upsert — 1 record per story, no DB bloat)
  useEffect(() => {
    if (!chapter?.id || !story?.id || !user) return;
    const key = `novel-history-synced-${story.id}-${chapter.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/user/read-history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        storyId:      story.id,
        storySlug:    slug,
        storyTitle:   story.title,
        coverUrl:     story.coverUrl ?? null,
        seasonNum,
        chapterNum,
        chapterSlug:  `bab-${chapterNum}`,
        chapterTitle: chapter.title,
      }),
    }).catch(() => {});
  }, [chapter?.id, story?.id, user]);

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

    // Save immediately on chapter load so Lanjut Baca works even without scrolling
    const saveProgress = (scrollY = window.scrollY) => {
      try {
        localStorage.setItem(`novel-progress-${slug}`, JSON.stringify({
          seasonNum, chapterNum,
          chapterTitle: chapter.title,
          scrollY,
          updatedAt: new Date().toISOString(),
        }));
      } catch {}
    };

    saveProgress();

    // Also update on scroll to track position
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveProgress(window.scrollY), 800);
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

  // Keyboard navigation (← prev, → next, F focus mode)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevChapter) {
        navigate(`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        navigate(`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`);
      } else if (e.key === "f" || e.key === "F" || e.key === "Escape") {
        if (e.key === "Escape" && !focusMode) return;
        setFocusMode(prev => {
          const next = e.key === "Escape" ? false : !prev;
          if (next) { setFocusHint(true); setTimeout(() => setFocusHint(false), 2000); }
          return next;
        });
        setSettingsOpen(false);
        setTocOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevChapter, nextChapter, slug, seasonNum, navigate, focusMode]);

  // TTS: rebuild plain text when chapter or translation changes
  useEffect(() => {
    if (!chapter?.content) { setTtsText(""); return; }
    const div = document.createElement("div");
    div.innerHTML = translatedContent ?? renderRichContent(chapter.content);
    const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
    setTtsText((chapter.title ? chapter.title + ". " : "") + text);
  }, [chapter?.content, chapter?.title, translatedContent]);

  // TTS: stop when navigating to a different chapter
  useEffect(() => {
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, [slug, seasonNum, chapterNum]);

  const handleTTSToggle = () => {
    if (!tts.isPlaying) tts.speak(ttsText, tts.rate);
    else if (tts.isPaused) tts.resume();
    else tts.pause();
  };

  const handleTTSRate = (delta: number) => {
    const newRate = Math.max(0.5, Math.min(2.0, parseFloat((tts.rate + delta).toFixed(2))));
    tts.setRate(newRate);
    if (tts.isPlaying) {
      const offset = tts.getAbsoluteCharIndex();
      tts.speak(ttsText, newRate, offset);
    }
  };

  // Double-tap (mobile) + double-click (desktop) to exit focus mode
  useEffect(() => {
    if (!focusMode) return;
    const handleTouch = () => {
      const now = Date.now();
      if (now - lastTapRef.current < 350) setFocusMode(false);
      lastTapRef.current = now;
    };
    const handleDblClick = () => setFocusMode(false);
    document.addEventListener("touchstart", handleTouch, { passive: true });
    document.addEventListener("dblclick", handleDblClick);
    return () => {
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("dblclick", handleDblClick);
    };
  }, [focusMode]);

  // Build pages for page flip mode
  const buildFlipPages = useCallback(() => {
    if (!chapter?.content) return;
    const html = renderRichContent(chapter.content);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blocks = Array.from(doc.body.children);
    if (!blocks.length) { setFlipPages([html]); setFlipPage(0); return; }

    const measurer = document.createElement("div");
    measurer.style.cssText = [
      "position:fixed", "top:-9999px", "left:0",
      `width:${Math.min(640, window.innerWidth) - 40}px`,
      `font-size:${settings.fontSize}px`,
      "line-height:2", "visibility:hidden", "pointer-events:none",
      `font-family:${FONT_FAMILY_VALUE[settings.fontFamily]}`,
    ].join(";");
    blocks.forEach(b => measurer.appendChild(b.cloneNode(true)));
    document.body.appendChild(measurer);

    const AVAIL_H = window.innerHeight - 145;
    const pages: string[] = [];
    let pageHtml = "";
    let pageH = 0;
    Array.from(measurer.children).forEach((el, i) => {
      const h = (el as HTMLElement).offsetHeight + 40;
      if (pageH + h > AVAIL_H && pageHtml) {
        pages.push(pageHtml);
        pageHtml = blocks[i].outerHTML;
        pageH = h;
      } else {
        pageHtml += blocks[i].outerHTML;
        pageH += h;
      }
    });
    if (pageHtml) pages.push(pageHtml);
    document.body.removeChild(measurer);
    setFlipPages(pages.length > 0 ? pages : [html]);
    setFlipPage(0);
  }, [chapter?.content, settings.fontSize, settings.fontFamily]);

  useEffect(() => {
    if (settings.pageFlip) buildFlipPages();
    else { setFlipPages([]); setFlipPage(0); }
  }, [settings.pageFlip, buildFlipPages]);

  // Page flip swipe handlers
  const handleFlipTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleFlipTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 45 || Math.abs(dy) > Math.abs(dx) * 0.75) return;
    if (dx < 0 && flipPage < flipPages.length - 1) {
      setFlipDir("next"); setFlipPage(p => p + 1);
    } else if (dx > 0 && flipPage > 0) {
      setFlipDir("prev"); setFlipPage(p => p - 1);
    } else if (dx < 0 && nextChapter) {
      navigate(`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`);
    } else if (dx > 0 && prevChapter) {
      navigate(`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  // Reset translated content when chapter changes
  useEffect(() => {
    setTranslatedContent(null);
    setTranslatedTitle(null);
    setTranslateOpen(false);
  }, [slug, seasonNum, chapterNum]);

  // Safely set element text with \n → <br>, without HTML injection risk
  const setNodeText = (el: Element, text: string) => {
    el.innerHTML = "";
    text.split("\n").forEach((part, i) => {
      if (i > 0) el.appendChild(document.createElement("br"));
      if (part) el.appendChild(document.createTextNode(part));
    });
  };

  const handleTranslate = async () => {
    if (!chapter?.content) return;
    setIsTranslating(true);
    try {
      const parser = new DOMParser();
      const html = renderRichContent(chapter.content);
      const doc = parser.parseFromString(html, "text/html");

      // Collect ALL text nodes grouped by their closest block ancestor
      // Using a Map so every text node — even non-consecutive ones — reaches the right group
      const BLOCK_TAGS = new Set(["P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE","TD","TH","DT","DD","DIV"]);

      type NodeGroup = { blockEl: Element; textNodes: Text[]; text: string };
      const groupMap = new Map<Element, NodeGroup>();
      const groupOrder: NodeGroup[] = [];   // preserves document order

      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        if (!textNode.data.trim()) continue;

        // Walk up to the closest block-level ancestor
        let ancestor: Element | null = textNode.parentElement;
        while (ancestor && ancestor !== doc.body && !BLOCK_TAGS.has(ancestor.tagName)) {
          ancestor = ancestor.parentElement;
        }
        const blockEl: Element = (ancestor && ancestor !== doc.body)
          ? ancestor
          : (textNode.parentElement ?? doc.body);

        let g = groupMap.get(blockEl);
        if (!g) {
          g = { blockEl, textNodes: [], text: "" };
          groupMap.set(blockEl, g);
          groupOrder.push(g);
        }
        g.textNodes.push(textNode);
      }

      // Build final text per group (concat all text nodes)
      const finalGroups: NodeGroup[] = [];
      for (const g of groupOrder) {
        const text = g.textNodes.map(t => t.data).join("").replace(/\n/g, " ").trim();
        if (text) finalGroups.push({ ...g, text });
      }

      // First segment = chapter title, rest = content blocks
      const allSegments = [chapter.title.trim(), ...finalGroups.map(g => g.text)];

      // Single request — server handles concurrency internally
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: allSegments, from: "auto", to: translateLang }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json() as { segments: string[] };
      const allTranslated = data.segments;

      // Apply title
      if (allTranslated[0]) setTranslatedTitle(allTranslated[0]);

      // Apply content: replace each block's text nodes with translated text
      finalGroups.forEach((g, i) => {
        const translated = allTranslated[i + 1];
        if (!translated) return;

        if (g.textNodes.length === 1) {
          // Single text node — just update it directly
          g.textNodes[0].data = translated;
        } else {
          // Multiple text nodes in block — put all translated text in first, clear rest
          g.textNodes[0].data = translated;
          for (let j = 1; j < g.textNodes.length; j++) g.textNodes[j].data = "";
        }
      });

      setTranslatedContent(doc.body.innerHTML);
    } catch (err) {
      console.error("Translate error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleResetTranslate = () => {
    setTranslatedContent(null);
    setTranslatedTitle(null);
  };

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
  const fontClass   = FONT_CLASS_MAP[settings.fontFamily];
  const fontFamilyOverride: React.CSSProperties = settings.fontFamily === "georgia"
    ? { fontFamily: "Georgia, 'Times New Roman', serif" } : {};
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
        title={`${chapter.title} — ${story?.title ?? slug} | WOOCE Novel`}
        description={`Baca Bab ${chapter.chapterNumber}: ${chapter.title} dari novel ${story?.title ?? slug} di WOOCE Novel. Baca gratis online tanpa aplikasi tambahan.`}
        keywords={`${story?.title ?? slug}, bab ${chapter.chapterNumber}, ${chapter.title}, baca gratis, WOOCE Novel`}
        url={`/${slug}/season-${seasonNum}/bab-${chapterNum}`}
        image={story?.coverUrl ?? undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": chapter.title,
          "name": `${chapter.title} — ${story?.title ?? slug}`,
          "description": `Baca Bab ${chapter.chapterNumber}: ${chapter.title} dari novel ${story?.title ?? slug} di WOOCE Novel.`,
          "url": `https://www.woocenovel.my.id/${slug}/season-${seasonNum}/bab-${chapterNum}`,
          "inLanguage": "id",
          "isPartOf": {
            "@type": "Book",
            "name": story?.title ?? slug,
            "url": `https://www.woocenovel.my.id/${slug}`
          },
          "publisher": {
            "@type": "Organization",
            "name": "WOOCE Novel",
            "url": "https://www.woocenovel.my.id"
          }
        }}
      />

      {/* Reading progress bar — hidden in page flip mode */}
      {!(settings.pageFlip && flipPages.length > 0) && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border/20">
          <div
            className="h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${scrollPercent}%` }}
            data-testid="bar-reading-progress"
          />
        </div>
      )}

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
        focusMode={focusMode || (settings.pageFlip && flipPages.length > 0)}
      />

      {/* ── Page Flip Overlay ─────────────────────────────────────────────── */}
      {settings.pageFlip && flipPages.length > 0 && chapter && (
        <div
          className="fixed inset-0 z-30 flex flex-col select-none"
          style={{
            background: modeStyle.bg !== "transparent" ? modeStyle.bg : "hsl(var(--background))",
            color: modeStyle.text !== "inherit" ? modeStyle.text : "hsl(var(--foreground))",
          }}
        >
          {/* Minimal top bar */}
          <div
            className="h-10 flex items-center justify-between px-4 flex-shrink-0 border-b border-border/30"
            style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
          >
            <Link href={`/${slug}`}>
              <button className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" data-testid="button-flip-back">
                <ArrowLeft size={16} />
              </button>
            </Link>
            <span className="text-xs text-muted-foreground text-center flex-1 px-2 truncate">
              {chapter.title}
              <span className="font-mono opacity-50 ml-1">({flipPage + 1}/{flipPages.length})</span>
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => { setTocOpen(v => !v); setSettingsOpen(false); }}
                className={`p-1 rounded-lg transition-colors ${tocOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-flip-toc"
                title="Daftar Bab"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => { setSettingsOpen(v => !v); setTocOpen(false); }}
                className={`p-1 rounded-lg transition-colors ${settingsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-flip-settings"
                title="Pengaturan Baca"
              >
                <Settings2 size={16} />
              </button>
            </div>
          </div>

          {/* Page content with swipe */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={flipPage}
              initial={{ opacity: 0, x: flipDir === "next" ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: flipDir === "next" ? -50 : 50 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex-1 overflow-hidden px-5 sm:px-8 py-5 prose prose-gray max-w-none
                prose-p:leading-[2] prose-headings:font-bold
                prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
                prose-ul:my-2 prose-ol:my-2 prose-strong:font-bold prose-em:italic
                prose-p:my-4 ${proseInvert} ${fontClass}`}
              style={{
                fontSize: `${settings.fontSize}px`,
                color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
                ...proseColorVars, ...fontFamilyOverride, maxWidth: "none",
              }}
              dangerouslySetInnerHTML={{ __html: flipPages[flipPage] ?? "" }}
              onTouchStart={handleFlipTouchStart}
              onTouchEnd={handleFlipTouchEnd}
              data-testid="text-flip-page"
            />
          </AnimatePresence>

          {/* Bottom nav bar */}
          <div
            className="h-14 flex items-center justify-between px-3 flex-shrink-0 border-t border-border/30 gap-2"
            style={{ borderColor: modeStyle.border !== "transparent" ? modeStyle.border : undefined }}
          >
            <button
              onClick={() => {
                if (flipPage > 0) { setFlipDir("prev"); setFlipPage(p => p - 1); }
                else if (prevChapter) navigate(`/${slug}/season-${seasonNum}/bab-${prevChapter.chapterNumber}`);
              }}
              disabled={flipPage === 0 && !prevChapter}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              data-testid="button-flip-prev"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Page dots */}
            <div className="flex items-center gap-1 flex-1 justify-center overflow-hidden">
              {(() => {
                const total = flipPages.length;
                const maxDots = 9;
                const visible = Math.min(total, maxDots);
                const half = Math.floor(maxDots / 2);
                const start = Math.max(0, Math.min(flipPage - half, total - visible));
                return Array.from({ length: visible }, (_, i) => {
                  const idx = start + i;
                  return (
                    <div
                      key={idx}
                      onClick={() => { setFlipDir(idx > flipPage ? "next" : "prev"); setFlipPage(idx); }}
                      className={`rounded-full cursor-pointer transition-all ${idx === flipPage ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                    />
                  );
                });
              })()}
            </div>

            <button
              onClick={() => {
                if (flipPage < flipPages.length - 1) { setFlipDir("next"); setFlipPage(p => p + 1); }
                else if (nextChapter) navigate(`/${slug}/season-${seasonNum}/bab-${nextChapter.chapterNumber}`);
              }}
              disabled={flipPage === flipPages.length - 1 && !nextChapter}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              data-testid="button-flip-next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

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
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined, ...fontFamilyOverride }}
                  data-testid="text-chapter-title"
                >
                  {t("novel.read.chapterOf")} {chapter.chapterNumber}: {translatedTitle ?? chapter.title}
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

        {/* Chapter content — or lock screen */}
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="section-chapter-locked"
          >
            {/* ── Spoiler preview with fade-out ── */}
            {(chapter as any)?.previewContent ? (
              <div className="relative">
                <div
                  className={`prose prose-gray max-w-none
                    prose-p:leading-[2] prose-headings:font-bold
                    prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
                    prose-ul:my-2 prose-ol:my-2 prose-strong:font-bold prose-em:italic
                    prose-p:my-5 prose-hr:my-10 ${proseInvert} ${fontClass}
                    select-none pointer-events-none`}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    color: modeStyle.text !== "inherit" ? modeStyle.text : undefined,
                    ...proseColorVars,
                    ...fontFamilyOverride,
                    maxHeight: "340px",
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderRichContent((chapter as any).previewContent) }}
                />
                {/* Gradient fade-out */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${
                      settings.mode === "night" ? "#0f1117" :
                      settings.mode === "sepia" ? "#faf3e8" :
                      "var(--background)"
                    })`,
                  }}
                />
              </div>
            ) : null}

            {/* ── Lock wall ── */}
            <div className="text-center pt-6 pb-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={26} className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">
                {(chapter as any)?.previewContent ? "Penasaran? Lanjutkan dengan koin." : "Chapter Premium"}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">Bab ini dikunci dan hanya bisa dibuka dengan koin.</p>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-sm px-3 py-1.5 rounded-full mb-6 mt-2">
                <Coins size={14} />
                {coinPrice} koin
              </div>

              {user && !user.isAdmin ? (
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <Coins size={13} className="text-amber-500" />
                    Saldo kamu: <span className="font-bold text-foreground ml-0.5">{coinBalance} koin</span>
                  </div>
                  <button
                    onClick={() => unlockMut.mutate()}
                    disabled={unlockMut.isPending || coinBalance < (coinPrice ?? 0)}
                    className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    data-testid="button-unlock-chapter"
                  >
                    {unlockMut.isPending ? (
                      <><Loader2 size={15} className="animate-spin" /> Membuka...</>
                    ) : (
                      <><LockOpen size={15} /> Buka dengan {coinPrice} Koin</>
                    )}
                  </button>
                  {coinBalance < (coinPrice ?? 0) && (
                    <>
                      <p className="text-xs text-muted-foreground">Koinmu tidak cukup untuk membuka chapter ini.</p>
                      <button
                        onClick={() => setShowTopup(true)}
                        className="w-full py-2.5 px-6 rounded-xl border-2 border-amber-500 text-amber-600 dark:text-amber-400 font-semibold text-sm transition-all hover:bg-amber-500/8 flex items-center justify-center gap-2"
                        data-testid="button-buy-coins-lockscreen"
                      >
                        <ShoppingBag size={14} /> Beli Koin
                      </button>
                    </>
                  )}
                  {unlockError && (
                    <p className="text-xs text-red-500 mt-1">{unlockError}</p>
                  )}
                </div>
              ) : (
                <div className="max-w-xs mx-auto space-y-3">
                  <p className="text-sm text-muted-foreground">Login terlebih dahulu untuk membuka chapter ini.</p>
                  <a
                    href="/auth/google"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                    data-testid="button-login-to-unlock"
                  >
                    Login untuk Buka Chapter
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
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
              ...fontFamilyOverride,
            }}
            data-testid="text-chapter-content"
            dangerouslySetInnerHTML={{ __html: translatedContent || renderRichContent(chapter.content) }}
          />
        )}

        {/* End of chapter divider — hidden when locked */}
        {!isLocked && <div className="flex items-center gap-4 my-16">
          <div className="flex-1 h-px" style={{ background: modeStyle.border !== "transparent" ? modeStyle.border : "hsl(var(--border))" }} />
          <span className="text-xs text-muted-foreground px-3">— {t("novel.read.finished")} —</span>
          <div className="flex-1 h-px" style={{ background: modeStyle.border !== "transparent" ? modeStyle.border : "hsl(var(--border))" }} />
        </div>}

        {/* Donation section — hidden when locked */}
        {!isLocked && <>{/* Donation section */}
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
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined, ...fontFamilyOverride }}
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
                  style={{ color: modeStyle.text !== "inherit" ? modeStyle.text : undefined, ...fontFamilyOverride }}
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
        </>}
      </main>

      {/* TTS Control Bar */}
      <AnimatePresence>
        {tts.isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 16, x: "-50%" }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", bottom: 16, left: "50%", zIndex: 50 }}
            className="flex items-center gap-1.5 bg-background border border-border rounded-full shadow-xl px-3 py-2"
            data-testid="bar-tts-controls"
          >
            <button
              onClick={tts.stop}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
              data-testid="button-tts-stop"
              title={t("novel.read.ttsStop")}
            >
              <VolumeX size={14} />
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => handleTTSRate(-0.25)}
              className="w-6 h-6 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold transition-colors"
              data-testid="button-tts-slower"
              title="-0.25x"
            >−</button>
            <button
              onClick={handleTTSToggle}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
              data-testid="button-tts-playpause"
              title={tts.isPaused ? t("novel.read.ttsResume") : t("novel.read.ttsPause")}
            >
              {tts.isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
            <button
              onClick={() => handleTTSRate(0.25)}
              className="w-6 h-6 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold transition-colors"
              data-testid="button-tts-faster"
              title="+0.25x"
            >+</button>
            <div className="w-px h-4 bg-border" />
            <span className="text-xs text-muted-foreground font-mono min-w-[34px] text-center select-none">
              {tts.rate.toFixed(2)}x
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus mode hint */}
      <AnimatePresence>
        {focusHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none"
          >
            Mode Fokus aktif — <span className="font-medium">2x ketuk</span> atau tekan <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded mx-0.5">F</kbd> / <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded mx-0.5">Esc</kbd> untuk keluar
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action buttons — collapsible */}
      <div className={`fixed bottom-16 right-4 z-50 flex flex-col items-center gap-2 transition-all duration-300 ${focusMode ? "opacity-0 pointer-events-none translate-y-4" : ""}`}>
        <AnimatePresence>
          {fabOpen && (
            <>
              {quoteText && !quoteCardOpen && (
                <motion.button
                  key="quote-btn"
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => { setQuoteCardOpen(true); setFabOpen(false); }}
                  className="w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  data-testid="button-open-quote-card"
                  title="Buat kartu kutipan"
                >
                  <Quote size={15} />
                </motion.button>
              )}
              {tts.supported && (
                <motion.button
                  key="tts"
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.85 }}
                  transition={{ duration: 0.15, delay: 0.015 }}
                  onClick={() => { handleTTSToggle(); setFabOpen(false); }}
                  className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${tts.isPlaying ? "bg-primary text-primary-foreground border border-primary" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}
                  data-testid="button-tts-toggle"
                  title={t("novel.read.tts")}
                >
                  {tts.isPlaying && !tts.isPaused ? <Pause size={15} /> : <Volume2 size={15} />}
                </motion.button>
              )}
              <motion.button
                key="translate"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.02 }}
                onClick={() => { setTranslateOpen(v => !v); setSettingsOpen(false); setTocOpen(false); setFabOpen(false); }}
                className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${translateOpen || translatedContent ? "bg-primary text-primary-foreground border border-primary" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}
                data-testid="button-translate"
                title="Terjemahkan"
              >
                {isTranslating ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />}
              </motion.button>
              <motion.button
                key="copy-link"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.04 }}
                onClick={() => { handleCopyLink(); setFabOpen(false); }}
                className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
                data-testid="button-copy-link"
                title="Salin link chapter"
              >
                {linkCopied ? <Check size={15} className="text-green-500" /> : <Link2 size={15} />}
              </motion.button>
              <motion.button
                key="share"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.06 }}
                onClick={() => { handleShare(chapter.title, story?.title); setFabOpen(false); }}
                className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
                data-testid="button-share-chapter"
                title={t("novel.share")}
              >
                {shareCopied ? <Check size={15} className="text-green-500" /> : <Share2 size={15} />}
              </motion.button>
              <motion.button
                key="focus"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.08 }}
                onClick={() => { setFocusMode(true); setFocusHint(true); setTimeout(() => setFocusHint(false), 2000); setSettingsOpen(false); setTocOpen(false); setFabOpen(false); }}
                className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-foreground"
                data-testid="button-focus-mode"
                title="Mode Fokus (F)"
              >
                <Maximize2 size={15} />
              </motion.button>
              <motion.button
                key="report"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.1 }}
                onClick={() => { setReportOpen(true); setReportSuccess(false); setReportReason(""); setReportDetails(""); setReportError(""); setFabOpen(false); }}
                className="w-10 h-10 rounded-full bg-background border border-border text-muted-foreground shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:text-red-500"
                data-testid="button-report-content"
                title="Laporkan Konten"
              >
                <Flag size={15} />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <button
          onClick={() => { setFabOpen(v => !v); setSettingsOpen(false); setTocOpen(false); }}
          className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${fabOpen ? "bg-foreground text-background" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}
          data-testid="button-fab-toggle"
          title={fabOpen ? "Tutup" : "Aksi lainnya"}
        >
          {fabOpen ? <X size={15} /> : <EllipsisVertical size={15} />}
        </button>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReportOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Flag size={15} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Laporkan Konten</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Bantu kami menjaga kualitas platform</p>
                  </div>
                </div>
                <button onClick={() => setReportOpen(false)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                  <X size={15} />
                </button>
              </div>

              {reportSuccess ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-green-500" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">Laporan Terkirim</p>
                  <p className="text-sm text-muted-foreground">Tim admin akan meninjau laporan ini. Terima kasih.</p>
                  <button onClick={() => setReportOpen(false)} className="mt-6 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="px-5 py-5 space-y-4">
                  {reportError && (
                    <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
                      {reportError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">Alasan Laporan <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "plagiarism",    label: "Plagiarisme" },
                        { value: "adult_content", label: "Konten Dewasa Tanpa Label" },
                        { value: "hate_speech",   label: "Ujaran Kebencian" },
                        { value: "violence",      label: "Kekerasan Ekstrem" },
                        { value: "spam",          label: "Spam / Tidak Relevan" },
                        { value: "other",         label: "Lainnya" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setReportReason(opt.value)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            reportReason === opt.value
                              ? "border-red-500/50 bg-red-500/8 text-red-600 dark:text-red-400"
                              : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">Detail Tambahan <span className="text-muted-foreground font-normal">(opsional)</span></label>
                    <textarea
                      value={reportDetails}
                      onChange={e => setReportDetails(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Jelaskan lebih lanjut jika perlu..."
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <button
                    disabled={!reportReason || reportSubmitting}
                    onClick={async () => {
                      if (!reportReason || !story?.slug || reportSubmitting) return;
                      setReportSubmitting(true);
                      try {
                        const res = await fetch("/api/reports", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ storySlug: story.slug, reason: reportReason, details: reportDetails }),
                        });
                        if (res.ok) {
                          setReportSuccess(true);
                        } else {
                          const data = await res.json();
                          if (res.status === 409) setReportError("Kamu sudah pernah melaporkan cerita ini sebelumnya.");
                          else if (res.status === 429) setReportError(data.message || "Batas laporan hari ini tercapai (maks. 2 per hari).");
                          else setReportSuccess(true);
                        }
                      } catch {}
                      setReportSubmitting(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {reportSubmitting ? "Mengirim..." : "Kirim Laporan"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Translate Panel */}
      <AnimatePresence>
        {translateOpen && (
          <TranslatePanel
            targetLang={translateLang}
            onLangChange={lang => { setTranslateLang(lang); setTranslatedContent(null); setTranslatedTitle(null); }}
            onTranslate={handleTranslate}
            onReset={handleResetTranslate}
            isTranslating={isTranslating}
            isTranslated={!!translatedContent}
            onClose={() => setTranslateOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            update={update}
            onClose={() => setSettingsOpen(false)}
            ttsVoices={availableVoices}
            ttsVoiceURI={ttsVoiceURI}
            onTtsVoiceChange={handleTtsVoiceChange}
          />
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

      {showTopup && (
        <AnimatePresence>
          <TopupModal
            onClose={() => setShowTopup(false)}
            onSuccess={() => {
              setShowTopup(false);
              queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
            }}
          />
        </AnimatePresence>
      )}
    </div>
  );
}
