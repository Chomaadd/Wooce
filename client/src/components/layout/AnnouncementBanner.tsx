import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Announcement } from "@shared/schema";

const TYPE_CONFIG = {
  info:    { bg: "bg-blue-500/10 border-blue-500/20",       text: "text-blue-700 dark:text-blue-300",    icon: Info,          iconColor: "text-blue-500" },
  warning: { bg: "bg-amber-500/10 border-amber-500/20",     text: "text-amber-700 dark:text-amber-300",  icon: AlertTriangle, iconColor: "text-amber-500" },
  success: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle2, iconColor: "text-emerald-500" },
};

export function AnnouncementBanner() {
  const trackRef = useRef<HTMLDivElement>(null);

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => a.active !== false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pos = 0;
    let raf: number;
    const speed = 0.6;

    function step() {
      pos -= speed;
      const half = track!.scrollWidth / 2;
      if (Math.abs(pos) >= half) pos = 0;
      track!.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible.length]);

  if (!visible.length) return null;

  const ann = visible[0];
  const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  const content = (
    <span className="inline-flex items-center gap-2 px-8 whitespace-nowrap">
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
      <div ref={trackRef} className="inline-flex will-change-transform">
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
}
