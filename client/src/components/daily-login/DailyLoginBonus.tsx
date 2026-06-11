import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, CheckCircle2, Sparkles, ExternalLink, ArrowLeft, Instagram } from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const DAY_REWARDS = [1, 2, 3, 5, 7, 10, 20];
const QUEST_MILESTONES = [
  { days: 7,  bonus: 10 },
  { days: 14, bonus: 25 },
  { days: 30, bonus: 50 },
];

const SOCIAL_QUESTS = [
  { id: "tiktok",    label: "TikTok",    url: "https://www.tiktok.com/@woocenovel",  icon: <SiTiktok size={13} />,                     bigIcon: <SiTiktok size={28} />,                     color: "text-foreground", headerBg: "bg-zinc-900"                                        },
  { id: "facebook",  label: "Facebook",  url: "https://www.facebook.com/woocenovel", icon: <SiFacebook size={13} />,                   bigIcon: <SiFacebook size={28} />,                   color: "text-blue-600",   headerBg: "bg-blue-500"                                        },
  { id: "instagram", label: "Instagram", url: "https://instagram.com/woocenovel",    icon: <Instagram size={13} strokeWidth={1.75} />, bigIcon: <Instagram size={28} strokeWidth={1.75} />, color: "text-pink-500",   headerBg: "bg-gradient-to-br from-pink-500 to-purple-600"     },
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

  // Social quest popup state
  const [socialModal, setSocialModal] = useState<typeof SOCIAL_QUESTS[0] | null>(null);
  const [linkOpened, setLinkOpened] = useState(false);
  const [claimingSocial, setClaimingSocial] = useState(false);

  const { data: status } = useQuery<BonusStatus>({
    queryKey: ["/api/login-bonus/status"],
    queryFn: () => fetch("/api/login-bonus/status").then(r => r.json()),
    enabled: !!user && !user.isAdmin,
    staleTime: 60_000,
  });

  const { data: socialStatus, refetch: refetchSocial } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/quests/social"],
    queryFn: () => fetch("/api/quests/social", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && !user.isAdmin && open,
    staleTime: 30_000,
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

  async function handleClaimSocial() {
    if (!socialModal) return;
    setClaimingSocial(true);
    try {
      const res = await fetch(`/api/quests/social/${socialModal.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || "";
        if (msg === "Sudah diklaim") {
          toast({ title: "Quest ini sudah diklaim sebelumnya ✅", description: "Koin sudah masuk ke saldo kamu sebelumnya." });
          refetchSocial();
          setSocialModal(null);
          setLinkOpened(false);
        } else {
          toast({ title: msg || "Gagal klaim, coba lagi.", variant: "destructive" });
        }
      } else {
        toast({ title: `🎉 +50 Koin dari Quest Follow ${socialModal.label}!`, description: "Koin sudah ditambahkan ke saldo kamu." });
        queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
        queryClient.invalidateQueries({ queryKey: ["/api/coins/history"] });
        refetchSocial();
        setSocialModal(null);
        setLinkOpened(false);
      }
    } catch {
      toast({ title: "Gagal klaim, cek koneksi internet kamu.", variant: "destructive" });
    } finally {
      setClaimingSocial(false);
    }
  }

  function openSocialModal(q: typeof SOCIAL_QUESTS[0]) {
    setSocialModal(q);
    setLinkOpened(false);
  }

  function closeSocialModal() {
    setSocialModal(null);
    setLinkOpened(false);
  }

  function handleClose() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (!user || user.isAdmin) return null;

  const nextDay = status ? (status.currentDay % 7) + 1 : 1;
  const todayReward = DAY_REWARDS[nextDay - 1];
  const streak = result ? result.totalStreak : (status?.totalStreak ?? 0);
  const allSocialDone = SOCIAL_QUESTS.every(q => socialStatus?.[q.id] === true);

  return (
    <>
      {/* Main daily login dialog */}
      <Dialog open={open && !socialModal} onOpenChange={(v) => { if (!v) handleClose(); }}>
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

          <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
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

            {/* Quest Sosial Media — compact */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground">Quest Sosial Media</p>
                {allSocialDone && (
                  <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                    <CheckCircle2 size={11} /> Semua selesai
                  </span>
                )}
              </div>
              {SOCIAL_QUESTS.map(q => {
                const done = socialStatus?.[q.id] === true;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
                      done ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/20"
                    }`}
                    data-testid={`popup-quest-social-${q.id}`}
                  >
                    <span className={`shrink-0 ${q.color}`}>{q.icon}</span>
                    <span className="flex-1 text-xs font-medium text-foreground">Follow {q.label}</span>
                    <span className={`text-xs font-bold shrink-0 ${done ? "text-green-600" : "text-amber-600"}`}>+50 🪙</span>
                    {done ? (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <button
                        onClick={() => openSocialModal(q)}
                        className="shrink-0 text-[10px] font-semibold text-amber-700 border border-amber-300 rounded-md px-1.5 py-0.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        data-testid={`popup-button-open-social-${q.id}`}
                      >
                        Mulai
                      </button>
                    )}
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

      {/* Social Quest Popup — muncul di atas popup utama */}
      <Dialog open={!!socialModal} onOpenChange={(v) => { if (!v) closeSocialModal(); }}>
        <DialogContent className="max-w-xs p-0 overflow-hidden gap-0 [&>button]:hidden">
          {socialModal && (
            <>
              {/* Header bergradasi sesuai platform */}
              <div className={`px-5 pt-5 pb-4 flex flex-col items-center gap-2 ${socialModal.headerBg}`}>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  {socialModal.bigIcon}
                </div>
                <p className="text-white font-bold">Quest {socialModal.label}</p>
                <p className="text-white/80 text-xs text-center">
                  Follow <span className="font-bold text-white">@woocenovel</span> dan dapatkan <span className="font-bold text-white">50 Koin</span> gratis!
                </p>
              </div>

              <div className="px-4 py-4 space-y-3">
                {/* Step 1 — buka link */}
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${linkOpened ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${linkOpened ? "bg-green-500 text-white" : "bg-amber-500 text-white"}`}>
                    {linkOpened ? "✓" : "1"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Buka & Follow {socialModal.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">Tekan tombol di bawah, lalu follow akun @woocenovel</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => {
                        window.open(socialModal.url, "_blank", "noopener,noreferrer");
                        setLinkOpened(true);
                      }}
                      data-testid={`button-open-link-${socialModal.id}`}
                    >
                      <ExternalLink size={12} />
                      Buka {socialModal.label}
                    </Button>
                  </div>
                </div>

                {/* Step 2 — konfirmasi & klaim */}
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  !linkOpened ? "border-border bg-muted/20 opacity-40" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${linkOpened ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Konfirmasi & Klaim</p>
                    <p className="text-xs text-muted-foreground mb-2">Sudah follow? Klik klaim untuk terima koin.</p>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      disabled={!linkOpened || claimingSocial}
                      onClick={handleClaimSocial}
                      data-testid={`button-claim-social-${socialModal.id}`}
                    >
                      {claimingSocial ? "Mengklaim..." : "✓ Sudah Diikuti — Klaim 50 Koin"}
                    </Button>
                  </div>
                </div>

                {/* Tombol kembali */}
                <button
                  onClick={closeSocialModal}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1 flex items-center justify-center gap-1"
                  data-testid="button-back-social-quest"
                >
                  <ArrowLeft size={11} />
                  Kembali
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
