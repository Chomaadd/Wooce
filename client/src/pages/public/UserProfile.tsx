import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Bookmark, BookmarkX, Eye, BookMarked,
  PenLine, LogOut, User, Star, ExternalLink, Edit2, Check, X,
  Loader2, Copy, Upload, RotateCcw, Camera, AlertTriangle, Trash2,
} from "lucide-react";
import type { NovelStory } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject;
    img.crossOrigin = "anonymous"; img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
  return new Promise((resolve, reject) => { canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas empty")), "image/jpeg", 0.9); });
}

function ProfilePhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const onCropComplete = useCallback((_: any, pixels: any) => setCroppedAreaPixels(pixels), []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setRawSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); setCropOpen(true); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleCrop = async () => {
    if (!rawSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, croppedAreaPixels);
      const form = new FormData(); form.append("file", blob, `photo-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = await res.json();
      onChange(url); setCropOpen(false); setRawSrc(null);
      toast({ title: "Foto berhasil diupload!" });
    } catch { toast({ title: "Upload gagal", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
          {value
            ? <img src={value} alt="foto profil" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Camera size={20} className="text-muted-foreground/40" /></div>
          }
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/40 hover:bg-muted transition-colors"
            data-testid="button-upload-photo"
          >
            <Upload size={12} /> Upload Foto
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="button-remove-photo"
            >
              <RotateCcw size={12} /> Hapus Foto
            </button>
          )}
          <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP. Dipotong otomatis ke persegi.</p>
        </div>
      </div>

      {cropOpen && rawSrc && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-card rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm">
            <div className="relative w-full h-64 bg-black">
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 h-1 accent-primary" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCrop} disabled={uploading}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                  data-testid="button-confirm-crop"
                >
                  {uploading ? <span className="flex items-center justify-center gap-1"><Loader2 size={13} className="animate-spin" /> Mengupload...</span> : "Simpan Foto"}
                </button>
                <button onClick={() => { setCropOpen(false); setRawSrc(null); }}
                  className="px-4 py-2 rounded-xl text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
                  data-testid="button-cancel-crop"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

type AuthorInfo = {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  photoUrl?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  website?: string | null;
  saweria?: string | null;
  trakteer?: string | null;
};

type WriterMeData = {
  id: string;
  email: string;
  name: string;
  photoUrl?: string | null;
  role: string;
  status: string;
  authorId: string;
  author: AuthorInfo | null;
};

export default function UserProfile() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [bookmarkSlugs, setBookmarkSlugs] = useState<string[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [photoVal, setPhotoVal] = useState("");
  const [slugVal, setSlugVal] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const slugTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [bioVal, setBioVal] = useState("");
  const [socialVals, setSocialVals] = useState<Record<string, string>>({});
  const [donationVals, setDonationVals] = useState<Record<string, string>>({});

  // Delete account OTP flow
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "otp" | "deleting">("idle");
  const [otpInput, setOtpInput] = useState("");

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
    queryFn: () => fetch("/api/writer/stories", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    enabled: !!user && user.role === "writer" && user.status === "active",
    select: (data) => Array.isArray(data) ? data : [],
  });

  const { data: writerMe } = useQuery<WriterMeData>({
    queryKey: ["/api/writer/me"],
    queryFn: () => fetch("/api/writer/me", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && user.role === "writer" && user.status === "active",
  });

  const authorData = writerMe?.author ?? null;

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch("/api/writer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: "Gagal menyimpan" }));
        throw new Error(err.message || "Gagal menyimpan");
      }
      return r.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/writer/me"] });
      setEditingProfile(false);
      setSlugStatus("idle");
      toast({ title: "Profil berhasil disimpan!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Gagal menyimpan profil", variant: "destructive" }),
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/request-delete-otp"),
    onSuccess: () => {
      setDeleteStep("otp");
      setOtpInput("");
      toast({ title: "Kode OTP dikirim ke emailmu!" });
    },
    onError: (err: any) => {
      const msg = err?.message || "Gagal mengirim OTP";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const confirmDeleteMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/confirm-delete", { otp: otpInput }),
    onSuccess: () => {
      toast({ title: "Akunmu berhasil dihapus. Sampai jumpa!" });
      setDeleteStep("idle");
      logout();
      navigate("/");
    },
    onError: (err: any) => {
      const msg = err?.message || "Kode OTP tidak valid";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    setSlugVal(clean);
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!clean || clean.length < 3) { setSlugStatus("invalid"); return; }
    if (clean === authorData?.slug) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/writer/check-slug?slug=${clean}`, { credentials: "include" });
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 600);
  };

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
    setNameVal(authorData?.name ?? "");
    setPhotoVal(authorData?.photoUrl ?? "");
    setSlugVal(authorData?.slug ?? "");
    setSlugStatus("idle");
    setBioVal(authorData?.bio ?? "");
    setSocialVals({
      tiktok: authorData?.tiktok ?? "",
      instagram: authorData?.instagram ?? "",
      facebook: authorData?.facebook ?? "",
      twitter: authorData?.twitter ?? "",
      website: authorData?.website ?? "",
    });
    setDonationVals({
      saweria: authorData?.saweria ?? "",
      trakteer: authorData?.trakteer ?? "",
    });
    setEditingProfile(true);
  };

  const saveProfile = () => {
    const payload: Record<string, any> = {
      name: nameVal.trim(),
      bio: bioVal,
      photoUrl: photoVal.trim() || null,
      ...socialVals,
      ...donationVals,
    };
    if (slugVal && slugVal !== authorData?.slug) payload.slug = slugVal;
    updateProfile.mutate(payload);
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
        {isWriter && (
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
                {authorData?.slug && (
                  <a
                    href={`/penulis/${authorData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                    data-testid="link-view-author-profile"
                  >
                    <ExternalLink size={11} /> Lihat
                  </a>
                )}
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

            {/* Info bar: URL + AuthorId */}
            <div className="px-5 py-3 bg-muted/30 border-b border-border flex flex-wrap items-center gap-4 text-[11px]">
              <span className="text-muted-foreground">
                URL Profil:{" "}
                {authorData?.slug
                  ? <span className="font-mono text-primary">/penulis/{authorData.slug}</span>
                  : <span className="text-muted-foreground/50 italic">belum diset</span>
                }
              </span>
              {writerMe?.authorId && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  ID Penulis:{" "}
                  <span className="font-mono text-foreground/80 bg-muted px-1.5 py-0.5 rounded-md text-[10px]" data-testid="text-author-id">
                    {writerMe.authorId}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(writerMe.authorId); toast({ title: "AuthorId disalin!" }); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Salin AuthorId"
                    data-testid="button-copy-author-id"
                  >
                    <Copy size={10} />
                  </button>
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editingProfile ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5 pt-4 space-y-4"
                >
                  {/* Nama penulis */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Nama Penulis</label>
                    <input
                      type="text"
                      value={nameVal}
                      onChange={e => setNameVal(e.target.value)}
                      placeholder="Nama yang ditampilkan ke pembaca"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/40"
                      data-testid="input-name"
                    />
                  </div>

                  {/* URL / Username */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Username / URL Profil</label>
                    <div className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/30 ${
                      slugStatus === "available" ? "border-emerald-500 bg-emerald-500/5" :
                      slugStatus === "taken" ? "border-destructive bg-destructive/5" :
                      slugStatus === "invalid" ? "border-amber-500/60 bg-amber-500/5" :
                      "border-border bg-muted/40"
                    }`}>
                      <span className="px-3 text-[11px] text-muted-foreground bg-muted/60 border-r border-border py-2 shrink-0">/penulis/</span>
                      <input
                        type="text"
                        value={slugVal}
                        onChange={e => handleSlugChange(e.target.value)}
                        placeholder="username-kamu"
                        className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
                        data-testid="input-slug"
                      />
                      <div className="px-3 flex-shrink-0">
                        {slugStatus === "checking" && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                        {slugStatus === "available" && <Check size={12} className="text-emerald-500" />}
                        {slugStatus === "taken" && <X size={12} className="text-destructive" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {slugStatus === "available" && <span className="text-emerald-600">✓ Username tersedia</span>}
                      {slugStatus === "taken" && <span className="text-destructive">✗ Sudah dipakai, coba yang lain</span>}
                      {slugStatus === "invalid" && <span className="text-amber-600">Min. 3 karakter, huruf kecil, angka, tanda hubung</span>}
                      {(slugStatus === "idle" || slugStatus === "checking") && "Huruf kecil (a-z), angka (0-9), tanda hubung (-)"}
                    </p>
                  </div>

                  {/* Foto */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Foto Profil</label>
                    <ProfilePhotoUpload value={photoVal} onChange={setPhotoVal} />
                  </div>

                  {/* Bio */}
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
                            placeholder="https://..."
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
                            placeholder="https://..."
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
                      disabled={updateProfile.isPending || slugStatus === "taken" || slugStatus === "checking"}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                      data-testid="button-save-profile"
                    >
                      {updateProfile.isPending ? <><Loader2 size={11} className="animate-spin" /> Menyimpan...</> : <><Check size={12} /> Simpan</>}
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
                  className="px-5 pb-5 pt-3 space-y-3"
                >
                  {authorData?.bio ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{authorData.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">Belum ada bio. Klik Edit untuk menambahkan.</p>
                  )}
                  {authorData && (
                    <div className="flex flex-wrap gap-2">
                      {(["tiktok","instagram","facebook","twitter","website"] as const).map(k => {
                        const v = authorData[k];
                        return v ? (
                          <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors capitalize"
                            data-testid={`link-social-${k}`}
                          >
                            {k}
                          </a>
                        ) : null;
                      })}
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

        {/* Danger Zone — Delete Account */}
        <section className="pb-6">
          <div className="border border-destructive/20 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-destructive/5 border-b border-destructive/20">
              <AlertTriangle size={14} className="text-destructive flex-shrink-0" />
              <h2 className="font-bold text-sm text-destructive">Zona Berbahaya</h2>
            </div>
            <div className="px-5 py-4">
              <AnimatePresence mode="wait">
                {deleteStep === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">Hapus Akun</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Menghapus akun bersifat permanen dan tidak bisa dibatalkan.
                        {user?.role === "writer" && " Semua ceritamu akan dihapus dan kamu akan menerima PDF backup via email."}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteStep("confirm")}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-colors"
                      data-testid="button-delete-account-start"
                    >
                      <Trash2 size={12} /> Hapus Akun
                    </button>
                  </motion.div>
                )}

                {deleteStep === "confirm" && (
                  <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/8 border border-destructive/15">
                      <AlertTriangle size={15} className="text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-0.5">Yakin ingin menghapus akun?</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Tindakan ini tidak dapat dibatalkan. Klik "Kirim OTP" untuk melanjutkan — kami akan mengirim kode verifikasi ke <strong>{user?.email}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => requestOtpMutation.mutate()}
                        disabled={requestOtpMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 transition-opacity"
                        data-testid="button-request-otp"
                      >
                        {requestOtpMutation.isPending ? <><Loader2 size={11} className="animate-spin" /> Mengirim...</> : "Kirim OTP ke Email"}
                      </button>
                      <button
                        onClick={() => setDeleteStep("idle")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        data-testid="button-cancel-delete"
                      >
                        <X size={12} /> Batal
                      </button>
                    </div>
                  </motion.div>
                )}

                {deleteStep === "otp" && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Masukkan kode 6-digit yang sudah dikirim ke <strong>{user?.email}</strong>. Kode berlaku 10 menit.
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="w-36 px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive placeholder:text-muted-foreground/30"
                        data-testid="input-otp-delete"
                      />
                      <button
                        onClick={() => confirmDeleteMutation.mutate()}
                        disabled={otpInput.length !== 6 || confirmDeleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 transition-opacity"
                        data-testid="button-confirm-delete"
                      >
                        {confirmDeleteMutation.isPending ? <><Loader2 size={11} className="animate-spin" /> Menghapus...</> : <><Trash2 size={11} /> Konfirmasi Hapus</>}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => requestOtpMutation.mutate()}
                        disabled={requestOtpMutation.isPending}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                        data-testid="button-resend-otp"
                      >
                        {requestOtpMutation.isPending ? "Mengirim..." : "Kirim ulang OTP"}
                      </button>
                      <span className="text-muted-foreground/30 text-[11px]">·</span>
                      <button
                        onClick={() => { setDeleteStep("idle"); setOtpInput(""); }}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-cancel-otp"
                      >
                        Batal
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
