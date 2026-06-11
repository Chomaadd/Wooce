import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [shook, setShook] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refetch } = useAuth();
  const { toast } = useToast();
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    return () => {
      popupRef.current?.close();
    };
  }, []);

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!agreed) {
      setShook(true);
      setTimeout(() => setShook(false), 2200);
      return;
    }

    const w = 500, h = 640;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const popup = window.open(
      "/auth/google",
      "wooce-google-login",
      `width=${w},height=${h},left=${left},top=${top},resizable=no,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
    );

    if (!popup || popup.closed) {
      toast({ title: "Popup diblokir", description: "Izinkan popup di browser kamu, lalu coba lagi.", variant: "destructive" });
      return;
    }

    popupRef.current = popup;
    setLoading(true);

    let done = false;

    const finish = async (success: boolean) => {
      if (done) return;
      done = true;
      clearInterval(authPoll);
      clearInterval(closedPoll);
      popup.close();
      if (success) {
        await refetch();
        toast({ title: "✅ Login berhasil!"});
        onClose();
      } else {
        setLoading(false);
      }
    };

    // Poll /api/auth/me — detects login regardless of cross-window restrictions
    const authPoll = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const user = await res.json();
          if (user?.id && !user.isAdmin) {
            finish(true);
          }
        }
      } catch {}
    }, 1500);

    // Also close modal if user manually closes popup
    const closedPoll = setInterval(() => {
      if (popup.closed) {
        if (!done) finish(false);
      }
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors z-10"
          data-testid="button-close-login-modal"
          aria-label="Tutup"
        >
          <X size={15} />
        </button>

        <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-md">
            <img
              src="/image/icon-navbar.png"
              alt="WOOCE Novel"
              className="w-full h-full object-cover scale-[1.4] object-center"
            />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">
            Login ke WOOCE Novel
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Masuk untuk menikmati semua fitur platform
          </p>

          {/* Checkbox persetujuan */}
          <div className="w-full mb-4">
            <label
              className={`flex items-start gap-3 cursor-pointer select-none text-left p-3 rounded-xl border transition-all ${
                agreed
                  ? "border-primary/40 bg-primary/5"
                  : shook
                  ? "border-destructive/60 bg-destructive/5"
                  : "border-border bg-muted/30 hover:border-border/80"
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="sr-only"
                  data-testid="checkbox-agree-terms"
                />
                <div
                  className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all ${
                    agreed
                      ? "bg-primary border-primary"
                      : shook
                      ? "border-destructive"
                      : "border-muted-foreground/40"
                  }`}
                >
                  <AnimatePresence>
                    {agreed && (
                      <motion.svg
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <span className="text-[11.5px] text-muted-foreground leading-relaxed">
                Saya telah membaca dan menyetujui{" "}
                <Link
                  href="/terms"
                  onClick={e => e.stopPropagation()}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Ketentuan Layanan
                </Link>{" "}
                dan{" "}
                <Link
                  href="/privacy"
                  onClick={e => e.stopPropagation()}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Kebijakan Privasi
                </Link>{" "}
                WOOCE Novel.
              </span>
            </label>

            <AnimatePresence>
              {shook && (
                <motion.p
                  key="warn"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-destructive mt-1.5 text-left pl-1"
                >
                  Centang kotak di atas terlebih dahulu untuk melanjutkan.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Tombol Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-medium shadow-sm ${
              loading
                ? "border-border/50 bg-muted/40 text-muted-foreground cursor-wait"
                : agreed
                ? "border-border bg-background hover:bg-muted text-foreground cursor-pointer"
                : "border-border/50 bg-muted/40 text-muted-foreground cursor-not-allowed"
            }`}
            data-testid="button-login-google"
            aria-disabled={!agreed || loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menunggu login...
              </>
            ) : (
              <>
                <FcGoogle size={18} className={agreed ? "" : "opacity-50"} />
                Lanjutkan dengan Google
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground/40 mt-5 leading-relaxed px-2">
            Site ini dilindungi oleh reCAPTCHA dan berlaku{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground transition-colors"
            >
              Kebijakan Privasi
            </a>{" "}
            dan{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground transition-colors"
            >
              Syarat Layanan
            </a>{" "}
            Google.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
