import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Save, ArrowLeft, ExternalLink, Check, X, Loader2, AlertCircle, Info, ShieldCheck, Monitor, Smartphone, Tablet, Chrome, Globe } from "lucide-react";
import { SiTiktok, SiInstagram, SiFacebook, SiX } from "react-icons/si";
import { Link } from "wouter";
import { isBannedNickname } from "@shared/bannedWords";

type LoginHistoryEntry = {
  _id: string;
  loginAt: string;
  ip: string | null;
  browser: string;
  os: string;
  device: string;
  method: "google" | "email" | "other";
};

type WriterMe = {
  id: string; name: string; email: string; photoUrl?: string | null;
  role: string; status: string; authorId?: string | null;
  author?: {
    id: string; name: string; slug: string; bio?: string | null; photoUrl?: string | null;
    tiktok?: string | null; instagram?: string | null; facebook?: string | null;
    twitter?: string | null; website?: string | null; saweria?: string | null;
    trakteer?: string | null; email?: string | null;
  } | null;
};

function InputField({ label, value, onChange, placeholder, hint, prefix }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; prefix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">{label}</label>
      {prefix ? (
        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-muted/30 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
          <span className="px-3 text-xs text-muted-foreground bg-muted/50 border-r border-border py-2.5 shrink-0">{prefix}</span>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/40"
        />
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "banned";

export default function WriterProfileSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || user.isAdmin || user.role !== "writer" || user.status !== "active")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const { data: writerData, isLoading } = useQuery<WriterMe>({
    queryKey: ["/api/writer/me"],
    queryFn: () => fetch("/api/writer/me", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && user.role === "writer" && user.status === "active",
  });

  const { data: loginHistory = [] } = useQuery<LoginHistoryEntry[]>({
    queryKey: ["/api/writer/login-history"],
    queryFn: () => fetch("/api/writer/login-history", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && user.role === "writer" && user.status === "active",
  });

  const [form, setForm] = useState({
    name: "", bio: "", slug: "",
    tiktok: "", instagram: "", facebook: "", twitter: "",
    website: "", saweria: "", trakteer: "",
  });
  const [dirty, setDirty] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugHint, setSlugHint] = useState("");
  const slugTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstTime = !!writerData && !writerData.author?.slug;

  useEffect(() => {
    if (writerData?.author) {
      const a = writerData.author;
      setForm({
        name: a.name ?? writerData.name ?? "",
        bio: a.bio ?? "",
        slug: a.slug ?? "",
        tiktok: a.tiktok ?? "",
        instagram: a.instagram ?? "",
        facebook: a.facebook ?? "",
        twitter: a.twitter ?? "",
        website: a.website ?? "",
        saweria: a.saweria ?? "",
        trakteer: a.trakteer ?? "",
      });
    } else if (writerData) {
      setForm(f => ({ ...f, name: writerData.name ?? "" }));
    }
    setDirty(false);
    setSlugStatus("idle");
    setSlugHint("");
  }, [writerData]);

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    setForm(f => ({ ...f, slug: clean }));
    setDirty(true);
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);

    if (!clean || clean.length < 4) {
      setSlugStatus("invalid");
      setSlugHint("Minimal 4 karakter, hanya huruf kecil, angka, dan tanda hubung");
      return;
    }
    if (isBannedNickname(clean)) {
      setSlugStatus("banned");
      setSlugHint("Username mengandung kata yang tidak diperbolehkan");
      return;
    }
    if (clean === writerData?.author?.slug) {
      setSlugStatus("idle");
      setSlugHint("");
      return;
    }
    setSlugStatus("checking");
    setSlugHint("");
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/writer/check-slug?slug=${clean}`, { credentials: "include" });
        const data = await res.json();
        if (data.available) {
          setSlugStatus("available");
          setSlugHint("Username tersedia");
        } else {
          if (data.reason?.includes("diperbolehkan")) {
            setSlugStatus("banned");
            setSlugHint("Username mengandung kata yang tidak diperbolehkan");
          } else {
            setSlugStatus("taken");
            setSlugHint("Username sudah dipakai, coba yang lain");
          }
        }
      } catch { setSlugStatus("idle"); setSlugHint(""); }
    }, 600);
  };

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/writer/profile", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/writer/me"] });
      if (writerData?.author?.slug) {
        qc.invalidateQueries({ queryKey: ["/api/authors", writerData.author.slug] });
      }
      toast({ title: "Profil berhasil disimpan!" });
      setDirty(false);
    },
    onError: (err: any) => {
      toast({ title: "Gagal menyimpan profil", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  const canSave =
    dirty &&
    slugStatus !== "taken" &&
    slugStatus !== "checking" &&
    slugStatus !== "banned" &&
    slugStatus !== "invalid" &&
    !(isFirstTime && !form.slug);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-10 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user || user.isAdmin || user.role !== "writer" || user.status !== "active") return null;

  const slug = writerData?.author?.slug;
  const displayPhoto = writerData?.author?.photoUrl || writerData?.photoUrl;

  const slugBorderClass =
    slugStatus === "available" ? "border-emerald-500 bg-emerald-500/5" :
    slugStatus === "taken" ? "border-destructive bg-destructive/5" :
    slugStatus === "invalid" ? "border-amber-500/60 bg-amber-500/5" :
    slugStatus === "banned" ? "border-destructive bg-destructive/5" :
    "border-border bg-muted/30";

  const slugHintClass =
    slugStatus === "available" ? "text-emerald-600 dark:text-emerald-400" :
    slugStatus === "taken" || slugStatus === "banned" ? "text-destructive" :
    slugStatus === "invalid" ? "text-amber-600 dark:text-amber-500" :
    "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Profil Penulis — WOOCE Novel" description="Kelola profil penulis kamu di WOOCE Novel" />
      <Navbar />

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/writer/cerita">
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground" data-testid="button-back-writer">
                <ArrowLeft size={16} />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Profil Publik Penulis</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Yang dilihat pembaca di halaman profilmu</p>
            </div>
          </div>
          {slug && (
            <a href={`/penulis/${slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ExternalLink size={12} /> Lihat Profil
            </a>
          )}
        </motion.div>

        {/* First-time notice */}
        {isFirstTime && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Atur username terlebih dahulu</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Sebelum profilmu bisa disimpan, kamu wajib mengisi <strong>Username / URL Profil</strong> di bawah. Username tidak bisa diubah sembarangan setelah disimpan.
              </p>
            </div>
          </motion.div>
        )}

        {/* Photo & Identity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-5">

          <div className="flex items-center gap-2">
            <User size={14} className="text-foreground" />
            <h2 className="text-sm font-bold text-foreground">Identitas</h2>
          </div>

          {/* Photo preview — read only, managed from profile photo system */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
              {displayPhoto ? (
                <img src={displayPhoto} alt="foto profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={20} className="text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Foto Profil</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Foto diambil otomatis dari akun Google-mu. Untuk menggantinya, gunakan menu <strong>Ganti Foto</strong> di halaman profil akun.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info size={11} />
                <span>Read-only</span>
              </div>
            </div>
          </div>

          <InputField
            label="Nama Penulis"
            value={form.name}
            onChange={v => set("name", v)}
            placeholder="Nama yang ditampilkan ke pembaca"
          />

          {/* Slug / username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
              Username / URL Profil
              {isFirstTime && <span className="ml-1.5 text-amber-600 dark:text-amber-400">*</span>}
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/30 ${slugBorderClass}`}>
              <span className="px-3 text-xs text-muted-foreground bg-muted/50 border-r border-border py-2.5 shrink-0">/penulis/</span>
              <input
                type="text"
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="username-kamu"
                className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
                data-testid="input-writer-slug"
              />
              <div className="px-3 flex-shrink-0">
                {slugStatus === "checking" && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                {slugStatus === "available" && <Check size={13} className="text-emerald-500" />}
                {(slugStatus === "taken" || slugStatus === "banned") && <X size={13} className="text-destructive" />}
              </div>
            </div>
            <p className={`text-[11px] ${slugHintClass}`}>
              {slugHint || "Hanya huruf kecil (a-z), angka (0-9), dan tanda hubung (–). Minimal 4 karakter."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              rows={3}
              placeholder="Ceritakan sedikit tentang dirimu sebagai penulis..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/40"
              data-testid="input-writer-bio"
            />
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <SiInstagram size={13} className="text-pink-500" /> Media Sosial
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="TikTok" value={form.tiktok} onChange={v => set("tiktok", v)} placeholder="username" prefix="@" />
            <InputField label="Instagram" value={form.instagram} onChange={v => set("instagram", v)} placeholder="username" prefix="@" />
            <InputField label="Facebook" value={form.facebook} onChange={v => set("facebook", v)} placeholder="username / halaman" prefix="fb/" />
            <InputField label="X / Twitter" value={form.twitter} onChange={v => set("twitter", v)} placeholder="username" prefix="@" />
          </div>
          <InputField label="Website / Blog" value={form.website} onChange={v => set("website", v)} placeholder="https://..." />
        </motion.div>

        {/* Donation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Dukungan Pembaca</h2>
          <p className="text-xs text-muted-foreground">Username akun Saweria/Trakteer-mu agar pembaca bisa mendukungmu.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Saweria" value={form.saweria} onChange={v => set("saweria", v)} placeholder="username" prefix="saweria.com/" />
            <InputField label="Trakteer" value={form.trakteer} onChange={v => set("trakteer", v)} placeholder="username" prefix="trakteer.id/" />
          </div>
        </motion.div>

        {/* Login History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Riwayat Akses</h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">20 sesi login terakhir di akunmu. Jika ada aktivitas yang tidak kamu kenali, segera ganti password.</p>
          {loginHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Belum ada riwayat login tercatat.</p>
          ) : (
            <div className="space-y-2">
              {loginHistory.map((entry, i) => {
                const DeviceIcon = entry.device === "Mobile" ? Smartphone : entry.device === "Tablet" ? Tablet : Monitor;
                const isFirst = i === 0;
                const date = new Date(entry.loginAt);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const diffHr = Math.floor(diffMin / 60);
                const diffDay = Math.floor(diffHr / 24);
                const relativeTime = diffMin < 1 ? "Baru saja"
                  : diffMin < 60 ? `${diffMin} menit lalu`
                  : diffHr < 24 ? `${diffHr} jam lalu`
                  : diffDay < 7 ? `${diffDay} hari lalu`
                  : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

                return (
                  <div key={entry._id}
                    data-testid={`login-history-item-${i}`}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isFirst ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                    <div className={`mt-0.5 shrink-0 ${isFirst ? "text-primary" : "text-muted-foreground"}`}>
                      <DeviceIcon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isFirst ? "text-primary" : "text-foreground"}`}>
                          {entry.browser} · {entry.os}
                        </span>
                        {isFirst && (
                          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">Sesi ini</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">{relativeTime}</span>
                        {entry.ip && <span className="text-[11px] text-muted-foreground font-mono">{entry.ip}</span>}
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          {entry.method === "google" ? <><Globe size={10} /> Google</> : <><Chrome size={10} /> Email</>}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Save button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {isFirstTime && !form.slug && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mb-3 flex items-center justify-center gap-1.5">
              <AlertCircle size={12} /> Isi username terlebih dahulu untuk bisa menyimpan profil
            </p>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !canSave}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="button-save-writer-profile"
          >
            {saveMutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={15} /> {dirty ? "Simpan Perubahan" : "Tersimpan"}</>
            )}
          </button>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}
