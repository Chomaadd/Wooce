import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, BookOpen, Lock } from "lucide-react";
import { Redirect } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function Login() {
  const { login, isLoggingIn, user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Redirect to="/admin/novel" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      toast({ title: t("admin.login.toast.success") });
    } catch (error: any) {
      toast({ title: t("admin.login.toast.error"), description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-muted/30 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4">

        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/25">
            <BookOpen size={26} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">WOOCE Novel</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
        </div>

        {/* Form card */}
        <div className="bg-background/80 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30">

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
              <Lock size={11} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">{t("admin.login.auth")}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground leading-snug" data-testid="text-login-title">
              {t("admin.login.welcome")} <span className="text-primary">Mad.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{t("admin.login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                {t("admin.login.username")}
              </label>
              <input
                id="username"
                required
                autoComplete="username"
                value={credentials.username}
                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/40 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
                placeholder="username"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                {t("admin.login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-muted/40 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
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
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
              data-testid="button-login"
            >
              {isLoggingIn ? (
                <><Loader2 size={16} className="animate-spin" /> {t("admin.login.authenticating")}</>
              ) : (
                t("admin.login.submit")
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6 tracking-wider uppercase">
          WOOCE Novel &middot; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
