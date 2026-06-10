import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Coins, ArrowUpCircle, ArrowDownCircle, ArrowLeft, Loader2, ShoppingBag, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { TopupModal } from "@/components/payment/TopupModal";

interface CoinTx {
  id: string;
  amount: number;
  type: "topup" | "unlock" | "admin_grant" | string;
  description: string;
  chapterId: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function TxRow({ tx }: { tx: CoinTx }) {
  const isCredit = tx.amount > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors rounded-xl"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-500/10" : "bg-amber-500/10"}`}>
        {isCredit
          ? <ArrowUpCircle size={18} className="text-green-500" />
          : <ArrowDownCircle size={18} className="text-amber-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{tx.description || (isCredit ? "Top-up koin" : "Buka chapter")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.createdAt)}</p>
      </div>
      <div className={`text-sm font-bold shrink-0 ${isCredit ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
        {isCredit ? "+" : ""}{tx.amount}
        <span className="text-xs font-normal ml-0.5">koin</span>
      </div>
    </motion.div>
  );
}

export default function CoinHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [showTopup, setShowTopup] = useState(false);

  const { data: balanceData } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    queryFn: () => fetch("/api/coins/balance", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });

  const { data: transactions, isLoading: txLoading } = useQuery<CoinTx[]>({
    queryKey: ["/api/coins/transactions"],
    queryFn: () => fetch("/api/coins/transactions", { credentials: "include" }).then(r => r.json()),
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

  const topupTxs  = transactions?.filter(t => t.amount > 0) ?? [];
  const unlockTxs = transactions?.filter(t => t.amount < 0) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Riwayat Koin</h1>
        </div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 mb-6 shadow-lg"
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
              <p className="text-xl font-bold">{topupTxs.length}</p>
              <p className="text-xs opacity-80">pembelian</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{unlockTxs.length}</p>
              <p className="text-xs opacity-80">chapter dibuka</p>
            </div>
          </div>
        </motion.div>

        {/* Transaction list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Semua Transaksi</p>
            <p className="text-xs text-muted-foreground">{transactions?.length ?? 0} transaksi</p>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={22} />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Coins size={32} className="mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Beli koin pertamamu dan mulai baca cerita premium!</p>
              <button
                onClick={() => setShowTopup(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                data-testid="button-buy-first-coins"
              >
                <ShoppingBag size={13} /> Beli Koin
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Koin WOOCE Novel tidak dapat dikembalikan. Hubungi admin untuk pertanyaan.
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
