import { useState, useRef, useEffect } from "react";
import { BadgeCheck, X } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function VerifiedBadge({ size = "md", showLabel = false }: VerifiedBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const iconSize = size === "sm" ? 10 : size === "lg" ? 16 : 13;

  return (
    <span ref={ref} className="relative inline-flex items-center" style={{ verticalAlign: "middle" }}>
      {showLabel ? (
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/25 hover:bg-blue-500/20 transition-colors select-none cursor-pointer"
          data-testid="badge-verified"
          aria-label="Penulis Terverifikasi — klik untuk info"
        >
          <BadgeCheck size={iconSize} />
          Terverifikasi
        </button>
      ) : (
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
          className="inline-flex items-center justify-center text-blue-500 hover:text-blue-400 transition-colors cursor-pointer p-0 bg-transparent border-none"
          data-testid="badge-verified-icon"
          aria-label="Penulis Terverifikasi — klik untuk info"
        >
          <BadgeCheck size={iconSize} />
        </button>
      )}

      {open && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-3.5"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-blue-500 shrink-0" />
              <span className="font-semibold text-sm text-foreground">Penulis Terverifikasi</span>
            </div>
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={13} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Penulis ini telah melewati proses verifikasi identitas oleh tim WOOCE Novel. Identitas, profil media sosial, dan karya mereka sudah dikonfirmasi keasliannya.
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-1.5">
            <BadgeCheck size={11} className="text-blue-500 shrink-0" />
            <span className="text-[10px] text-blue-500 font-medium">Diverifikasi oleh WOOCE Novel</span>
          </div>
        </div>
      )}
    </span>
  );
}
