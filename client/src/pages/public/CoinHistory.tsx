import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Coins, ArrowUpCircle, ArrowDownCircle, ArrowLeft, Loader2,
  ShoppingBag, Lock, Copy, Check, BookOpen, ChevronDown, ChevronUp,
  Gift, RotateCcw, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { TopupModal } from "@/components/payment/TopupModal";

interface HistoryItem {
  id: string;
  amount: number;
  type: "topup" | "unlock" | "bonus" | "refund" | string;
  description: string;
  createdAt: string;
  // topup
  orderId?: string | null;
  status?: "paid" | "pending" | "failed" | "expired" | string;
  price?: number | null;
  // unlock
  novelTitle?: string | null;
  novelSlug?: string | null;
  chapterTitle?: string | null;
  chapterNumber?: number | null;
  seasonNumber?: number | null;
}

type Filter = "all" | "topup" | "unlock";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  paid:    { label: "Selesai",   color: "bg-green-500/10 text-green-600 dark:text-green-400",  dot: "bg-green-500" },
  pending: { label: "Menunggu",  color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
  failed:  { label: "Dibatalkan", color: "bg-red-500/10 text-red-600 dark:text-red-400",        dot: "bg-red-500" },
  expired: { label: "Kedaluwarsa", color: "bg-muted text-muted-foreground",                     dot: "bg-muted-foreground" },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status ?? "paid"] ?? STATUS_CONFIG.paid;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={copy}
      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Salin"
      data-testid={`button-copy-${text}`}
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

