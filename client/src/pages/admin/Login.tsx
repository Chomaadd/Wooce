import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, BookOpen, ShieldCheck } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Login gagal");
      }
      window.location.href = "/admin/novel";
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Helmet>
        <title>Login Admin — WOOCE Novel</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 items-center justify-center p-12 flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/10" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 mb-6 shadow-2xl overflow-hidden">
            <img
              src="/image/icon-navbar.png"
              alt="WOOCE Novel"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            WOOCE Novel
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Platform baca novel, komik, dan cerita pendek — dibangun dengan
            cinta untuk pembaca.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              "Kelola cerita & chapter dengan mudah",
              "Statistik views & rating real-time",
              "Upload & crop cover langsung dari browser",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-white/90 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="w-full max-w-sm relative">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img
              src="/image/icon-navbar.png"
              alt="WOOCE Novel"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <span className="font-bold text-foreground">WOOCE Novel</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                Autentikasi
              </span>
            </div>
            <h2
              className="text-2xl font-bold text-foreground leading-tight"
              data-testid="text-login-title"
            >
              Selamat datang kembali, <span className="text-primary">Mad.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Masuk untuk mengelola semua data Wooce Novel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground block"
              >
                Username
              </label>
              <input
                id="username"
                required
                autoComplete="username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/40 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40"
                placeholder="Masukkan username"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground block"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-muted/40 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/25 mt-1"
              data-testid="button-login"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />{" "}
                  Memverifikasi...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground/40 mt-8 tracking-wider uppercase">
            {new Date().getFullYear()} © Choomad Group. All Right Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
