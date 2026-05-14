import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PenLine, CheckCircle2, Clock, ArrowLeft, LogIn, BookOpen, Heart, Zap } from "lucide-react";

export default function BecomeWriter() {
  const { user, isLoading, refetch } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const requestWriterMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/request-writer"),
    onSuccess: async () => {
      await refetch();
      toast({ title: "Permintaan terkirim!", description: "Admin akan segera meninjaunya." });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Terjadi kesalahan. Coba lagi.", variant: "destructive" });
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  const benefits = [
    { icon: <BookOpen size={18} className="text-primary" />, title: "Tulis & Publikasikan", desc: "Upload karya kamu langsung ke platform WOOCE Novel dan dapatkan pembaca setia." },
    { icon: <Heart size={18} className="text-primary" />, title: "Dukungan Pembaca", desc: "Terima donasi dari pembaca lewat Saweria atau Trakteer yang kamu daftarkan." },
    { icon: <Zap size={18} className="text-primary" />, title: "Kelola Ceritamu", desc: "Dashboard penulis untuk mengatur season, chapter, jadwal rilis, dan statistik." },
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
          <h1 className="text-2xl font-bold text-foreground">Daftar sebagai Penulis</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Bergabung dengan komunitas penulis WOOCE Novel. Tulis ceritamu, bangun pembaca setia, dan dapatkan dukungan langsung dari mereka.
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
              <p className="text-sm text-muted-foreground">Login dengan Google untuk mendaftar sebagai penulis.</p>
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity mx-auto"
                data-testid="button-google-login-writer"
              >
                <LogIn size={16} />
                Login dengan Google
              </button>
            </div>
          ) : isPending ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="font-semibold text-foreground">Permohonan sedang ditinjau</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tim admin akan meninjau permohonanmu. Kamu akan mendapat notifikasi setelah disetujui.
              </p>
            </div>
          ) : isAlreadyActive ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <p className="font-semibold text-foreground">Kamu sudah menjadi penulis aktif!</p>
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity" data-testid="button-go-home">
                  <ArrowLeft size={15} />
                  Kembali ke Beranda
                </button>
              </Link>
            </div>
          ) : isAdmin ? (
            <div className="p-6 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} className="text-blue-500" />
              </div>
              <p className="font-semibold text-foreground">Kamu adalah Admin</p>
              <p className="text-sm text-muted-foreground">Admin memiliki akses penuh ke seluruh platform.</p>
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
                Dengan mendaftar, kamu menyetujui untuk mengikuti panduan konten WOOCE Novel. Permohonan akan ditinjau oleh admin sebelum disetujui.
              </p>
              <button
                onClick={() => requestWriterMutation.mutate()}
                disabled={requestWriterMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-request-writer"
              >
                {requestWriterMutation.isPending ? "Mengirim..." : "Daftar sebagai Penulis"}
              </button>
            </div>
          )}
        </motion.div>

        <div className="text-center">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-home">
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
