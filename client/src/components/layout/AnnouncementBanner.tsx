import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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

const DISPLAY_DURATION = 6000; // ms tiap pengumuman tampil
const FADE_DURATION = 400;     // ms transisi fade

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);

  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % visible.length);
        setFading(false);
      }, FADE_DURATION);
    }, DISPLAY_DURATION);
    return () => clearInterval(timer);
  }, [visible.length]);

  if (!visible.length) return null;

  const ann = visible[index] ?? visible[0];
  const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-3">
      <div
        className={`flex items-stretch rounded-xl border overflow-hidden transition-colors duration-500 ${cfg.track}`}
        data-testid="announcement-banner"
      >
        {/* Badge kiri — berubah warna & label sesuai tipe pengumuman aktif */}
        <div className={`flex items-center gap-1.5 px-3 py-2 shrink-0 transition-colors duration-500 ${cfg.badge}`}>
          <Megaphone size={11} className="text-white shrink-0" />
          <span className="text-[10px] font-black tracking-wider text-white leading-none">
            {cfg.label}
          </span>
        </div>

        {/* Garis pembatas */}
        <div className="w-px bg-border/20 shrink-0" />

        {/* Teks pengumuman — fade in/out saat berganti */}
        <div className="flex-1 flex items-center min-w-0 px-4 py-2 overflow-hidden">
          <div
            className={`transition-opacity duration-${FADE_DURATION} ${fading ? "opacity-0" : "opacity-100"}`}
            style={{ transition: `opacity ${FADE_DURATION}ms ease` }}
          >
            <span className={`text-[11.5px] font-medium ${cfg.text} whitespace-nowrap`}>
              {ann.message}
            </span>
            {ann.link && (
              <a
                href={ann.link}
                target={ann.link.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`ml-2 text-[11px] font-semibold underline underline-offset-2 ${cfg.text} opacity-75 hover:opacity-100 transition-opacity`}
              >
                {ann.linkText ?? "Selengkapnya →"}
              </a>
            )}
          </div>
        </div>

        {/* Indikator titik (jika lebih dari 1 pengumuman) */}
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
