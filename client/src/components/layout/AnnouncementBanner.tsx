import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Info, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Announcement } from "@shared/schema";

const TYPE_CONFIG = {
  info:    { bg: "bg-blue-500/10 border-blue-500/20",    text: "text-blue-700 dark:text-blue-300",    icon: Info,           iconColor: "text-blue-500" },
  warning: { bg: "bg-amber-500/10 border-amber-500/20",  text: "text-amber-700 dark:text-amber-300",  icon: AlertTriangle,  iconColor: "text-amber-500" },
  success: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle2, iconColor: "text-emerald-500" },
};

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dismissed-announcements") || "[]");
      setDismissed(saved);
    } catch {}
  }, []);

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then(r => r.json()),
    staleTime: 60_000,
  });

  const visible = (announcements ?? []).filter(a => !dismissed.includes(a.id));

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem("dismissed-announcements", JSON.stringify(next)); } catch {}
  };

  if (!visible.length) return null;

  const ann = visible[0];
  const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={ann.id}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`border-b ${cfg.bg}`}
        data-testid="announcement-banner"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          <Icon size={13} className={`shrink-0 ${cfg.iconColor}`} />
          <p className={`flex-1 text-xs font-medium ${cfg.text} line-clamp-1`}>{ann.message}</p>
          {ann.link && (
            <a
              href={ann.link}
              target={ann.link.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className={`shrink-0 text-xs font-semibold underline flex items-center gap-1 ${cfg.text}`}
              data-testid="announcement-link"
            >
              {ann.linkText ?? "Selengkapnya"}
              {ann.link.startsWith("http") && <ExternalLink size={10} />}
            </a>
          )}
          <button
            onClick={() => dismiss(ann.id)}
            className={`shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors ${cfg.text}`}
            data-testid="button-dismiss-announcement"
            aria-label="Tutup pengumuman"
          >
            <X size={13} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
