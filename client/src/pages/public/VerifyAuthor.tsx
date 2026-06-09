import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BadgeCheck, Clock, ArrowLeft, LogIn, CheckCircle2,
  BookOpen, Link2, Hash, FileText, MessageSquare, ChevronRight,
  AlertTriangle, ShieldCheck, Star, Users, Award,
} from "lucide-react";

const GENRES = [
  "Romance", "Fantasy", "Action", "Adventure", "Horror",
  "Mystery", "Thriller", "Sci-Fi", "Slice of Life", "Comedy",
  "Drama", "Historical", "Isekai", "BL / GL", "Lainnya",
];

const REQUIREMENTS = [
  {
    icon: <BookOpen size={16} className="text-primary" />,
    title: "Novel Original",
    desc: "Novel yang diajukan harus karya asli kamu sendiri, bukan terjemahan atau plagiat.",
  },
  {
    icon: <Hash size={16} className="text-primary" />,
    title: "Minimal 10 Chapter",
    desc: "Novel harus memiliki minimal 10 chapter yang sudah dipublikasikan secara online.",
  },
  {
    icon: <Users size={16} className="text-primary" />,
    title: "Memiliki Pembaca Aktif",
    desc: "Novel sudah dikenal dan memiliki pembaca atau pengikut aktif di platform manapun.",
  },
  {
    icon: <Star size={16} className="text-primary" />,
    title: "Penulis Aktif di WOOCE",
    desc: "Akun sudah terdaftar sebagai penulis aktif di WOOCE Novel.",
  },
  {
    icon: <Award size={16} className="text-primary" />,
    title: "Satu Pengajuan per 30 Hari",
    desc: "Jika pengajuan ditolak, kamu harus menunggu 30 hari sebelum bisa mengajukan kembali.",
  },
];

