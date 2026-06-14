import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { Info, AlertTriangle, CheckCircle2, Megaphone } from "lucide-react";
import type { Announcement } from "@shared/schema";

const TYPE_CONFIG = {
  info: {
    badge: "bg-blue-500",
    track: "bg-blue-500/8 border-blue-400/25",
    text: "text-blue-600 dark:text-blue-300",
    icon: Info,
    label: "Info",
  },
  warning: {
    badge: "bg-yellow-400",
    track: "bg-yellow-400/10 border-yellow-300/30",
    text: "text-yellow-700 dark:text-yellow-300",
    icon: AlertTriangle,
    label: "Peringatan",
  },
  success: {
    badge: "bg-emerald-500",
    track: "bg-emerald-500/8 border-emerald-400/25",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
    label: "Pembaruan",
  },
};

const STATIC_DISPLAY_DURATION = 6000;
const FADE_DURATION = 400;
const SCROLL_PAUSE_MS = 1500; // diam sebentar sebelum mulai gerak
const CHARS_PER_SECOND = 10; // kecepatan scroll: karakter per detik

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ann = visible[index] ?? visible[0];
  const cfg = TYPE_CONFIG[(ann?.type as keyof typeof TYPE_CONFIG)] ?? TYPE_CONFIG.info;

  const goNext = useCallback(() => {
    if (visible.length <= 1) return;
    setFading(true);
    setIsScrolling(false);
    setTimeout(() => {
      setIndex(prev => (prev + 1) % visible.length);
      setFading(false);
    }, FADE_DURATION);
  }, [visible.length]);

  // Cek apakah teks melebihi lebar container (perlu scroll)
  useEffect(() => {
    const check = () => {
      if (textRef.current && containerRef.current) {
        const overflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setNeedsScroll(overflow);
      }
    };
    // Tunggu sedikit agar render selesai
    const t = setTimeout(check, 50);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", check);
    };
  }, [ann?.message]);

  // Reset state saat announcement berganti
  useEffect(() => {
    setIsScrolling(false);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [index]);

  // Mode scroll: mulai gerak setelah jeda
  useEffect(() => {
    if (!needsScroll) return;
    setIsScrolling(false);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(true);
    }, SCROLL_PAUSE_MS);
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [needsScroll, index]);

  // Mode statis: auto-rotate pakai interval
  useEffect(() => {
    if (needsScroll || visible.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goNext, STATIC_DISPLAY_DURATION);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [needsScroll, visible.length, goNext]);

  const handleTransitionEnd = useCallback(() => {
    if (!needsScroll) return;
    // Teks selesai scroll → ganti ke announcement berikutnya
    goNext();
  }, [needsScroll, goNext]);

  if (!visible.length) return null;

  const scrollDuration = ann
    ? Math.max(3, ann.message.length / CHARS_PER_SECOND)
    : 5;

  const textStyle: React.CSSProperties = needsScroll
    ? {
        display: "inline-block",
        transform: isScrolling ? "translateX(-105%)" : "translateX(0%)",
        transition: isScrolling
          ? `transform ${scrollDuration}s linear`
          : "none",
        willChange: "transform",
      }
    : {};

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-3">
      <div
        className={`flex items-stretch rounded-xl border overflow-hidden transition-colors duration-500 ${cfg.track}`}
        data-testid="announcement-banner"
      >
        {/* Badge kiri — berubah warna & label sesuai tipe */}
        <div className={`flex items-center gap-1.5 px-3 py-2 shrink-0 transition-colors duration-500 ${cfg.badge}`}>
          <Megaphone size={11} className="text-white shrink-0" />
          <span className="text-[10px] font-black tracking-wider text-white leading-none">
            {cfg.label}
          </span>
        </div>

        {/* Garis pembatas */}
        <div className="w-px bg-border/20 shrink-0" />

        {/* Area teks — overflow hidden untuk marquee */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center min-w-0 px-4 py-2 overflow-hidden"
        >
          <div
            className={`w-full`}
            style={{
              opacity: fading ? 0 : 1,
              transition: `opacity ${FADE_DURATION}ms ease`,
              overflow: "hidden",
            }}
          >
            <span
              ref={textRef}
              className={`text-[11.5px] font-medium ${cfg.text} whitespace-nowrap`}
              style={textStyle}
              onTransitionEnd={handleTransitionEnd}
            >
              {ann?.message}
              {ann?.link && (
                <a
                  href={ann.link}
                  target={ann.link.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className={`ml-2 text-[11px] font-semibold underline underline-offset-2 ${cfg.text} opacity-75 hover:opacity-100 transition-opacity`}
                >
                  {ann.linkText ?? "Selengkapnya →"}
                </a>
              )}
            </span>
          </div>
        </div>

        {/* Indikator titik (jika lebih dari 1 announcement) */}
        {visible.length > 1 && (
          <div className="flex items-center gap-1 pr-3 shrink-0">
            {visible.map((_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-300 ${
                  i === index
                    ? `w-2 h-2 ${cfg.badge} opacity-80`
                    : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