function TxRow({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = item.amount > 0;

  const icon = {
    topup:  <ArrowUpCircle size={17} className="text-green-500" />,
    unlock: <ArrowDownCircle size={17} className="text-amber-500" />,
    bonus:  <Gift size={17} className="text-purple-500" />,
    refund: <RotateCcw size={17} className="text-blue-500" />,
  }[item.type] ?? (isCredit
    ? <ArrowUpCircle size={17} className="text-green-500" />
    : <ArrowDownCircle size={17} className="text-amber-500" />);

  const iconBg = {
    topup:  "bg-green-500/10",
    unlock: "bg-amber-500/10",
    bonus:  "bg-purple-500/10",
    refund: "bg-blue-500/10",
  }[item.type] ?? (isCredit ? "bg-green-500/10" : "bg-amber-500/10");

  const typeLabel = {
    topup:  "Top-up Koin",
    unlock: "Buka Chapter",
    bonus:  "Bonus Koin",
    refund: "Refund",
  }[item.type] ?? (isCredit ? "Masuk" : "Keluar");

  const hasDetail = !!(
    item.orderId ||
    item.novelTitle ||
    item.chapterTitle
  );

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
        onClick={() => hasDetail && setExpanded(v => !v)}
        data-testid={`row-tx-${item.id}`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{typeLabel}</p>
            {item.type === "topup" && <StatusBadge status={item.status} />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.type === "unlock" && item.novelTitle
              ? item.novelTitle
              : item.description || typeLabel}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{formatDate(item.createdAt)}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-sm font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
            {isCredit ? "+" : ""}{item.amount}
            <span className="text-xs font-normal ml-0.5">koin</span>
          </span>
          {hasDetail && (
            <span className="text-muted-foreground">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3.5 rounded-xl bg-muted/50 border border-border p-3.5 space-y-2.5 text-xs">
              {item.type === "topup" && (
                <>
                  {item.orderId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-medium shrink-0">Order ID</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-foreground truncate text-[11px]" data-testid={`text-orderid-${item.id}`}>
                          {item.orderId}
                        </span>
                        <CopyButton text={item.orderId} />
                      </div>
                    </div>
                  )}
                  {item.price && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Total Bayar</span>
                      <span className="font-semibold text-foreground">{formatRupiah(item.price)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Status</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Koin Diterima</span>
                    <span className="font-bold text-green-600 dark:text-green-400">+{item.amount} koin</span>
                  </div>
                </>
              )}

              {item.type === "unlock" && (
                <>
                  {item.novelTitle && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-medium shrink-0">Novel</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold text-foreground truncate">{item.novelTitle}</span>
                        {item.novelSlug && (
                          <Link href={`/${item.novelSlug}`}>
                            <a className="text-muted-foreground hover:text-primary shrink-0" title="Buka novel">
                              <ExternalLink size={11} />
                            </a>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                  {item.chapterNumber != null && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-medium shrink-0">Chapter</span>
                      <span className="font-semibold text-foreground text-right">
                        {item.seasonNumber != null && item.seasonNumber > 1
                          ? `S${item.seasonNumber} `
                          : ""}Bab {item.chapterNumber}
                        {item.chapterTitle ? ` — ${item.chapterTitle}` : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Koin Dipakai</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{item.amount} koin</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CoinHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [showTopup, setShowTopup] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const { data: balanceData } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    queryFn: () => fetch("/api/coins/balance", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });

  const { data: history, isLoading: histLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/coins/history"],
    queryFn: () => fetch("/api/coins/history", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!user || user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Lock size={40} className="mx-auto mb-4 text-muted-foreground" />
          <p className="font-semibold text-foreground mb-2">Halaman khusus pembaca</p>
          <p className="text-sm text-muted-foreground mb-5">Login untuk melihat riwayat transaksi koin kamu.</p>
          <a href="/auth/google" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Login dengan Google
          </a>
        </div>
      </div>
    );
  }

  const filtered = (history ?? []).filter(item => {
    if (filter === "topup")  return item.amount > 0;
    if (filter === "unlock") return item.amount < 0;
    return true;
  });

  const topupCount  = (history ?? []).filter(t => t.amount > 0).length;
  const unlockCount = (history ?? []).filter(t => t.amount < 0).length;

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all",    label: "Semua",      count: (history ?? []).length },
    { key: "topup",  label: "Top-up",     count: topupCount },
    { key: "unlock", label: "Pengeluaran", count: unlockCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" data-testid="button-back">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Riwayat Koin</h1>
        </div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 mb-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <Coins size={16} />
            <span className="text-sm font-medium">Saldo Koin</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold tracking-tight" data-testid="text-balance-hero">
                {balanceData?.coins ?? 0}
              </p>
              <p className="text-sm opacity-80 mt-0.5">koin tersedia</p>
            </div>
            <button
              onClick={() => setShowTopup(true)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              data-testid="button-topup-from-history"
            >
              <ShoppingBag size={14} /> Beli Koin
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-xl font-bold">{topupCount}</p>
              <p className="text-xs opacity-80">pembelian</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{unlockCount}</p>
              <p className="text-xs opacity-80">chapter dibuka</p>
            </div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`button-filter-${f.key}`}
            >
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === f.key ? "bg-background/20 text-background" : "bg-background text-muted-foreground"
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              {filter === "all" ? "Semua Transaksi" : filter === "topup" ? "Riwayat Top-up" : "Riwayat Pengeluaran"}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen size={12} />
              {filtered.length} transaksi
            </div>
          </div>

          {histLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={22} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Coins size={32} className="mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === "all" ? "Belum ada transaksi" : filter === "topup" ? "Belum ada top-up" : "Belum ada pengeluaran"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {filter === "all"
                  ? "Beli koin pertamamu dan mulai baca cerita premium!"
                  : filter === "topup"
                  ? "Beli koin untuk membaca chapter premium."
                  : "Kamu belum membuka chapter premium manapun."}
              </p>
              {filter !== "unlock" && (
                <button
                  onClick={() => setShowTopup(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  data-testid="button-buy-first-coins"
                >
                  <ShoppingBag size={13} /> Beli Koin
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map(item => <TxRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          Ada masalah transaksi? Hubungi admin dengan menyertakan <strong>Order ID</strong> kamu.
        </p>
      </div>

      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={() => setShowTopup(false)}
        />
      )}
    </div>
  );
}
