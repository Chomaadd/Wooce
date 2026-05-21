import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, BookOpen, ArrowLeft, Trash2, Eye,
  AlertTriangle, X,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const STATUS_CONFIG: Record<string, { badge: string; dot: string }> = {
  ongoing:   { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400"   },
  hiatus:    { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400"  },
};
const STATUS_LABEL: Record<string, string> = {
  ongoing: "Berlangsung", completed: "Selesai", hiatus: "Hiatus",
};

interface FollowedStory {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  category: string;
  status: string;
  tags: string[];
  published: boolean;
  viewCount: number;
}

function UnfollowAllConfirm({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Unfollow Semua Cerita?</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Kamu tidak akan menerima notifikasi chapter baru dari semua cerita yang kamu ikuti. Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            data-testid="button-cancel-unfollow-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            data-testid="button-confirm-unfollow-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-destructive-foreground/40 border-t-destructive-foreground animate-spin" />
                Memproses...
              </span>
            ) : "Ya, Unfollow Semua"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function FollowedStories() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [confirmUnfollowAll, setConfirmUnfollowAll] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const isLoggedIn = !!user && !user.isAdmin;

  const { data: stories, isLoading } = useQuery<FollowedStory[]>({
    queryKey: ["/api/novel/me/followed"],
    queryFn: async () => {
      const r = await fetch("/api/novel/me/followed", { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: isLoggedIn,
  });

  const unfollowOne = useMutation({
    mutationFn: (storyId: string) =>
      apiRequest("DELETE", `/api/novel/stories/${storyId}/follow`),
    onMutate: (storyId) => setUnfollowingId(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/me/followed"] });
      toast({ title: "Berhasil unfollow cerita." });
    },
    onError: () => toast({ title: "Gagal unfollow", variant: "destructive" }),
    onSettled: () => setUnfollowingId(null),
  });

  const unfollowAll = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/novel/me/followed/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/me/followed"] });
      setConfirmUnfollowAll(false);
      toast({ title: "Semua cerita berhasil di-unfollow." });
    },
    onError: () => toast({ title: "Gagal unfollow semua", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Cerita yang Diikuti"
        description="Daftar semua cerita yang kamu ikuti di WOOCE Novel."
        url="/mengikuti"
      />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/">
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                data-testid="button-back-home"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell size={16} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Cerita yang Diikuti</h1>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Memuat..." : `${stories?.length ?? 0} cerita`}
                </p>
              </div>
            </div>
          </div>

          {stories && stories.length > 0 && (
            <button
              onClick={() => setConfirmUnfollowAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors"
              data-testid="button-unfollow-all"
            >
              <Trash2 size={13} /> Unfollow Semua
            </button>
          )}
        </div>

        {/* Content */}
        {!isLoggedIn && !authLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BellOff size={44} className="text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium mb-2">Kamu belum login</p>
            <p className="text-sm text-muted-foreground/70">Login untuk melihat cerita yang kamu ikuti.</p>
            <Link href="/">
              <button className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Ke Beranda
              </button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4 border border-border rounded-2xl">
                <Skeleton className="w-14 aspect-[2/3] rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !stories?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <BellOff size={44} className="text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium mb-1">Belum ada cerita yang diikuti</p>
            <p className="text-sm text-muted-foreground/70 max-w-xs">
              Klik tombol <Bell size={11} className="inline" /> <strong>Ikuti</strong> di halaman detail cerita untuk mendapat notifikasi chapter baru.
            </p>
            <Link href="/">
              <button
                className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-explore-stories"
              >
                Jelajahi Cerita
              </button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <AnimatePresence>
              {stories.map(story => {
                const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
                const isUnfollowing = unfollowingId === story.id;
                return (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                    className="flex gap-3 p-4 border border-border rounded-2xl bg-card/60 hover:bg-card transition-colors group"
                    data-testid={`card-followed-story-${story.id}`}
                  >
                    {/* Cover */}
                    <Link href={`/${story.slug}`}>
                      <div className="w-14 aspect-[2/3] rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer">
                        {story.coverUrl ? (
                          <img
                            src={story.coverUrl}
                            alt={story.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <BookOpen size={16} className="text-primary/30" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/${story.slug}`}>
                        <p
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-snug mb-1.5"
                          data-testid={`text-story-title-${story.id}`}
                        >
                          {story.title}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                          {STATUS_LABEL[story.status] ?? story.status}
                        </span>
                        <span className="text-[10px] capitalize bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {story.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Eye size={10} /> {story.viewCount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => unfollowOne.mutate(story.id)}
                          disabled={isUnfollowing}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-destructive/8"
                          data-testid={`button-unfollow-${story.id}`}
                        >
                          {isUnfollowing ? (
                            <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground animate-spin" />
                          ) : (
                            <X size={12} />
                          )}
                          Unfollow
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <Footer />

      {/* Unfollow All Confirm Modal */}
      <AnimatePresence>
        {confirmUnfollowAll && (
          <UnfollowAllConfirm
            onConfirm={() => unfollowAll.mutate()}
            onCancel={() => setConfirmUnfollowAll(false)}
            loading={unfollowAll.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
