import { useQuery } from "@tanstack/react-query";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Announcement } from "@shared/schema";

const TYPE_CONFIG = {
  info:    { bg: "bg-blue-500/10 border-blue-500/20",          text: "text-blue-700 dark:text-blue-300",       icon: Info,          iconColor: "text-blue-500" },
  warning: { bg: "bg-amber-500/10 border-amber-500/20",        text: "text-amber-700 dark:text-amber-300",     icon: AlertTriangle, iconColor: "text-amber-500" },
  success: { bg: "bg-emerald-500/10 border-emerald-500/20",    text: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle2,  iconColor: "text-emerald-500" },
};

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);
  if (!visible.length) return null;

  const ann = visible[0];
  const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  const textContent = (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      style={{ minWidth: "100vw", paddingLeft: "4rem" }}
    >
      <Icon size={12} className={`shrink-0 ${cfg.iconColor}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>{ann.message}</span>
      {ann.link && (
        <a
          href={ann.link}
          target={ann.link.startsWith("http") ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className={`text-xs font-semibold underline ${cfg.text}`}
          onClick={e => e.stopPropagation()}
        >
          {ann.linkText ?? "Selengkapnya"}
        </a>
      )}
    </span>
  );

  return (
    <div
      className={`border-b ${cfg.bg} overflow-hidden py-1.5`}
      data-testid="announcement-banner"
    >
      <style>{`
        @keyframes wooce-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wooce-ticker-track {
          display: inline-flex;
          animation: wooce-ticker 18s linear infinite;
          will-change: transform;
        }
        .wooce-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="wooce-ticker-track">
        {textContent}
        {textContent}
      </div>
    </div>
  );
}
