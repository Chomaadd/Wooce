import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Coins, ArrowLeft,
  RotateCcw, Home, Loader2, ShoppingBag, AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { getTranslation } from "@/lib/i18n";

type PaymentStatus = "loading" | "success" | "pending" | "failed" | "expired";

interface OrderResult {
  status: string;
  coins: number;
  price: number;
  changed?: boolean;
  expired?: boolean;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const CONFETTI_COUNT = 60;
const COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#f97316", "#06b6d4", "#84cc16"];

function Confetti() {
  const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.4 + Math.random() * 1.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotation + 540, scale: [1, 0.8, 0.4] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed",
            top: 0,
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.5 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current inline-block"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </span>
  );
}

export default function PaymentFinish() {
  const { language } = useLanguage();
  const t = (k: string) => getTranslation(language, k);

  const [pageStatus, setPageStatus] = useState<PaymentStatus>("loading");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [countdown, setCountdown] = useState(7);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFinalizedRef = useRef(false);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  const rawTxStatus = params.get("transaction_status");

  function resolveStatus(status: string): PaymentStatus {
    if (["paid", "success", "settlement", "capture"].includes(status)) return "success";
    if (status === "pending") return "pending";
    if (status === "expired") return "expired";
    return "failed";
  }

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startCountdown() {
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          window.location.replace("/koin/riwayat");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function finalize(status: PaymentStatus, data?: OrderResult) {
    if (hasFinalizedRef.current) return;
    hasFinalizedRef.current = true;
    stopPolling();
    if (data) setOrder(data);
    setPageStatus(status);
    if (status === "success") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
      startCountdown();
    }
  }

  async function checkOnce(): Promise<boolean> {
    if (!orderId) return true;
    try {
      const res = await fetch(`/api/payment/topup/check/${orderId}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        const tx = rawTxStatus || "";
        if (["settlement", "capture"].includes(tx)) finalize("success");
        else if (tx === "pending") return false;
        else finalize("failed");
        return true;
      }
      if (res.ok) {
        const data: OrderResult = await res.json();
        const st = resolveStatus(data.status);
        if (st !== "pending") {
          finalize(st, data);
          return true;
        }
        setOrder(data);
        setPageStatus("pending");
        return false;
      }
    } catch {
    }
    return false;
  }

  useEffect(() => {
    if (!orderId) {
      setPageStatus("failed");
      return;
    }

    checkOnce().then((done) => {
      if (done) return;
      intervalRef.current = setInterval(() => {
        setPollCount((c) => {
          if (c >= 24) {
            stopPolling();
            if (!hasFinalizedRef.current) {
              hasFinalizedRef.current = true;
              setPageStatus("pending");
            }
            return c;
          }
          return c + 1;
        });
        checkOnce();
      }, 3000);
    });

    return () => {
      stopPolling();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [orderId]);

  const cfg = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      ringColor: "ring-emerald-500/20",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/25",
      gradientFrom: "from-emerald-500/5",
      title: t("payment.finish.success.title"),
      subtitle: order
        ? t("payment.finish.success.subtitle").replace("{{coins}}", String(order.coins))
        : t("payment.finish.success.subtitle.generic"),
    },
    pending: {
      icon: Clock,
      iconColor: "text-amber-500",
      ringColor: "ring-amber-500/20",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/25",
      gradientFrom: "from-amber-500/5",
      title: t("payment.finish.pending.title"),
      subtitle: t("payment.finish.pending.subtitle"),
    },
    failed: {
      icon: XCircle,
      iconColor: "text-rose-500",
      ringColor: "ring-rose-500/20",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/25",
      gradientFrom: "from-rose-500/5",
      title: t("payment.finish.failed.title"),
      subtitle: t("payment.finish.failed.subtitle"),
    },
    expired: {
      icon: AlertTriangle,
      iconColor: "text-orange-500",
      ringColor: "ring-orange-500/20",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/25",
      gradientFrom: "from-orange-500/5",
      title: t("payment.finish.expired.title"),
      subtitle: t("payment.finish.expired.subtitle"),
    },
    loading: {
      icon: Clock,
      iconColor: "text-muted-foreground",
      ringColor: "ring-muted/20",
      bgColor: "bg-muted/30",
      borderColor: "border-border",
      gradientFrom: "from-muted/5",
      title: t("payment.finish.loading.title"),
      subtitle: t("payment.finish.loading.subtitle"),
    },
  };

  const current = cfg[pageStatus];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={t("payment.finish.seoTitle")}
        description={t("payment.finish.seoDesc")}
      />
      <Navbar />

      {showConfetti && <Confetti />}

      <main className="max-w-md mx-auto px-4 pt-12 pb-20 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`w-full rounded-3xl border ${current.borderColor} bg-gradient-to-b ${current.gradientFrom} to-card shadow-sm overflow-hidden`}
          >
            {/* Top accent bar */}
            <div
              className={`h-1 w-full ${
                pageStatus === "success" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                pageStatus === "pending" ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                pageStatus === "expired" ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                pageStatus === "failed" ? "bg-gradient-to-r from-rose-400 to-rose-600" :
                "bg-border"
              }`}
            />

            <div className="p-8 flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                key={`icon-${pageStatus}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 16 }}
                className={`w-20 h-20 rounded-2xl ${current.bgColor} ring-4 ${current.ringColor} flex items-center justify-center mb-6`}
              >
                {pageStatus === "loading" ? (
                  <Loader2 size={36} className="text-muted-foreground animate-spin" />
                ) : pageStatus === "success" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.25, 1] }}
                    transition={{ delay: 0.1, duration: 0.45, times: [0, 0.6, 1] }}
                  >
                    <Icon size={40} className={current.iconColor} strokeWidth={2} />
                  </motion.div>
                ) : (
                  <Icon size={40} className={current.iconColor} strokeWidth={1.75} />
                )}
              </motion.div>

              {/* Title */}
              <h1 className="text-xl font-bold text-foreground mb-2">{current.title}</h1>

              {/* Subtitle / polling indicator */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {pageStatus === "pending" && intervalRef.current ? (
                  <span className="inline-flex items-center gap-1">
                    {t("payment.finish.polling")}
                    <PulsingDots />
                  </span>
                ) : (
                  current.subtitle
                )}
              </p>

              {/* ── SUCCESS detail card ── */}
              {pageStatus === "success" && order && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="w-full rounded-2xl bg-muted/40 border border-border p-4 mb-6 space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag size={13} /> {t("payment.finish.detail.coins")}
                    </span>
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-500" />
                      {order.coins.toLocaleString("id-ID")} {t("payment.finish.detail.coinsUnit")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("payment.finish.detail.amount")}</span>
                    <span className="font-semibold text-foreground">{formatRupiah(order.price)}</span>
                  </div>
                  {orderId && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                      <span className="text-muted-foreground">{t("payment.finish.detail.orderId")}</span>
                      <span className="font-mono text-muted-foreground truncate max-w-[180px]">{orderId}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Countdown redirect banner */}
              {pageStatus === "success" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-muted-foreground mb-5"
                >
                  {t("payment.finish.redirect").replace("{{n}}", String(countdown))}
                </motion.p>
              )}

              {/* Order ID for non-success non-loading */}
              {!["success", "loading"].includes(pageStatus) && orderId && (
                <p className="text-xs text-muted-foreground mb-5 font-mono bg-muted/40 px-3 py-1.5 rounded-lg">
                  ID: {orderId}
                </p>
              )}

              {/* ── ACTIONS ── */}
              <div className="w-full flex flex-col gap-3">
                {pageStatus === "success" && (
                  <>
                    <Link href="/koin/riwayat">
                      <button
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        data-testid="button-payment-history"
                      >
                        <Coins size={15} /> {t("payment.finish.btn.history")}
                      </button>
                    </Link>
                    <Link href="/">
                      <button
                        className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
                        data-testid="button-payment-home"
                      >
                        <Home size={15} /> {t("payment.finish.btn.home")}
                      </button>
                    </Link>
                  </>
                )}

                {pageStatus === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        stopPolling();
                        hasFinalizedRef.current = false;
                        setPageStatus("loading");
                        checkOnce().then((done) => {
                          if (!done) {
                            setPageStatus("pending");
                            intervalRef.current = setInterval(() => {
                              setPollCount((c) => {
                                if (c >= 24) { stopPolling(); return c; }
                                return c + 1;
                              });
                              checkOnce();
                            }, 3000);
                          }
                        });
                      }}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      data-testid="button-payment-recheck"
                    >
                      <RotateCcw size={15} /> {t("payment.finish.btn.recheck")}
                    </button>
                    <Link href="/">
                      <button
                        className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
                        data-testid="button-payment-home-pending"
                      >
                        <Home size={15} /> {t("payment.finish.btn.home")}
                      </button>
                    </Link>
                  </>
                )}

                {(pageStatus === "failed" || pageStatus === "expired") && (
                  <>
                    <Link href="/topup-koin">
                      <button
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        data-testid="button-payment-retry"
                      >
                        <RotateCcw size={15} /> {t("payment.finish.btn.tryAgain")}
                      </button>
                    </Link>
                    <Link href="/">
                      <button
                        className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
                      >
                        <Home size={15} /> {t("payment.finish.btn.home")}
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pending helper note */}
        {pageStatus === "pending" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xs text-muted-foreground text-center max-w-xs leading-relaxed"
          >
            {t("payment.finish.pending.note")}
          </motion.p>
        )}

        {/* Polling progress indicator */}
        {pageStatus === "pending" && intervalRef.current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 flex flex-col items-center gap-2"
          >
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payment.finish.polling.count").replace("{{n}}", String(pollCount + 1))}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
