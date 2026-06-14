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

const STATIC_DISPLAY_MS = 6000;
const FADE_MS = 400;
const SCROLL_PAUSE_MS = 1200;
const CHARS_PER_SECOND = 8;

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ann = visible[index] ?? visible[0];
  const cfg = TYPE_CONFIG[(ann?.type as keyof typeof TYPE_CONFIG)] ?? TYPE_CONFIG.info;

  const goNext = useCallback(() => {
    if (visible.length <= 1) return;
    setFading(true);
    setIsScrolling(false);
    setTimeout(() => {
      setIndex(prev => (prev + 1) % visible.length);
      setFading(false);
    }, FADE_MS);
  }, [visible.length]);

  // Efek tunggal — menangani semua lifecycle timer/scroll per announcement
  useEffect(() => {
    if (!visible.length || !ann) return;

    setIsScrolling(false);

    // Tunggu render selesai, lalu ukur overflow
    const measureTimer = setTimeout(() => {
      const overflows =
        !!textRef.current &&
        !!containerRef.current &&
        textRef.current.scrollWidth > containerRef.current.clientWidth;

      let cleanup = () => {};

      if (overflows) {
        // Mode scroll: diam sebentar lalu geser teks ke kiri
        const pauseTimer = setTimeout(() => setIsScrolling(true), SCROLL_PAUSE_MS);
        cleanup = () => clearTimeout(pauseTimer);
      } else {
        // Mode statis: ganti otomatis tiap STATIC_DISPLAY_MS
        if (visible.length <= 1) return;
        const interval = setInterval(goNext, STATIC_DISPLAY_MS);
        cleanup = () => clearInterval(interval);
      }

      // Simpan cleanup ke ref agar bisa dipanggil dari return
      cleanupRef.current = cleanup;
    }, 80);

    return () => {
      clearTimeout(measureTimer);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ann?.message, visible.length, goNext]);

  const cleanupRef = useRef<(() => void) | null>(null);

  // Saat teks selesai scroll → ganti ke announcement berikutnya
  const handleTransitionEnd = useCallback(() => {
    if (isScrolling) goNext();
  }, [isScrolling, goNext]);

  if (!visible.length) return null;

  const scrollDuration = ann
    ? Math.max(3, ann.message.length / CHARS_PER_SECOND)
    : 5;

  const textStyle: React.CSSProperties = {
    display: "inline-block",
    transform: isScrolling ? "translateX(-110%)" : "translateX(0%)",
    transition: isScrolling ? `transform ${scrollDuration}s linear` : "none",
    willChange: "transform",
  };

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-3">
      <div
        className={`flex items-stretch rounded-xl border overflow-hidden transition-colors duration-500 ${cfg.track}`}
        data-testid="announcement-banner"
      >
        {/* Badge kiri */}
        <div className={`flex items-center gap-1.5 px-3 py-2 shrink-0 transition-colors duration-500 ${cfg.badge}`}>
          <Megaphone size={11} className="text-white shrink-0" />
          <span className="text-[10px] font-black tracking-wider text-white leading-none">
            {cfg.label}
          </span>
        </div>

        {/* Garis pembatas */}
        <div className="w-px bg-border/20 shrink-0" />

        {/* Area teks */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center min-w-0 px-4 py-2 overflow-hidden"
        >
          <div
            style={{
              opacity: fading ? 0 : 1,
              transition: `opacity ${FADE_MS}ms ease`,
              overflow: "hidden",
              width: "100%",
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

        {/* Dot indicator */}
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