export default function VerifyAuthor() {
  const { user, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    novelTitle: "",
    novelGenre: "",
    novelLink: "",
    totalChapters: "",
    synopsis: "",
    reason: "",
  });

  const verificationStatus = (user as any)?.verificationStatus ?? "none";
  const verificationRejectedAt = (user as any)?.verificationRejectedAt;

  // Live tick every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const verifEndMs = verificationRejectedAt
    ? new Date(verificationRejectedAt).getTime() + 30 * 86400000
    : 0;
  const rejectedDaysLeft = verificationRejectedAt
    ? Math.max(0, Math.ceil((verifEndMs - Date.now()) / 86400000))
    : 0;
  const hasRejectedCooldown = !!verificationRejectedAt && rejectedDaysLeft > 0;

  const msLeft = Math.max(0, verifEndMs - Date.now());
  const totalSeconds = Math.floor(msLeft / 1000);
  const cdDays = Math.floor(totalSeconds / 86400);
  const cdHours = Math.floor((totalSeconds % 86400) / 3600);
  const cdMinutes = Math.floor((totalSeconds % 3600) / 60);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/writer/request-verification", {
        ...form,
        totalChapters: Number(form.totalChapters),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/writer/me"] });
      toast({ title: "Pengajuan Terkirim!", description: "Admin akan segera meninjau pengajuan verifikasimu." });
    },
    onError: (err: any) => {
      toast({ title: "Gagal Mengajukan", description: err?.message ?? "Terjadi kesalahan", variant: "destructive" });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.novelGenre) {
      toast({ title: "Genre wajib dipilih", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

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

  const isNotWriter = !user || user.role === "reader";
  const isAdmin = user?.role === "admin" || (user as any)?.isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-5 py-14 space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BadgeCheck size={26} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ajukan Verifikasi Penulis</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Dapatkan centang biru di profilmu sebagai tanda penulis terverifikasi di WOOCE Novel.
          </p>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Persyaratan Verifikasi</h2>
          </div>
          <div className="grid gap-3">
            {REQUIREMENTS.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {r.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA / Form / Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden"
        >

          {/* Not logged in */}
          {!user ? (
            <div className="p-8 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Kamu perlu login terlebih dahulu untuk mengajukan verifikasi.</p>
              <button
                onClick={() => { (window.top || window).location.href = "/auth/google"; }}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity mx-auto"
                data-testid="button-google-login-verify"
              >
                <LogIn size={16} />
                Login dengan Google
              </button>
            </div>

          ) : isAdmin ? (
            <div className="p-8 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <ShieldCheck size={22} className="text-blue-500" />
              </div>
              <p className="font-semibold text-foreground">Kamu adalah Admin</p>
              <p className="text-sm text-muted-foreground">Admin tidak perlu mengajukan verifikasi penulis.</p>
            </div>

          ) : isNotWriter ? (
            <div className="p-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <AlertTriangle size={22} className="text-yellow-500" />
              </div>
              <p className="font-bold text-foreground">Kamu belum terdaftar sebagai Penulis</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kamu harus mendaftar dan disetujui sebagai penulis terlebih dahulu sebelum bisa mengajukan verifikasi.
              </p>
              <Link href="/daftar-penulis">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity" data-testid="button-go-register-writer">
                  Daftar Jadi Penulis
                  <ChevronRight size={15} />
                </button>
              </Link>
            </div>

          ) : verificationStatus === "verified" ? (
            <div className="p-8 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={22} className="text-green-500" />
              </div>
              <p className="font-bold text-foreground">Akun Sudah Terverifikasi!</p>
              <p className="text-sm text-muted-foreground">Profilmu sudah memiliki centang biru sebagai penulis terverifikasi.</p>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" data-testid="button-back-home-verified">
                  <ArrowLeft size={14} />
                  Kembali ke Beranda
                </button>
              </Link>
            </div>

          ) : verificationStatus === "pending" ? (
            <div className="p-8 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Clock size={22} className="text-yellow-500" />
              </div>
              <p className="font-bold text-foreground">Pengajuan Sedang Ditinjau</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Admin sedang meninjau pengajuan verifikasimu. Harap bersabar, proses ini biasanya memakan waktu 1–3 hari kerja.
              </p>
            </div>

          ) : hasRejectedCooldown ? (
            <div className="p-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">Pengajuan Ditolak</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Pengajuan verifikasimu sebelumnya tidak memenuhi syarat. Kamu bisa mengajukan kembali setelah masa tunggu selesai.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {[
                    { value: cdDays, label: "Hari" },
                    { value: cdHours, label: "Jam" },
                    { value: cdMinutes, label: "Menit" },
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
                  lagi untuk bisa mengajukan verifikasi ulang
                </p>
              </div>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors" data-testid="button-back-home-rejected-verify">
                  <ArrowLeft size={14} />
                  Kembali ke Beranda
                </button>
              </Link>
            </div>

          ) : (
            /* The main form */
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* User info strip */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck size={16} className="text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Isi form di bawah dengan informasi lengkap mengenai novel yang kamu ajukan untuk verifikasi. Semua data harus akurat.
              </p>

              {/* Novel Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <BookOpen size={12} />
                  Judul Novel <span className="text-red-500">*</span>
                </label>
                <input
                  name="novelTitle"
                  value={form.novelTitle}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Sang Penguasa Kegelapan"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40 transition-all"
                  data-testid="input-novel-title"
                />
              </div>

              {/* Genre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FileText size={12} />
                  Genre / Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="novelGenre"
                  value={form.novelGenre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                  data-testid="select-novel-genre"
                >
                  <option value="">Pilih genre...</option>
                  {GENRES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Novel Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Link2 size={12} />
                  Link Novel <span className="text-red-500">*</span>
                </label>
                <input
                  name="novelLink"
                  type="url"
                  value={form.novelLink}
                  onChange={handleChange}
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40 transition-all"
                  data-testid="input-novel-link"
                />
                <p className="text-[11px] text-muted-foreground/60">Link ke halaman novel di platform tempatmu mempublikasikannya.</p>
              </div>

              {/* Total Chapters */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Hash size={12} />
                  Jumlah Chapter yang Sudah Terbit <span className="text-red-500">*</span>
                </label>
                <input
                  name="totalChapters"
                  type="number"
                  min={1}
                  value={form.totalChapters}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 25"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40 transition-all"
                  data-testid="input-total-chapters"
                />
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FileText size={12} />
                  Sinopsis Novel <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="synopsis"
                  value={form.synopsis}
                  onChange={handleChange}
                  required
                  minLength={50}
                  rows={4}
                  placeholder="Ceritakan secara singkat tentang novelmu... (minimal 50 karakter)"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40 transition-all resize-none"
                  data-testid="textarea-synopsis"
                />
                <p className="text-[11px] text-muted-foreground/60">{form.synopsis.length} / 50 karakter minimum</p>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  Alasan Pengajuan Verifikasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  minLength={30}
                  rows={3}
                  placeholder="Mengapa novelmu layak mendapatkan verifikasi? Sebutkan pencapaian, jumlah pembaca, atau hal lain yang relevan... (minimal 30 karakter)"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40 transition-all resize-none"
                  data-testid="textarea-reason"
                />
                <p className="text-[11px] text-muted-foreground/60">{form.reason.length} / 30 karakter minimum</p>
              </div>

              {/* Warning */}
              <div className="flex gap-3 p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                  Pastikan semua informasi yang kamu isi sudah benar dan dapat diverifikasi. Pengajuan palsu atau tidak memenuhi syarat akan ditolak dan kamu harus menunggu <strong>30 hari</strong> untuk mengajukan kembali.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-submit-verification"
              >
                {submitMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Mengirim Pengajuan...</>
                ) : (
                  <><BadgeCheck size={16} /> Kirim Pengajuan Verifikasi</>
                )}
              </button>
            </form>
          )}
        </motion.div>

        <div className="text-center">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-home-verify">
              <ArrowLeft size={14} />
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
