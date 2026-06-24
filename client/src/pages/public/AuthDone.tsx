import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuthDone() {
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("result") || "error";

    // 1. postMessage ke parent window (LoginModal listener)
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "wooce-auth", result }, window.location.origin);
      }
    } catch {}

    // 2. localStorage sebagai backup (LoginModal onStorage listener)
    try {
      localStorage.setItem("wooce-auth-result", JSON.stringify({ result, ts: Date.now() }));
    } catch {}

    // 3. Tutup popup otomatis setelah sedikit delay
    const t = setTimeout(() => {
      try { window.close(); } catch {}
    }, 500);

    return () => clearTimeout(t);
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-12 h-12 rounded-2xl overflow-hidden mx-auto mb-4 shadow">
          <img
            src="/image/icon-navbar.png"
            alt="WOOCE Novel"
            className="w-full h-full object-cover scale-[1.4] object-center"
          />
        </div>
        <p className="text-sm text-muted-foreground">Menyelesaikan login...</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Jendela ini akan tertutup otomatis.</p>
      </div>
    </div>
  );
}
