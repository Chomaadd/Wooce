import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, CheckCircle2, Sparkles, ArrowLeft, Clock, Gift, Coins,
} from "lucide-react";

const DAY_REWARDS = [1, 2, 3, 5, 7, 10, 20];
const QUEST_MILESTONES = [
  { days: 7,  bonus: 10 },
  { days: 14, bonus: 25 },
  { days: 30, bonus: 50 },
];

interface BonusStatus {
  canClaim: boolean;
  currentDay: number;
  todayReward: number;
  totalStreak: number;
  dayRewards: number[];
  questProgress: { days: number; bonus: number; alreadyDone: boolean }[];
}

interface ClaimResult {
  coinsEarned: number;
  questBonus: number;
  questMilestone: number | null;
  totalStreak: number;
  currentDay: number;
  totalCoins: number;
}

function useCountdownToMidnight() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function update() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function LoginBonusPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const countdown = useCountdownToMidnight();
  const [claimed, setClaimed] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const { data: status, isLoading } = useQuery<BonusStatus>({
    queryKey: ["/api/login-bonus/status"],
    queryFn: () => fetch("/api/login-bonus/status", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
    refetchOnWindowFocus: true,
  });

  const { data: history } = useQuery<any[]>({
    queryKey: ["/api/coins/history"],
    queryFn: () => fetch("/api/coins/history", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin,
  });

  const bonusHistory = (history ?? []).filter((t: any) => t.type === "bonus").slice(0, 10);

  const claimMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/login-bonus/claim", {});
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal klaim");
      return data as ClaimResult;
    },
    onSuccess: (data) => {
      setClaimed(true);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/login-bonus/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/history"] });
      if (data.questBonus > 0) {
        toast({ title: `🎉 Quest Selesai! +${data.questBonus} koin bonus`, description: `${data.questMilestone} hari login berturut-turut!` });
      } else {
        toast({ title: `✅ +${data.totalCoins} koin berhasil diklaim!` });
      }
    },
    onError: (err: any) => {
      if (err.message?.includes("Sudah klaim")) {
        queryClient.invalidateQueries({ queryKey: ["/api/login-bonus/status"] });
        return;
      }
      toast({ title: "Gagal klaim", description: err.message, variant: "destructive" });
    },
  });

  if (!user || user.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Flame size={40} className="mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Login untuk melihat bonus harian kamu.</p>
            <Button onClick={() => navigate("/")}>Kembali ke Beranda</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentDay = result ? result.currentDay : (status?.currentDay ?? 0);
  const totalStreak = result ? result.totalStreak : (status?.totalStreak ?? 0);
  const canClaim = !claimed && (status?.canClaim ?? false);
  const nextDay = (currentDay % 7) + 1;
  const todayReward = DAY_REWARDS[nextDay - 1];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">

        {/* Back */}
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-foreground">Login Harian</h1>
        </div>

        {/* Streak hero */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white flex items-center gap-5">
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white/20 flex-shrink-0">
            <Flame size={28} className="text-white" />
            <span className="text-2xl font-black leading-none mt-0.5">{totalStreak}</span>
          </div>
          <div>
            <p className="text-white/80 text-sm">Streak saat ini</p>
            <p className="text-xl font-bold">{totalStreak === 0 ? "Belum mulai" : `${totalStreak} hari 🔥`}</p>
            <p className="text-white/70 text-xs mt-1">
              {canClaim ? "Kamu bisa klaim hari ini!" : `Kembali dalam ${countdown}`}
            </p>
          </div>
        </div>

        {/* 7-day strip */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Siklus 7 Hari</p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_REWARDS.map((coins, i) => {
              const dayNum = i + 1;
              const isDone = dayNum <= currentDay;
              const isToday = canClaim && dayNum === nextDay;
              const isTodayClaimed = claimed && dayNum === (result?.currentDay ?? 0);
              return (
                <div
                  key={dayNum}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all ${
                    isTodayClaimed ? "border-green-400 bg-green-50 dark:bg-green-950/40 shadow-sm"
                    : isToday ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-sm"
                    : isDone ? "border-green-200 bg-green-50/60 dark:bg-green-950/20"
                    : "border-border bg-muted/30"
                  }`}
                >
                  <span className={`text-[9px] font-bold ${isTodayClaimed || isToday ? "text-amber-600 dark:text-amber-400" : isDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    H-{dayNum}
                  </span>
                  {isDone && !isToday ? (
                    <CheckCircle2 size={15} className="text-green-500" />
                  ) : (
                    <span className="text-sm">🪙</span>
                  )}
                  <span className={`text-[11px] font-bold ${isTodayClaimed || isToday ? "text-amber-600 dark:text-amber-400" : isDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {coins}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Setelah hari ke-7, siklus ulang dari awal secara otomatis
          </p>
        </div>

        {/* Claim button */}
        <AnimatePresence mode="wait">
          {claimed && result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-5 text-center space-y-2"
            >
              <Sparkles size={24} className="mx-auto text-amber-500" />
              <p className="text-xl font-black text-foreground">+{result.totalCoins} Koin Diterima!</p>
              {result.questBonus > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Termasuk bonus quest {result.questMilestone} hari: +{result.questBonus} koin 🎉
                </p>
              )}
              <p className="text-xs text-muted-foreground">Kembali besok untuk klaim hari berikutnya</p>
            </motion.div>
          ) : canClaim ? (
            <motion.div key="claim" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                onClick={() => claimMut.mutate()}
                disabled={claimMut.isPending || isLoading}
                data-testid="button-claim-bonus-page"
              >
                {claimMut.isPending ? "Mengklaim..." : `🪙 Klaim ${todayReward} Koin Hari Ini`}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="wait" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-muted/30 p-5 text-center space-y-1.5"
            >
              <Clock size={22} className="mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Sudah klaim hari ini</p>
              <p className="text-xs text-muted-foreground">Kembali dalam</p>
              <p className="text-lg font-mono font-bold text-amber-600">{countdown}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quest milestones */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Quest Login</p>
          <div className="space-y-2.5">
            {QUEST_MILESTONES.map(q => {
              const questData = (status?.questProgress ?? []).find(p => p.days === q.days);
              const done = questData?.alreadyDone || (result && result.totalStreak >= q.days && !questData?.alreadyDone ? false : questData?.alreadyDone);
              const progress = Math.min(totalStreak, q.days);
              const pct = Math.round((progress / q.days) * 100);
              return (
                <div key={q.days} className={`p-3.5 rounded-xl border ${done ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/20"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <Gift size={16} className="text-amber-500" />
                      )}
                      <span className="text-sm font-semibold text-foreground">{q.days} hari berturut-turut</span>
                    </div>
                    <span className={`text-sm font-bold ${done ? "text-green-600" : "text-amber-600"}`}>+{q.bonus} 🪙</span>
                  </div>
                  {!done && (
                    <>
                      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{progress}/{q.days} hari ({pct}%)</p>
                    </>
                  )}
                  {done && <p className="text-xs text-green-600 dark:text-green-400">✅ Quest selesai! Bonus sudah diklaim.</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus history */}
        {bonusHistory.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Riwayat Bonus Login</p>
            <div className="divide-y divide-border/50">
              {bonusHistory.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 gap-3" data-testid={`row-bonus-history-${tx.id}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Coins size={13} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{tx.description || "Login Bonus"}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0">+{tx.amount} 🪙</span>
                </div>
              ))}
            </div>
            <Link href="/koin/riwayat">
              <button className="w-full text-xs text-primary hover:underline text-center py-1">
                Lihat semua transaksi koin →
              </button>
            </Link>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
