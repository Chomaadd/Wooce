import { X } from "lucide-react";
import { motion } from "framer-motion";
import { SiGoogle } from "react-icons/si";

export function LoginModal({ onClose }: { onClose: () => void }) {
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

          <a href="/auth/google" className="block w-full">
            <button
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm font-medium text-foreground shadow-sm"
              data-testid="button-login-google"
            >
              <SiGoogle size={16} className="text-[#4285F4]" />
              Lanjutkan dengan Google
            </button>
          </a>

          <p className="text-[11px] text-muted-foreground/50 mt-5 leading-relaxed px-2">
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
