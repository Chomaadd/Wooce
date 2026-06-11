import { useQuery } from "@tanstack/react-query";
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

function TickerItem({ ann, textClass }: { ann: Announcement; textClass: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap px-10">
      <span className={`text-[11.5px] font-medium ${textClass}`}>{ann.message}</span>
      {ann.link && (
        <a
          href={ann.link}
          target={ann.link.startsWith("http") ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className={`text-[11px] font-semibold underline underline-offset-2 ${textClass} opacity-75 hover:opacity-100 transition-opacity`}
          onClick={e => e.stopPropagation()}
        >
          {ann.linkText ?? "Selengkapnya →"}
        </a>
      )}
      <span className="text-muted-foreground/25 text-xs select-none mx-1">✦</span>
    </span>
  );
}

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);
  if (!visible.length) return null;

  const primary = visible[0];
  const cfg = TYPE_CONFIG[primary.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;

  const duration = Math.max(18, visible.length * 15);

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-3">
      <style>{`
        @keyframes wooce-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wooce-ticker-track {
          display: inline-flex;
          animation: wooce-ticker ${duration}s linear infinite;
          will-change: transform;
          white-space: nowrap;
        }
        .wooce-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className={`flex items-stretch rounded-xl border overflow-hidden ${cfg.track}`}
        data-testid="announcement-banner"
      >
        {/* Badge kiri — diam */}
        <div className={`flex items-center gap-1.5 px-3 py-2 shrink-0 ${cfg.badge}`}>
          <Megaphone size={11} className="text-white shrink-0" />
          <span className="text-[10px] font-black tracking-wider text-white leading-none">{cfg.label}</span>
        </div>

        {/* Garis pembatas */}
        <div className="w-px bg-border/20 shrink-0" />

        {/* Area scrolling */}
        <div className="flex-1 overflow-hidden flex items-center min-w-0 py-2">
          <div className="wooce-ticker-track">
            {visible.map(ann => (
              <TickerItem
                key={ann.id}
                ann={ann}
                textClass={(TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info).text}
              />
            ))}
            {visible.map(ann => (
              <TickerItem
                key={`dup-${ann.id}`}
                ann={ann}
                textClass={(TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info).text}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
