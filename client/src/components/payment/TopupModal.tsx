import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Coins, Check, Loader2, ShoppingBag, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  label: string;
}

interface TopupModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function loadSnapScript(clientKey: string, isSandbox: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).snap) { resolve(); return; }
    const url = isSandbox
      ? "https://app.sandbox.midtrans.com/snap/snap.js"
      : "https://app.midtrans.com/snap/snap.js";
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) { setTimeout(() => { if ((window as any).snap) resolve(); else reject(new Error("Snap tidak tersedia")); }, 1000); return; }
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat halaman pembayaran. Periksa koneksi internet."));
    document.head.appendChild(script);
  });
}

export function TopupModal({ onClose, onSuccess }: TopupModalProps) {
  const queryClient = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "paying" | "success" | "error">("pick");
  const [errorMsg, setErrorMsg] = useState("");
  const [successCoins, setSuccessCoins] = useState(0);

  const { data: packages, isLoading: pkgLoading } = useQuery<CoinPackage[]>({
    queryKey: ["/api/payment/packages"],
    queryFn: () => fetch("/api/payment/packages").then(r => r.json()),
  });

  const { data: config } = useQuery<{ clientKey: string; isSandbox: boolean }>({
    queryKey: ["/api/payment/config"],
    queryFn: () => fetch("/api/payment/config").then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiRequest("POST", "/api/payment/topup/create", { packageId });
      return res.json();
    },
    onSuccess: async (data: any) => {
      if (!config?.clientKey) {
        setStep("error");
        setErrorMsg("Konfigurasi pembayaran belum tersedia. Hubungi admin.");
        return;
      }
      setStep("paying");
      try {
        await loadSnapScript(config.clientKey, config.isSandbox ?? true);
        if (!(window as any).snap) throw new Error("Midtrans Snap tidak tersedia");
        (window as any).snap.pay(data.token, {
          onSuccess: (_result: any) => {
            setSuccessCoins(data.coins);
            setStep("success");
            queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
            onSuccess?.();
          },
          onPending: (_result: any) => {
            setStep("error");
            setErrorMsg(`Pembayaran sedang diproses. ${data.coins} koin akan otomatis ditambahkan setelah pembayaran terkonfirmasi.`);
          },
          onError: (_result: any) => {
            setStep("error");
            setErrorMsg("Pembayaran gagal atau dibatalkan. Kamu bisa coba lagi.");
          },
          onClose: () => {
            if (step === "paying") setStep("pick");
          },
        });
      } catch (err: any) {
        setStep("error");
        setErrorMsg(err.message || "Gagal memuat halaman pembayaran.");
      }
    },
    onError: (err: any) => {
      setStep("error");
      setErrorMsg(err?.message || "Gagal membuat transaksi. Coba lagi.");
    },
  });

  const handleBuy = useCallback(() => {
    if (!selectedPkg || createMut.isPending) return;
    createMut.mutate(selectedPkg);
  }, [selectedPkg, createMut]);

  const selectedPkgData = packages?.find(p => p.id === selectedPkg);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-amber-500" />
            <span className="font-bold text-base text-foreground">Beli Koin</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="button-close-topup">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "success" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-foreground mb-1">Pembayaran Berhasil!</p>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-bold text-amber-500">{successCoins} koin</span> telah ditambahkan ke akunmu.
              </p>
              <p className="text-xs text-muted-foreground">Kamu sekarang bisa membuka chapter premium.</p>
              <button onClick={onClose} className="mt-6 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm" data-testid="button-success-close">
                Selesai
              </button>
            </div>
          ) : step === "error" ? (
            <div className="text-center py-6">
              <p className="font-semibold text-foreground mb-2">Ada Masalah</p>
              <p className="text-sm text-muted-foreground mb-5">{errorMsg}</p>
              <button
                onClick={() => { setStep("pick"); setErrorMsg(""); }}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                data-testid="button-retry-topup"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Pilih jumlah koin yang ingin kamu beli:</p>

              {pkgLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {packages?.map(pkg => {
                    const isPopular = pkg.id === "pkg_50";
                    const isSelected = selectedPkg === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg.id)}
                        className={`relative rounded-xl border-2 p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/8 shadow-sm"
                            : "border-border hover:border-amber-300 hover:bg-muted/30"
                        }`}
                        data-testid={`button-pkg-${pkg.id}`}
                      >
                        {isPopular && (
                          <span className="absolute -top-2.5 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                            POPULER
                          </span>
                        )}
                        <div className="flex items-center gap-1 mb-0.5">
                          <Coins size={13} className="text-amber-500" />
                          <span className="font-bold text-foreground">{pkg.coins}</span>
                          <span className="text-xs text-muted-foreground">koin</span>
                        </div>
                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {formatRupiah(pkg.price)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          ≈ {formatRupiah(pkg.price / pkg.coins)}/koin
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground justify-center">
                <Zap size={10} className="text-green-500" />
                GoPay · OVO · QRIS · Transfer Bank
              </div>

              <button
                onClick={handleBuy}
                disabled={!selectedPkg || createMut.isPending || step === "paying"}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                data-testid="button-buy-coins"
              >
                {createMut.isPending || step === "paying" ? (
                  <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                ) : selectedPkgData ? (
                  <><ShoppingBag size={15} /> Beli {selectedPkgData.coins} Koin — {formatRupiah(selectedPkgData.price)}</>
                ) : (
                  <><ShoppingBag size={15} /> Pilih Paket dulu</>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
