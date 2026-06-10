import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Coins, ArrowUpCircle, ArrowDownCircle, ArrowLeft, Loader2,
  ShoppingBag, Lock, Copy, Check, BookOpen, ChevronDown, ChevronUp,
  Gift, RotateCcw, ExternalLink, RefreshCw, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { TopupModal } from "@/components/payment/TopupModal";
import { apiRequest } from "@/lib/queryClient";

interface HistoryItem {
  id: string;
  amount: number;
  type: "topup" | "unlock" | "bonus" | "refund" | string;
  description: string;
  createdAt: string;
  orderId?: string | null;
  status?: "paid" | "pending" | "failed" | "expired" | string;
  price?: number | null;
  novelTitle?: string | null;
  novelSlug?: string | null;
  chapterTitle?: string | null;
  chapterNumber?: number | null;
  seasonNumber?: number | null;
}

interface TopupOrder {
  orderId: string;
  coins: number;
  price: number;
  packageId: string;
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
}

type Filter = "all" | "topup" | "unlock" | "orders";

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

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  paid:    { label: "Selesai",      color: "bg-green-500/10 text-green-600 dark:text-green-400",    dot: "bg-green-500" },
  pending: { label: "Menunggu",     color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500 animate-pulse" },
  failed:  { label: "Dibatalkan",   color: "bg-red-500/10 text-red-600 dark:text-red-400",          dot: "bg-red-500" },
  expired: { label: "Kedaluwarsa",  color: "bg-muted text-muted-foreground",                        dot: "bg-muted-foreground" },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CFG[status ?? "paid"] ?? STATUS_CFG.paid;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0" title="Salin">
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

// ── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = item.amount > 0;

  const icon = ({ topup: <ArrowUpCircle size={17} className="text-green-500" />, unlock: <ArrowDownCircle size={17} className="text-amber-500" />, bonus: <Gift size={17} className="text-purple-500" />, refund: <RotateCcw size={17} className="text-blue-500" /> } as any)[item.type]
    ?? (isCredit ? <ArrowUpCircle size={17} className="text-green-500" /> : <ArrowDownCircle size={17} className="text-amber-500" />);

  const iconBg = ({ topup: "bg-green-500/10", unlock: "bg-amber-500/10", bonus: "bg-purple-500/10", refund: "bg-blue-500/10" } as any)[item.type]
    ?? (isCredit ? "bg-green-500/10" : "bg-amber-500/10");

  const typeLabel = ({ topup: "Top-up Koin", unlock: "Buka Chapter", bonus: "Bonus Koin", refund: "Refund" } as any)[item.type]
    ?? (isCredit ? "Masuk" : "Keluar");

  const hasDetail = !!(item.orderId || item.novelTitle || item.chapterTitle);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
        onClick={() => hasDetail && setExpanded(v => !v)}
        data-testid={`row-tx-${item.id}`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{typeLabel}</p>
            {item.type === "topup" && <StatusBadge status={item.status} />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.type === "unlock"
              ? (item.chapterNumber != null
                  ? `Bab ${item.chapterNumber}${item.chapterTitle ? ` — ${item.chapterTitle}` : ""}${item.novelTitle ? ` · ${item.novelTitle}` : ""}`
                  : item.novelTitle || item.description || typeLabel)
              : item.description || typeLabel}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{formatDate(item.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-sm font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
            {isCredit ? "+" : "-"}{Math.abs(item.amount)}<span className="text-xs font-normal ml-0.5">koin</span>
          </span>
          {hasDetail && <span className="text-muted-foreground">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>}
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
              {item.type === "topup" && <>
                {item.orderId && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Order ID</span>
                    <div className="flex items-center gap-0.5 min-w-0">
                      <span className="font-mono text-foreground truncate text-[11px]">{item.orderId}</span>
                      <CopyBtn text={item.orderId} />
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
              </>}
              {item.type === "unlock" && <>
                {item.novelTitle && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Novel</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-semibold text-foreground truncate">{item.novelTitle}</span>
                      {item.novelSlug && (
                        <Link href={`/${item.novelSlug}`}>
                          <a className="text-muted-foreground hover:text-primary shrink-0"><ExternalLink size={11} /></a>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
                {item.chapterNumber != null && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Chapter</span>
                    <span className="font-semibold text-foreground text-right">
                      {item.seasonNumber != null && item.seasonNumber > 1 ? `S${item.seasonNumber} ` : ""}Bab {item.chapterNumber}
                      {item.chapterTitle ? ` — ${item.chapterTitle}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Koin Dipakai</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">-{Math.abs(item.amount)} koin</span>
                </div>
              </>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Order row (Pesanan tab) ───────────────────────────────────────────────────
function OrderRow({ order }: { order: TopupOrder }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localStatus, setLocalStatus] = useState(order.status);
  const [localCoins, setLocalCoins] = useState(order.coins);
  const [expanded, setExpanded] = useState(false);

  const checkMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/payment/topup/check/${order.orderId}`, {});
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal cek status");
      return data;
    },
    onSuccess: (data: any) => {
      setLocalStatus(data.status);
      setLocalCoins(data.coins);
      if (data.changed) {
        queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
        queryClient.invalidateQueries({ queryKey: ["/api/coins/history"] });
        queryClient.invalidateQueries({ queryKey: ["/api/payment/topup/orders"] });
      }
      if (data.expired) {
        toast({ title: "Pesanan Kadaluarsa", description: "Batas waktu pembayaran sudah lewat. Buat pesanan baru untuk membeli koin.", variant: "destructive" });
      } else if (data.status === "paid" && data.changed) {
        toast({ title: "Pembayaran Berhasil!", description: `${data.coins} koin telah ditambahkan ke akunmu.` });
      }
    },
    onError: (err: any) => {
      toast({ title: "Gagal Cek Status", description: err?.message || "Coba beberapa saat lagi.", variant: "destructive" });
    },
  });

  const isPending = localStatus === "pending";
  const isPaid    = localStatus === "paid";

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
        data-testid={`row-order-${order.orderId}`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? "bg-green-500/10" : isPending ? "bg-yellow-500/10" : "bg-muted"}`}>
          <Package size={17} className={isPaid ? "text-green-500" : isPending ? "text-yellow-500" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{localCoins} Koin</p>
            <StatusBadge status={localStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{order.orderId}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-foreground">{formatRupiah(order.price)}</span>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3.5 rounded-xl bg-muted/50 border border-border p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-medium shrink-0">Order ID</span>
                <div className="flex items-center gap-0.5 min-w-0">
                  <span className="font-mono text-foreground truncate text-[11px]">{order.orderId}</span>
                  <CopyBtn text={order.orderId} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-medium">Paket</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Coins size={11} className="text-amber-500" /> {localCoins} Koin
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-semibold text-foreground">{formatRupiah(order.price)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-medium">Status</span>
                <StatusBadge status={localStatus} />
              </div>

              {isPending && (
                <button
                  onClick={() => checkMut.mutate()}
                  disabled={checkMut.isPending}
                  className="w-full mt-1 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  data-testid={`button-check-status-${order.orderId}`}
                >
                  {checkMut.isPending
                    ? <><Loader2 size={12} className="animate-spin" /> Mengecek ke Midtrans…</>
                    : <><RefreshCw size={12} /> Cek Status Pembayaran</>}
                </button>
              )}

              {checkMut.isError && (
                <p className="text-[11px] text-red-500 text-center">
                  {(checkMut.error as any)?.message || "Gagal cek status. Coba lagi."}
                </p>
              )}

              {!isPending && !isPaid && (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  {localStatus === "expired"
                    ? "Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru."
                    : "Transaksi ini sudah tidak aktif. Buat pesanan baru untuk membeli koin."}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
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

  const { data: orders, isLoading: ordersLoading } = useQuery<TopupOrder[]>({
    queryKey: ["/api/payment/topup/orders"],
    queryFn: () => fetch("/api/payment/topup/orders", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" size={28} /></div>;
  }

  if (!user || user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Lock size={40} className="mx-auto mb-4 text-muted-foreground" />
          <p className="font-semibold text-foreground mb-2">Halaman khusus pembaca</p>
          <p className="text-sm text-muted-foreground mb-5">Login untuk melihat riwayat transaksi koin kamu.</p>
          <a href="/auth/google" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Login dengan Google</a>
        </div>
      </div>
    );
  }

  const topupTxs  = (history ?? []).filter(t => t.amount > 0);
  const unlockTxs = (history ?? []).filter(t => t.amount < 0);
  const pendingOrders = (orders ?? []).filter(o => o.status === "pending");

  const filtered = filter === "topup" ? topupTxs : filter === "unlock" ? unlockTxs : (history ?? []);

  const FILTERS: { key: Filter; label: string; count: number; badge?: string }[] = [
    { key: "all",    label: "Semua",      count: (history ?? []).length },
    { key: "topup",  label: "Top-up",     count: topupTxs.length },
    { key: "unlock", label: "Pengeluaran", count: unlockTxs.length },
    { key: "orders", label: "Pesanan",    count: (orders ?? []).length, badge: pendingOrders.length > 0 ? String(pendingOrders.length) : undefined },
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
              <p className="text-4xl font-bold tracking-tight" data-testid="text-balance-hero">{balanceData?.coins ?? 0}</p>
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
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-xl font-bold">{topupTxs.length}</p>
              <p className="text-xs opacity-80">pembelian</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{unlockTxs.length}</p>
              <p className="text-xs opacity-80">chapter dibuka</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{pendingOrders.length}</p>
              <p className="text-xs opacity-80">menunggu</p>
            </div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
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
              {f.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {f.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              {{ all: "Semua Transaksi", topup: "Riwayat Top-up", unlock: "Riwayat Pengeluaran", orders: "Daftar Pesanan" }[filter]}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen size={12} />
              {filter === "orders" ? (orders ?? []).length : filtered.length} item
            </div>
          </div>

          {/* Transactions (all / topup / unlock tabs) */}
          {filter !== "orders" && (
            histLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Coins size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {filter === "all" ? "Belum ada transaksi" : filter === "topup" ? "Belum ada top-up" : "Belum ada pengeluaran"}
                </p>
                {filter !== "unlock" && (
                  <button onClick={() => setShowTopup(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline" data-testid="button-buy-first-coins">
                    <ShoppingBag size={13} /> Beli Koin
                  </button>
                )}
              </div>
            ) : (
              <div>{filtered.map(item => <TxRow key={item.id} item={item} />)}</div>
            )
          )}

          {/* Orders tab */}
          {filter === "orders" && (
            ordersLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Package size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada pesanan</p>
                <button onClick={() => setShowTopup(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                  <ShoppingBag size={13} /> Beli Koin
                </button>
              </div>
            ) : (
              <div>
                {pendingOrders.length > 0 && (
                  <div className="px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/10">
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">
                      {pendingOrders.length} pesanan masih menunggu pembayaran — klik "Cek Status" untuk memperbarui.
                    </p>
                  </div>
                )}
                {orders.map(o => <OrderRow key={o.orderId} order={o} />)}
              </div>
            )
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          Ada masalah transaksi? Hubungi admin dengan menyertakan <strong>Order ID</strong> kamu.
        </p>
      </div>

      {showTopup && (
        <TopupModal onClose={() => setShowTopup(false)} onSuccess={() => setShowTopup(false)} />
      )}
    </div>
  );
}
