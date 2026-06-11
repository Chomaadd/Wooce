import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

const SESSION_KEY = "dlb_dismissed";

export function DailyLoginBonus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const { data: status } = useQuery<BonusStatus>({
    queryKey: ["/api/login-bonus/status"],
    queryFn: () => fetch("/api/login-bonus/status").then(r => r.json()),
    enabled: !!user && !user.isAdmin,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!status?.canClaim) return;
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) setOpen(true);
  }, [status?.canClaim]);

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
      }
    },
    onError: (err: any) => {
      if (err.message?.includes("Sudah klaim")) { setOpen(false); return; }
      toast({ title: "Gagal klaim", description: err.message, variant: "destructive" });
    },
  });

  function handleClose() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (!user || user.isAdmin) return null;

  const nextDay = status ? (status.currentDay % 7) + 1 : 1;
  const todayReward = DAY_REWARDS[nextDay - 1];
  const streak = result ? result.totalStreak : (status?.totalStreak ?? 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0 [&>button]:hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 px-5 pt-5 pb-4 text-white">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            data-testid="button-close-login-bonus"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={18} className="text-white" />
            <span className="text-sm font-bold">Login Harian</span>
          </div>
          <div className="text-xs text-white/80">
            {streak > 0 ? `${streak} hari berturut-turut 🔥` : "Mulai streakmu sekarang!"}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* 7-day strip */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_REWARDS.map((coins, i) => {
              const dayNum = i + 1;
              const isDone = claimed
                ? dayNum <= (result?.currentDay ?? 0)
                : dayNum <= (status?.currentDay ?? 0);
              const isToday = claimed
                ? dayNum === (result?.currentDay ?? 0)
                : (status?.canClaim && dayNum === nextDay);
              return (
                <div
                  key={dayNum}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all ${
                    isToday
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-sm"
                      : isDone
                      ? "border-green-200 bg-green-50 dark:bg-green-950/30"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <span className={`text-[9px] font-bold ${isToday ? "text-amber-600" : isDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    H-{dayNum}
                  </span>
                  {isDone && !isToday ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <span className="text-[10px]">🪙</span>
                  )}
                  <span className={`text-[10px] font-bold ${isToday ? "text-amber-600" : isDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {coins}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quest milestones */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">Quest Login</p>
            {QUEST_MILESTONES.map(q => {
              const done = (status?.questProgress ?? []).find(p => p.days === q.days)?.alreadyDone
                || (result && result.totalStreak >= q.days);
              const progress = Math.min(streak, q.days);
              const pct = Math.round((progress / q.days) * 100);
              return (
                <div key={q.days} className={`flex items-center gap-2 p-2 rounded-lg border ${done ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/20"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-foreground">{q.days} hari berturut-turut</span>
                      <span className={`text-xs font-bold ${done ? "text-green-600" : "text-amber-600"}`}>+{q.bonus} 🪙</span>
                    </div>
                    {!done && (
                      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {!done && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{progress}/{q.days} hari</p>
                    )}
                  </div>
                  {done && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Claim result or button */}
          <AnimatePresence mode="wait">
            {claimed && result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-2 py-1"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-lg font-bold text-foreground">+{result.totalCoins} Koin!</span>
                  <Sparkles size={16} className="text-amber-500" />
                </div>
                {result.questBonus > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Termasuk bonus quest +{result.questBonus} koin 🎉
                  </p>
                )}
                <Button size="sm" variant="outline" className="w-full" onClick={handleClose}>
                  Tutup
                </Button>
              </motion.div>
            ) : (
              <motion.div key="claim">
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  onClick={() => claimMut.mutate()}
                  disabled={claimMut.isPending}
                  data-testid="button-claim-login-bonus"
                >
                  {claimMut.isPending ? "Mengklaim..." : `Klaim ${todayReward} Koin Hari Ini`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link to full page */}
          <Link href="/login-bonus" onClick={handleClose}>
            <button className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 flex items-center justify-center gap-1">
              <ExternalLink size={11} />
              Lihat halaman Login Harian
            </button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
