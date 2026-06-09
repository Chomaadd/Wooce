import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PenLine, CheckCircle2, Clock, ArrowLeft, LogIn, BookOpen, Heart, Zap, Ban, AlertTriangle, ShieldCheck } from "lucide-react";

function useMathCaptcha() {
  const [a, b] = useMemo(() => [
    Math.floor(Math.random() * 12) + 1,
    Math.floor(Math.random() * 12) + 1,
  ], []);
  const [answer, setAnswer] = useState("");
  const correct = answer.trim() !== "" && parseInt(answer, 10) === a + b;
  return { a, b, answer, setAnswer, correct };
}

interface CooldownInfo {
  type: "rejected" | "suspended";
  daysLeft: number;
}

function formatDetailedCooldown(endTimeMs: number) {
  const msLeft = Math.max(0, endTimeMs - Date.now());
  const totalSeconds = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes };
}

export default function BecomeWriter() {
  const { user, isLoading, refetch } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cooldown, setCooldown] = useState<CooldownInfo | null>(null);
  const captcha = useMathCaptcha();

  const requestWriterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/request-writer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: async () => {
      await refetch();
      toast({ title: t("becomeWriter.toast.success.title"), description: t("becomeWriter.toast.success.desc") });
    },
    onError: (error: any) => {
      if (error?.cooldown) {
        setCooldown({ type: error.cooldownType, daysLeft: error.daysLeft });
        return;
      }
      toast({ title: t("becomeWriter.toast.error.title"), description: t("becomeWriter.toast.error.desc"), variant: "destructive" });
    },
  });

  const handleGoogleLogin = () => {
    (window.top || window).location.href = "/auth/google";
  };

  const benefits = [
    { icon: <BookOpen size={18} className="text-primary" />, title: t("becomeWriter.benefit1.title"), desc: t("becomeWriter.benefit1.desc") },
    { icon: <Heart size={18} className="text-primary" />, title: t("becomeWriter.benefit2.title"), desc: t("becomeWriter.benefit2.desc") },
    { icon: <Zap size={18} className="text-primary" />, title: t("becomeWriter.benefit3.title"), desc: t("becomeWriter.benefit3.desc") },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  const isWriter = user?.role === "writer";
  const isPending = user?.role === "writer" && user?.status === "pending";
  const isAlreadyActive = user?.role === "writer" && user?.status === "active";
  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const isSuspended = user?.status === "suspended";

  const rejectedAt = (user as any)?.rejectedAt;
  const suspendedAt = (user as any)?.suspendedAt;

  // Live tick every minute for countdown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const rejectedEndMs = rejectedAt ? new Date(rejectedAt).getTime() + 7 * 86400000 : 0;
  const suspendedEndMs = suspendedAt ? new Date(suspendedAt).getTime() + 30 * 86400000 : 0;

  const rejectedDaysLeft = rejectedAt ? Math.max(0, Math.ceil((rejectedEndMs - Date.now()) / 86400000)) : 0;
  const suspendedDaysLeft = suspendedAt ? Math.max(0, Math.ceil((suspendedEndMs - Date.now()) / 86400000)) : 0;

  // Cooldown only shows if timestamp exists and days still remain
  const hasSuspendedCooldown = !!suspendedAt && suspendedDaysLeft > 0;
  const hasRejectedCooldown = !isSuspended && !!rejectedAt && rejectedDaysLeft > 0 && !isWriter;

  const activeCooldown = cooldown ?? (
    hasSuspendedCooldown ? { type: "suspended" as const, daysLeft: suspendedDaysLeft } :
    hasRejectedCooldown ? { type: "rejected" as const, daysLeft: rejectedDaysLeft } :
    null
  );

  // Detailed countdown for display
  const rejectedCountdown = formatDetailedCooldown(
    rejectedAt ? rejectedEndMs : Date.now() + (activeCooldown?.daysLeft ?? 0) * 86400000
  );
  const suspendedCountdown = formatDetailedCooldown(
    suspendedAt ? suspendedEndMs : Date.now() + (activeCooldown?.daysLeft ?? 0) * 86400000
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-5 py-16 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PenLine size={26} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("becomeWriter.title")}</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {t("becomeWriter.subtitle")}
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid gap-3"
        >
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                {b.icon}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA / Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden"
        >
          {!user ? (
            <div className="p-6 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{t("becomeWriter.login.text")}</p>
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity mx-auto"
                data-testid="button-google-login-writer"
              >
                <LogIn size={16} />
                {t("becomeWriter.login.button")}
              </button>
            </div>

          ) : activeCooldown?.type === "suspended" ? (
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                <Ban size={22} className="text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{t("becomeWriter.suspended.title")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  {t("becomeWriter.suspended.desc")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {[
                    { value: suspendedCountdown.days, label: "Hari" },
                    { value: suspendedCountdown.hours, label: "Jam" },
                    { value: suspendedCountdown.minutes, label: "Menit" },
                  ].map(({ value, label }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      {i > 0 && <span className="text-orange-400 font-bold text-lg">:</span>}
                      <div className="flex flex-col items-center bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 min-w-[58px]">
                        <span className="text-2xl font-bold text-orange-600 tabular-nums leading-none">
                          {String(value).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] font-medium text-orange-500 mt-0.5 uppercase tracking-wide">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} />
                  lagi untuk bisa mendaftar ulang
                </p>
              </div>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" data-testid="button-back-home-suspended">
                  <ArrowLeft size={14} />
                  {t("becomeWriter.back")}
                </button>
              </Link>
            </div>

          ) : activeCooldown?.type === "rejected" ? (
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{t("becomeWriter.rejected.title")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  {t("becomeWriter.rejected.desc")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {[
                    { value: rejectedCountdown.days, label: "Hari" },
                    { value: rejectedCountdown.hours, label: "Jam" },
                    { value: rejectedCountdown.minutes, label: "Menit" },
                  ].map(({ value, label }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      {i > 0 && <span className="text-red-400 font-bold text-lg">:</span>}
                      <div className="flex flex-col items-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 min-w-[58px]">
                        <span className="text-2xl font-bold text-red-600 tabular-nums leading-none">
                          {String(value).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] font-medium text-red-500 mt-0.5 uppercase tracking-wide">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} />
                  lagi untuk bisa mendaftar ulang
                </p>
              </div>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" data-testid="button-back-home-rejected">
                  <ArrowLeft size={14} />
                  {t("becomeWriter.back")}
                </button>
              </Link>
            </div>

          ) : isPending ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="font-semibold text-foreground">{t("becomeWriter.pending.title")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("becomeWriter.pending.desc")}
              </p>
            </div>

          ) : isAlreadyActive ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <p className="font-semibold text-foreground">{t("becomeWriter.active.title")}</p>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity" data-testid="button-go-home">
                  <ArrowLeft size={15} />
                  {t("becomeWriter.back")}
                </button>
              </Link>
            </div>

          ) : isAdmin ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} className="text-blue-500" />
              </div>
              <p className="font-semibold text-foreground">{t("becomeWriter.admin.title")}</p>
              <p className="text-sm text-muted-foreground">{t("becomeWriter.admin.desc")}</p>
            </div>

          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PenLine size={16} className="text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("becomeWriter.form.desc")}
              </p>

              {/* Math CAPTCHA */}
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <ShieldCheck size={13} className="text-primary" />
                  <span>{t("captcha.verify")}</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-sm text-foreground font-medium select-none">
                    {captcha.a} + {captcha.b} = ?
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={captcha.answer}
                    onChange={e => captcha.setAnswer(e.target.value)}
                    placeholder="..."
                    className={`w-20 px-3 py-1.5 rounded-lg border text-sm text-center bg-background outline-none transition-colors ${
                      captcha.answer === ""
                        ? "border-border"
                        : captcha.correct
                        ? "border-green-500 bg-green-500/5 text-green-700 dark:text-green-400"
                        : "border-destructive bg-destructive/5"
                    }`}
                    data-testid="input-captcha"
                  />
                  {captcha.correct && (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>

              <button
                onClick={() => requestWriterMutation.mutate()}
                disabled={requestWriterMutation.isPending || !captcha.correct}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-request-writer"
              >
                {requestWriterMutation.isPending ? t("becomeWriter.form.submitting") : t("becomeWriter.form.submit")}
              </button>
            </div>
          )}
        </motion.div>

        <div className="text-center">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-home">
              <ArrowLeft size={14} />
              {t("becomeWriter.back")}
            </button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
