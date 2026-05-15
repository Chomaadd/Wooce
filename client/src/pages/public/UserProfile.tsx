import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Bookmark, BookmarkX, Eye, BookMarked,
  PenLine, LogOut, User, Star, ExternalLink, Edit2, Check, X,
} from "lucide-react";
import type { NovelStory } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type StoryWithStats = NovelStory & { totalChapters: number; lastChapterAt: string | null };

const STATUS_CFG: Record<string, { color: string; dot: string }> = {
  ongoing:   { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  hiatus:    { color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400" },
};

function fmtViews(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

type AuthorData = {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  socialLinks?: Record<string, string>;
  donationLinks?: Record<string, string>;
};

export default function UserProfile() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [bookmarkSlugs, setBookmarkSlugs] = useState<string[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioVal, setBioVal] = useState("");
  const [socialVals, setSocialVals] = useState<Record<string, string>>({});
  const [donationVals, setDonationVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || user.isAdmin)) navigate("/");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("novel-bookmarks") || "[]");
      setBookmarkSlugs(Array.isArray(saved) ? saved : []);
    } catch { setBookmarkSlugs([]); }
  }, []);

  const { data: allStories, isLoading: storiesLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/novel/stories"],
    enabled: !!user,
  });

  const { data: writerStories, isLoading: writerLoading } = useQuery<(NovelStory & { totalChapters: number })[]>({
    queryKey: ["/api/writer/stories"],
    queryFn: () => fetch("/api/writer/stories", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && user.role === "writer" && user.status === "active",
  });

  const { data: authorData } = useQuery<AuthorData>({
    queryKey: ["/api/writer/me"],
    queryFn: () => fetch("/api/writer/me", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && user.role === "writer" && user.status === "active",
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/writer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(r => { if (!r.ok) throw new Error("Gagal menyimpan"); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writer/me"] });
      setEditingProfile(false);
      toast({ title: "Profil berhasil disimpan!" });
    },
    onError: () => toast({ title: "Gagal menyimpan profil", variant: "destructive" }),
  });

  const bookmarked = useMemo(
    () => (allStories ?? []).filter(s => bookmarkSlugs.includes(s.slug)),
    [allStories, bookmarkSlugs],
  );

  const removeBookmark = (slug: string) => {
    const next = bookmarkSlugs.filter(s => s !== slug);
    setBookmarkSlugs(next);
    try { localStorage.setItem("novel-bookmarks", JSON.stringify(next)); } catch {}
  };

  const openEdit = () => {
    setBioVal(authorData?.bio ?? "");
    setSocialVals({ ...authorData?.socialLinks });
    setDonationVals({ ...authorData?.donationLinks });
    setEditingProfile(true);
  };

  const saveProfile = () => {
    const cleanSocial = Object.fromEntries(Object.entries(socialVals).filter(([, v]) => v.trim()));
    const cleanDonation = Object.fromEntries(Object.entries(donationVals).filter(([, v]) => v.trim()));
    updateProfile.mutate({ bio: bioVal, socialLinks: cleanSocial, donationLinks: cleanDonation });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user || user.isAdmin) return null;

  const isWriter = user.role === "writer" && user.status === "active";

  const SOCIAL_FIELDS = [
    { key: "tiktok", label: "TikTok" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "twitter", label: "X / Twitter" },
    { key: "website", label: "Website" },
  ];

  const DONATION_FIELDS = [
    { key: "saweria", label: "Saweria" },
    { key: "trakteer", label: "Trakteer" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={`Profil — WOOCE Novel`} description="Halaman profil WOOCE Novel." />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 lg:px-6 py-8 space-y-6">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5"
        >
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name ?? ""}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20 flex-shrink-0"
              data-testid="img-profile-photo"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground truncate" data-testid="text-profile-name">{user.name}</h1>
              {isWriter && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <PenLine size={9} /> Penulis
                </span>
              )}
              {user.role === "writer" && user.status === "pending" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                  Menunggu Approval
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate" data-testid="text-profile-email">{user.email}</p>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Bookmark size={10} /> {bookmarked.length} bookmark</span>
              {isWriter && <span className="flex items-center gap-1"><BookOpen size={10} /> {writerStories?.length ?? 0} cerita</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {isWriter && (
              <Link href="/writer/cerita">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  data-testid="button-go-writer-dashboard"
                >
                  <PenLine size={12} /> Kelola Cerita
                </button>
              </Link>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
              data-testid="button-profile-logout"
            >
              <LogOut size={12} /> Keluar
            </button>
          </div>
        </motion.div>

        {/* Writer public profile section */}
        {isWriter && authorData && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User size={13} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">Profil Publik Penulis</h2>
                  <p className="text-[11px] text-muted-foreground">Yang dilihat pembaca di halaman profilmu</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/penulis/${authorData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                  data-testid="link-view-author-profile"
                >
                  <ExternalLink size={11} /> Lihat
                </a>
                {!editingProfile && (
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    data-testid="button-edit-profile"
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-1.5">
              <p className="text-[11px] text-muted-foreground">
                URL Profil: <span className="font-mono text-primary">/penulis/{authorData.slug}</span>
              </p>
            </div>

            <AnimatePresence mode="wait">
              {editingProfile ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Bio</label>
                    <textarea
                      value={bioVal}
                      onChange={e => setBioVal(e.target.value)}
                      rows={3}
                      placeholder="Ceritakan sedikit tentang dirimu sebagai penulis..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40"
                      data-testid="input-bio"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Media Sosial</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SOCIAL_FIELDS.map(f => (
                        <div key={f.key} className="space-y-1">
                          <span className="text-[10px] text-muted-foreground">{f.label}</span>
                          <input
                            type="url"
                            value={socialVals[f.key] ?? ""}
                            onChange={e => setSocialVals(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={`https://...`}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/30"
                            data-testid={`input-social-${f.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Donasi</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DONATION_FIELDS.map(f => (
                        <div key={f.key} className="space-y-1">
                          <span className="text-[10px] text-muted-foreground">{f.label}</span>
                          <input
                            type="url"
                            value={donationVals[f.key] ?? ""}
                            onChange={e => setDonationVals(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={`https://...`}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/30"
                            data-testid={`input-donation-${f.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveProfile}
                      disabled={updateProfile.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                      data-testid="button-save-profile"
                    >
                      <Check size={12} /> {updateProfile.isPending ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button
                      onClick={() => setEditingProfile(false)}
                      disabled={updateProfile.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      data-testid="button-cancel-edit"
                    >
                      <X size={12} /> Batal
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5 space-y-3"
                >
                  {authorData.bio ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{authorData.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">Belum ada bio. Klik Edit untuk menambahkan.</p>
                  )}
                  {authorData.socialLinks && Object.keys(authorData.socialLinks).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(authorData.socialLinks).map(([k, v]) => v && (
                        <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors capitalize"
                          data-testid={`link-social-${k}`}
                        >
                          {k}
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Writer stories section */}
        {isWriter && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PenLine size={13} className="text-primary" />
                </div>
                <h2 className="font-bold text-sm text-foreground">Cerita Saya</h2>
              </div>
              <Link href="/writer/cerita">
                <button className="text-[11px] text-primary hover:underline font-semibold" data-testid="link-manage-stories">
                  Kelola semua →
                </button>
              </Link>
            </div>

            {writerLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[1,2,3].map(i => <Skeleton key={i} className="aspect-[2/3] rounded-xl" />)}
              </div>
            ) : !writerStories || writerStories.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-10 text-center">
                <BookOpen size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada cerita. Mulai tulis sekarang!</p>
                <Link href="/writer/cerita">
                  <button className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90" data-testid="button-start-writing">
                    Mulai Nulis
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {writerStories.slice(0, 8).map((story, i) => {
                  const cfg = STATUS_CFG[story.status] ?? STATUS_CFG.ongoing;
                  return (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group"
                      data-testid={`card-writer-story-${story.id}`}
                    >
                      <Link href={`/${story.slug}`}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-1.5 bg-muted relative shadow-sm cursor-pointer">
                          {story.coverUrl ? (
                            <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <BookOpen size={18} className="text-primary/40" />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                              <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                              {story.status}
                            </span>
                          </div>
                          {!story.published && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                              Draft
                            </div>
                          )}
                        </div>
                        <h3 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {story.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Eye size={8} />{fmtViews(story.viewCount)}</span>
                        <span className="flex items-center gap-0.5"><BookMarked size={8} />{(story as any).totalChapters ?? 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Bookmarks section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bookmark size={13} className="text-primary" />
            </div>
            <h2 className="font-bold text-sm text-foreground">Bookmark Novel</h2>
            <span className="text-xs text-muted-foreground">({bookmarked.length})</span>
          </div>

          {storiesLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-[2/3] rounded-xl" />)}
            </div>
          ) : bookmarked.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-10 text-center">
              <BookmarkX size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada novel yang di-bookmark.</p>
              <Link href="/">
                <button className="mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors" data-testid="button-browse-novels">
                  Jelajahi Novel
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {bookmarked.map((story, i) => {
                const cfg = STATUS_CFG[story.status] ?? STATUS_CFG.ongoing;
                const progress = (() => {
                  try {
                    const saved = localStorage.getItem(`novel-progress-${story.slug}`);
                    return saved ? JSON.parse(saved) : null;
                  } catch { return null; }
                })();
                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group relative"
                    data-testid={`card-bookmark-${story.id}`}
                  >
                    <Link href={progress ? `/${story.slug}/season-${progress.seasonNum}/bab-${progress.chapterNum}` : `/${story.slug}`}>
                      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-1.5 bg-muted relative shadow-sm cursor-pointer">
                        {story.coverUrl ? (
                          <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <BookOpen size={18} className="text-primary/40" />
                          </div>
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.color}`}>
                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                            {story.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {story.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye size={8} />{fmtViews(story.viewCount)}
                        {story.totalChapters > 0 && <><BookMarked size={8} />{story.totalChapters}</>}
                      </div>
                      <button
                        onClick={e => { e.preventDefault(); removeBookmark(story.slug); }}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        title="Hapus bookmark"
                        data-testid={`button-remove-bookmark-${story.id}`}
                      >
                        <BookmarkX size={11} />
                      </button>
                    </div>
                    {progress && (
                      <div className="mt-0.5 text-[9px] text-primary font-medium truncate">
                        Lanjut Bab {progress.chapterNum}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reading activity */}
        <section className="pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star size={13} className="text-primary" />
            </div>
            <h2 className="font-bold text-sm text-foreground">Aktivitas Baca</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Bookmark", value: bookmarked.length, icon: <Bookmark size={14} className="text-primary" /> },
              { label: "Sedang Baca", value: bookmarkSlugs.filter(s => {
                try { return !!localStorage.getItem(`novel-progress-${s}`); } catch { return false; }
              }).length, icon: <BookOpen size={14} className="text-primary" /> },
              { label: "Total Chapter", value: bookmarkSlugs.reduce((acc, s) => {
                try {
                  const p = JSON.parse(localStorage.getItem(`novel-progress-${s}`) || "{}");
                  return acc + (p.chapterNum || 0);
                } catch { return acc; }
              }, 0), icon: <BookMarked size={14} className="text-primary" /> },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
