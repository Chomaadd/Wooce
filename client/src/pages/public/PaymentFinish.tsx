import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Coins, ArrowLeft, RotateCcw, Home } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Link } from "wouter";

type PaymentStatus = "loading" | "success" | "pending" | "failed";

interface OrderResult {
  status: string;
  coins: number;
  price: number;
  changed?: boolean;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function PaymentFinish() {
  const [, navigate] = useLocation();
  const [pageStatus, setPageStatus] = useState<PaymentStatus>("loading");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [retrying, setRetrying] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  const rawTxStatus = params.get("transaction_status");

  async function syncAndCheck() {
    if (!orderId) {
      setPageStatus("failed");
      return;
    }
    try {
      // First try syncing status from Midtrans via our backend
      const checkRes = await fetch(`/api/payment/topup/check/${orderId}`, {
        method: "POST",
        credentials: "include",
      });
      if (checkRes.status === 401) {
        // Not logged in — fallback to URL param
        resolveFromUrlParam();
        return;
      }
      if (checkRes.ok) {
        const data: OrderResult = await checkRes.json();
        setOrder(data);
        setPageStatus(resolveStatus(data.status));
        return;
      }
    } catch {
      // network error — fallback
    }
    resolveFromUrlParam();
  }

  function resolveFromUrlParam() {
    const tx = rawTxStatus || "";
    if (["settlement", "capture"].includes(tx)) setPageStatus("success");
    else if (tx === "pending") setPageStatus("pending");
    else setPageStatus("failed");
  }

  function resolveStatus(status: string): PaymentStatus {
    if (["success", "settlement", "capture"].includes(status)) return "success";
    if (status === "pending") return "pending";
    return "failed";
  }

  useEffect(() => {
    syncAndCheck();
  }, [orderId]);

  async function handleRetry() {
    setRetrying(true);
    setPageStatus("loading");
    await syncAndCheck();
    setRetrying(false);
  }

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      title: "Pembayaran Berhasil!",
      subtitle: order
        ? `${order.coins.toLocaleString("id-ID")} koin telah ditambahkan ke akunmu.`
        : "Koin telah ditambahkan ke akunmu.",
    },
    pending: {
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      title: "Pembayaran Sedang Diproses",
      subtitle: "Transaksimu masih dalam proses verifikasi. Koin akan ditambahkan otomatis setelah pembayaran dikonfirmasi.",
    },
    failed: {
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
      title: "Pembayaran Gagal",
      subtitle: "Transaksi dibatalkan atau ditolak. Tidak ada koin yang dipotong dari akunmu.",
    },
    loading: {
      icon: Clock,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted/40",
      borderColor: "border-border",
      title: "Memeriksa Status Pembayaran...",
      subtitle: "Mohon tunggu sebentar.",
    },
  };

  const current = config[pageStatus];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Status Pembayaran — WOOCE Novel" description="Status pembayaran koin WOOCE Novel" />
      <Navbar />

      <main className="max-w-md mx-auto px-5 py-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`w-full rounded-3xl border ${current.borderColor} bg-card p-8 flex flex-col items-center text-center shadow-sm`}
        >
          {/* Icon */}
          <motion.div
            key={pageStatus}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
            className={`w-20 h-20 rounded-2xl ${current.bgColor} flex items-center justify-center mb-6`}
          >
            {pageStatus === "loading" ? (
              <div className="w-8 h-8 border-[3px] border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <Icon size={40} className={current.iconColor} strokeWidth={1.5} />
            )}
          </motion.div>

          {/* Title & subtitle */}
          <h1 className="text-xl font-bold text-foreground mb-2">{current.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.subtitle}</p>

          {/* Detail card — shown for success */}
          {pageStatus === "success" && order && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full rounded-2xl bg-muted/50 border border-border p-4 mb-6 space-y-2.5"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Koin diterima</span>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Coins size={15} className="text-amber-500" />
                  {order.coins.toLocaleString("id-ID")} Koin
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total dibayar</span>
                <span className="font-semibold text-foreground">{formatRupiah(order.price)}</span>
              </div>
              {orderId && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-[180px]">{orderId}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Order ID for non-success */}
          {pageStatus !== "success" && orderId && pageStatus !== "loading" && (
            <p className="text-xs text-muted-foreground mb-6 font-mono">
              ID: {orderId}
            </p>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col gap-3">
            {pageStatus === "success" && (
              <>
                <Link href="/">
                  <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2" data-testid="button-payment-home">
                    <Home size={15} /> Kembali ke Beranda
                  </button>
                </Link>
                <Link href="/koin/riwayat">
                  <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2" data-testid="button-payment-history">
                    <Coins size={15} /> Lihat Riwayat Koin
                  </button>
                </Link>
              </>
            )}

            {pageStatus === "pending" && (
              <>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="button-payment-recheck"
                >
                  {retrying
                    ? <><div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Memeriksa...</>
                    : <><RotateCcw size={15} /> Periksa Ulang Status</>
                  }
                </button>
                <Link href="/">
                  <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2" data-testid="button-payment-home-pending">
                    <Home size={15} /> Kembali ke Beranda
                  </button>
                </Link>
              </>
            )}

            {pageStatus === "failed" && (
              <>
                <Link href="/">
                  <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2" data-testid="button-payment-retry">
                    <Home size={15} /> Kembali ke Beranda
                  </button>
                </Link>
                <Link href="/koin/riwayat">
                  <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2">
                    <ArrowLeft size={15} /> Lihat Riwayat Transaksi
                  </button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {pageStatus === "pending" && (
          <p className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
            Jika sudah membayar tapi status masih "diproses", klik <strong>Periksa Ulang</strong>. Butuh bantuan? Hubungi kami di halaman Kontak.
          </p>
        )}
      </main>
    </div>
  );
}
