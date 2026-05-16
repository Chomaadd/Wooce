import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor, renderRichContent } from "@/components/ui/rich-text-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Plus, Pencil, Trash2, ChevronRight, Eye, EyeOff,
  ArrowLeft, Layers, FileText, LogOut, Upload, ImageIcon, RotateCcw,
  Clock, CalendarClock, X, User,
} from "lucide-react";
import Cropper from "react-easy-crop";
import type { NovelStory, NovelSeason, NovelChapter } from "@shared/schema";

type WriterView = "stories" | "seasons" | "chapters" | "write";
type StoryWithStats = NovelStory & { totalChapters: number };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
  return new Promise((resolve, reject) => { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas empty")), "image/jpeg", 0.9); });
}

function CoverUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
      const form = new FormData(); form.append("file", blob, `cover-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = await res.json();
      onChange(url); setCropOpen(false); setRawSrc(null);
      toast({ title: "Cover berhasil diupload" });
    } catch { toast({ title: "Upload gagal", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={13} className="mr-1.5" /> Upload Cover
        </Button>
        {value && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
          <RotateCcw size={13} className="mr-1.5" /> Hapus
        </Button>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value ? (
        <img src={value} alt="Sampul" className="mt-2 w-20 aspect-[2/3] object-cover rounded-lg border border-border" />
      ) : (
        <div className="mt-2 w-20 aspect-[2/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={16} className="text-muted-foreground mb-1" />
          <span className="text-[9px] text-muted-foreground">2:3</span>
        </div>
      )}
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Atau paste URL" className="text-xs h-8 mt-2" />
      <Dialog open={cropOpen} onOpenChange={o => { if (!o) { setCropOpen(false); setRawSrc(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crop Cover</DialogTitle></DialogHeader>
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
            {rawSrc && <Cropper image={rawSrc} crop={crop} zoom={zoom} aspect={2/3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10">Zoom</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-primary" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropOpen(false); setRawSrc(null); }}>Batal</Button>
            <Button onClick={handleCrop} disabled={uploading}>{uploading ? "Mengupload..." : "Simpan Cover"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WriterStories() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<WriterView>("stories");
  const [selectedStory, setSelectedStory] = useState<StoryWithStats | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<NovelSeason | null>(null);
  const [editingChapter, setEditingChapter] = useState<NovelChapter | null>(null);

  const [storyDialog, setStoryDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryWithStats | null>(null);
  const [storyForm, setStoryForm] = useState({ title: "", slug: "", description: "", coverUrl: "", category: "novel", status: "ongoing", tags: "", published: false });

  const [seasonDialog, setSeasonDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<NovelSeason | null>(null);
  const [seasonForm, setSeasonForm] = useState({ title: "Season 1", seasonNumber: 1 });

  const [chapterDialog, setChapterDialog] = useState(false);
  const [editingChapterMeta, setEditingChapterMeta] = useState<NovelChapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ title: "", chapterNumber: 1, published: false });

  const [chapterContent, setChapterContent] = useState("");
  const [chapterPublished, setChapterPublished] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  const isWriter = !authLoading && !!user && !user.isAdmin && user.role === "writer" && user.status === "active";

  useEffect(() => {
    if (!authLoading && (!user || user.isAdmin || (user.role !== "writer") || (user.status !== "active"))) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: stories, isLoading: storiesLoading } = useQuery<StoryWithStats[]>({
    queryKey: ["/api/writer/stories"],
    queryFn: () => fetch("/api/writer/stories", { credentials: "include" }).then(r => r.json()),
    enabled: isWriter,
  });

  const { data: seasons } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
    queryFn: () => fetch(`/api/novel/stories/${selectedStory!.id}/seasons`).then(r => r.json()),
    enabled: !!selectedStory?.id,
  });

  const { data: chapters, refetch: refetchChapters } = useQuery<NovelChapter[]>({
    queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
    queryFn: () => fetch(`/api/writer/seasons/${selectedSeason!.id}/chapters`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedSeason?.id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createStory = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/writer/stories", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] }); setStoryDialog(false); toast({ title: "Cerita berhasil dibuat!" }); },
    onError: (e: any) => toast({ title: e.message ?? "Gagal membuat cerita", variant: "destructive" }),
  });
  const updateStory = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PUT", `/api/writer/stories/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] }); setStoryDialog(false); toast({ title: "Cerita berhasil diperbarui!" }); },
    onError: (e: any) => toast({ title: e.message ?? "Gagal memperbarui", variant: "destructive" }),
  });
  const deleteStory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/writer/stories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] }); setDeleteConfirm(null); setView("stories"); setSelectedStory(null); toast({ title: "Cerita dihapus." }); },
  });

  const createSeason = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/writer/seasons", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setSeasonDialog(false); toast({ title: "Season berhasil dibuat!" }); },
    onError: (e: any) => toast({ title: e.message ?? "Gagal membuat season", variant: "destructive" }),
  });
  const updateSeason = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PUT", `/api/writer/seasons/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setSeasonDialog(false); toast({ title: "Season diperbarui!" }); },
  });
  const deleteSeason = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/writer/seasons/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setDeleteConfirm(null); setView("seasons"); setSelectedSeason(null); toast({ title: "Season dihapus." }); },
  });

  const createChapter = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/writer/chapters", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"] }); setChapterDialog(false); toast({ title: "Chapter berhasil dibuat!" }); },
    onError: (e: any) => toast({ title: e.message ?? "Gagal membuat chapter", variant: "destructive" }),
  });
  const updateChapterMeta = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PUT", `/api/writer/chapters/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"] }); setChapterDialog(false); toast({ title: "Chapter diperbarui!" }); },
  });
  const saveChapterContent = useMutation({
    mutationFn: ({ id, content, published, scheduledAt }: any) =>
      apiRequest("PUT", `/api/writer/chapters/${id}`, { content, published, scheduledAt: scheduledAt || null }).then(r => r.json()),
    onSuccess: () => { refetchChapters(); toast({ title: "Konten tersimpan!" }); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });
  const deleteChapter = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/writer/chapters/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"] }); setDeleteConfirm(null); toast({ title: "Chapter dihapus." }); },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openStoryForm = (story?: StoryWithStats) => {
    if (story) {
      setEditingStory(story);
      setStoryForm({ title: story.title, slug: story.slug, description: story.description ?? "", coverUrl: story.coverUrl ?? "", category: story.category, status: story.status, tags: (story.tags ?? []).join(", "), published: story.published });
    } else {
      setEditingStory(null);
      setStoryForm({ title: "", slug: "", description: "", coverUrl: "", category: "novel", status: "ongoing", tags: "", published: false });
    }
    setStoryDialog(true);
  };

  const submitStory = () => {
    const data = { ...storyForm, tags: storyForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
    if (editingStory) updateStory.mutate({ id: editingStory.id, data });
    else createStory.mutate(data);
  };

  const openSeasonForm = (season?: NovelSeason) => {
    if (season) { setEditingSeason(season); setSeasonForm({ title: season.title, seasonNumber: season.seasonNumber }); }
    else { setEditingSeason(null); setSeasonForm({ title: `Season ${(seasons?.length ?? 0) + 1}`, seasonNumber: (seasons?.length ?? 0) + 1 }); }
    setSeasonDialog(true);
  };

  const submitSeason = () => {
    const data = { ...seasonForm, storyId: selectedStory!.id };
    if (editingSeason) updateSeason.mutate({ id: editingSeason.id, data });
    else createSeason.mutate(data);
  };

  const openChapterForm = (ch?: NovelChapter) => {
    if (ch) { setEditingChapterMeta(ch); setChapterForm({ title: ch.title, chapterNumber: ch.chapterNumber, published: ch.published }); }
    else { setEditingChapterMeta(null); setChapterForm({ title: "", chapterNumber: (chapters?.length ?? 0) + 1, published: false }); }
    setChapterDialog(true);
  };

  const submitChapter = () => {
    const data = { ...chapterForm, storyId: selectedStory!.id, seasonId: selectedSeason!.id };
    if (editingChapterMeta) updateChapterMeta.mutate({ id: editingChapterMeta.id, data });
    else createChapter.mutate(data);
  };

  const openWrite = (ch: NovelChapter) => {
    setEditingChapter(ch);
    setChapterContent(ch.content ?? "");
    setChapterPublished(ch.published);
    setScheduledAt(ch.scheduledAt ? new Date(ch.scheduledAt as string).toISOString().slice(0, 16) : "");
    setView("write");
  };

  // ── Loading / Guard ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="w-32 h-3 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!isWriter) return null;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="w-56 shrink-0 border-r border-border bg-card/50 flex flex-col min-h-screen">
      <div className="px-4 py-4 border-b border-border">
        <Link href="/">
          <div className="flex items-center gap-2 mb-3 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">WOOCE Novel</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"><User size={12} className="text-primary" /></div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-[9px] text-muted-foreground">Penulis</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => setView("stories")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${view === "stories" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          data-testid="nav-stories"
        >
          <BookOpen size={13} /> Cerita Saya
        </button>
        {selectedStory && (
          <button
            onClick={() => setView("seasons")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${view === "seasons" || view === "chapters" || view === "write" ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            data-testid="nav-seasons"
          >
            <Layers size={13} />
            <span className="truncate">{selectedStory.title}</span>
          </button>
        )}
        {selectedSeason && (view === "chapters" || view === "write") && (
          <button
            onClick={() => setView("chapters")}
            className={`w-full flex items-center gap-2 px-3 py-2 ml-3 rounded-lg text-xs font-medium transition-colors ${view === "chapters" || view === "write" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            data-testid="nav-chapters"
          >
            <FileText size={13} />
            <span className="truncate">{selectedSeason.title}</span>
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link href="/profile">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid="button-go-profile">
            <User size={13} /> Profil Saya
          </button>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
          data-testid="button-writer-logout"
        >
          <LogOut size={13} /> Keluar
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}

      <main className="flex-1 overflow-auto p-6">

        {/* ── Stories view ── */}
        {view === "stories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Cerita Saya</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{stories?.length ?? 0} cerita terdaftar</p>
              </div>
              <Button size="sm" onClick={() => openStoryForm()} data-testid="button-create-story">
                <Plus size={14} className="mr-1.5" /> Cerita Baru
              </Button>
            </div>

            {storiesLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : !stories || stories.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                <BookOpen size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground mb-1">Belum ada cerita</p>
                <p className="text-sm text-muted-foreground mb-4">Mulai tulis cerita pertamamu!</p>
                <Button size="sm" onClick={() => openStoryForm()} data-testid="button-create-first-story">
                  <Plus size={13} className="mr-1" /> Buat Cerita
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stories.map(story => (
                  <div key={story.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors" data-testid={`row-story-${story.id}`}>
                    <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {story.coverUrl
                        ? <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-muted-foreground/50" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-foreground truncate">{story.title}</h3>
                        {!story.published && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Draft</span>}
                        {story.published && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Published</span>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{story.description || "Tidak ada deskripsi"}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                        <span className="capitalize">{story.category}</span>
                        <span className="capitalize">{story.status}</span>
                        <span>{story.totalChapters} chapter</span>
                        <span>{story.viewCount} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedStory(story); setView("seasons"); }} data-testid={`button-manage-${story.id}`}>
                        <Layers size={13} className="mr-1" /> Season <ChevronRight size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openStoryForm(story)} data-testid={`button-edit-story-${story.id}`}>
                        <Pencil size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: "story", id: story.id, name: story.title })} data-testid={`button-delete-story-${story.id}`}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Seasons view ── */}
        {view === "seasons" && selectedStory && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setView("stories")} data-testid="button-back-to-stories">
                <ArrowLeft size={14} className="mr-1" /> Kembali
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{selectedStory.title}</h1>
                <p className="text-xs text-muted-foreground">Kelola season cerita</p>
              </div>
              <Button size="sm" onClick={() => openSeasonForm()} data-testid="button-create-season">
                <Plus size={14} className="mr-1.5" /> Tambah Season
              </Button>
            </div>

            {!seasons || seasons.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                <Layers size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground mb-1">Belum ada season</p>
                <Button size="sm" className="mt-2" onClick={() => openSeasonForm()} data-testid="button-create-first-season">
                  <Plus size={13} className="mr-1" /> Buat Season
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {seasons.map(season => (
                  <div key={season.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4" data-testid={`row-season-${season.id}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{season.seasonNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">{season.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedSeason(season); setView("chapters"); }} data-testid={`button-chapters-${season.id}`}>
                        <FileText size={13} className="mr-1" /> Chapter <ChevronRight size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openSeasonForm(season)} data-testid={`button-edit-season-${season.id}`}><Pencil size={13} /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: "season", id: season.id, name: season.title })} data-testid={`button-delete-season-${season.id}`}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Chapters view ── */}
        {view === "chapters" && selectedSeason && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setView("seasons")} data-testid="button-back-to-seasons">
                <ArrowLeft size={14} className="mr-1" /> Kembali
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">{selectedSeason.title}</h1>
                <p className="text-xs text-muted-foreground">{selectedStory?.title} · {chapters?.length ?? 0} chapter</p>
              </div>
              <Button size="sm" onClick={() => openChapterForm()} data-testid="button-create-chapter">
                <Plus size={14} className="mr-1.5" /> Tambah Chapter
              </Button>
            </div>

            {!chapters || chapters.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                <FileText size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground mb-1">Belum ada chapter</p>
                <Button size="sm" className="mt-2" onClick={() => openChapterForm()} data-testid="button-create-first-chapter">
                  <Plus size={13} className="mr-1" /> Tambah Chapter
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map(ch => (
                  <div key={ch.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3" data-testid={`row-chapter-${ch.id}`}>
                    <span className="text-xs font-mono text-muted-foreground w-8 text-center flex-shrink-0">{ch.chapterNumber}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ch.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {ch.published
                          ? <span className="text-emerald-500 flex items-center gap-0.5"><Eye size={9} /> Published</span>
                          : ch.scheduledAt
                            ? <span className="text-amber-500 flex items-center gap-0.5"><CalendarClock size={9} /> Terjadwal</span>
                            : <span className="flex items-center gap-0.5"><EyeOff size={9} /> Draft</span>
                        }
                        <span>{ch.viewCount} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button size="sm" onClick={() => openWrite(ch)} data-testid={`button-write-${ch.id}`}>
                        <Pencil size={13} className="mr-1" /> Tulis
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openChapterForm(ch)} data-testid={`button-edit-chapter-${ch.id}`}><Pencil size={13} /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: "chapter", id: ch.id, name: ch.title })} data-testid={`button-delete-chapter-${ch.id}`}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Write view ── */}
        {view === "write" && editingChapter && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setView("chapters")} data-testid="button-back-to-chapters">
                <ArrowLeft size={14} className="mr-1" /> Kembali
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">Bab {editingChapter.chapterNumber}: {editingChapter.title}</h1>
                <p className="text-xs text-muted-foreground">{selectedStory?.title} · {selectedSeason?.title}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={chapterPublished} onChange={e => setChapterPublished(e.target.checked)} className="accent-primary" />
                  Published
                </label>
                <Button
                  size="sm"
                  onClick={() => saveChapterContent.mutate({ id: editingChapter.id, content: chapterContent, published: chapterPublished, scheduledAt })}
                  disabled={saveChapterContent.isPending}
                  data-testid="button-save-chapter"
                >
                  {saveChapterContent.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>Jadwal terbit:</span>
              </div>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="h-7 text-xs w-52" />
              {scheduledAt && (
                <button onClick={() => setScheduledAt("")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X size={11} /> Hapus jadwal
                </button>
              )}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <RichTextEditor value={chapterContent} onChange={setChapterContent} />
            </div>

            {chapterContent && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground p-3 bg-muted/30 rounded-xl border border-border">Preview konten</summary>
                <div className="mt-2 p-4 bg-muted/20 rounded-xl border border-border prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderRichContent(chapterContent) }} />
              </details>
            )}
          </div>
        )}
      </main>

      {/* ── Dialogs ── */}
      <Dialog open={storyDialog} onOpenChange={setStoryDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingStory ? "Edit Cerita" : "Cerita Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul *</label>
              <Input value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Judul cerita" data-testid="input-story-title" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Slug (URL)</label>
              <Input value={storyForm.slug} onChange={e => setStoryForm(f => ({ ...f, slug: e.target.value }))} placeholder="judul-cerita" data-testid="input-story-slug" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Sinopsis</label>
              <Textarea value={storyForm.description} onChange={e => setStoryForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Cerita singkat tentang novel ini..." data-testid="input-story-desc" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Cover</label>
              <CoverUpload value={storyForm.coverUrl} onChange={url => setStoryForm(f => ({ ...f, coverUrl: url }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Kategori</label>
                <Select value={storyForm.category} onValueChange={v => setStoryForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-story-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novel">Novel</SelectItem>
                    <SelectItem value="komik">Komik</SelectItem>
                    <SelectItem value="cerpen">Cerpen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                <Select value={storyForm.status} onValueChange={v => setStoryForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-story-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Tags (pisahkan dengan koma)</label>
              <Input value={storyForm.tags} onChange={e => setStoryForm(f => ({ ...f, tags: e.target.value }))} placeholder="romance, fantasy, action" data-testid="input-story-tags" />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={storyForm.published} onChange={e => setStoryForm(f => ({ ...f, published: e.target.checked }))} className="accent-primary" data-testid="check-published" />
              Publish sekarang (tampil ke publik)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryDialog(false)}>Batal</Button>
            <Button onClick={submitStory} disabled={createStory.isPending || updateStory.isPending || !storyForm.title} data-testid="button-submit-story">
              {createStory.isPending || updateStory.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={seasonDialog} onOpenChange={setSeasonDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingSeason ? "Edit Season" : "Tambah Season"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nomor Season</label>
              <Input type="number" value={seasonForm.seasonNumber} onChange={e => setSeasonForm(f => ({ ...f, seasonNumber: Number(e.target.value) }))} min={1} data-testid="input-season-number" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul Season</label>
              <Input value={seasonForm.title} onChange={e => setSeasonForm(f => ({ ...f, title: e.target.value }))} placeholder="Season 1" data-testid="input-season-title" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonDialog(false)}>Batal</Button>
            <Button onClick={submitSeason} disabled={createSeason.isPending || updateSeason.isPending} data-testid="button-submit-season">
              {createSeason.isPending || updateSeason.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingChapterMeta ? "Edit Chapter" : "Tambah Chapter"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nomor Chapter</label>
              <Input type="number" value={chapterForm.chapterNumber} onChange={e => setChapterForm(f => ({ ...f, chapterNumber: Number(e.target.value) }))} min={1} data-testid="input-chapter-number" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul Chapter</label>
              <Input value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul chapter" data-testid="input-chapter-title" />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={chapterForm.published} onChange={e => setChapterForm(f => ({ ...f, published: e.target.checked }))} className="accent-primary" data-testid="check-chapter-published" />
              Publish langsung
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialog(false)}>Batal</Button>
            <Button onClick={submitChapter} disabled={createChapter.isPending || updateChapterMeta.isPending || !chapterForm.title} data-testid="button-submit-chapter">
              {createChapter.isPending || updateChapterMeta.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={o => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hapus {deleteConfirm?.type}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin mau hapus <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span>? Aksi ini tidak bisa dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              if (!deleteConfirm) return;
              if (deleteConfirm.type === "story") deleteStory.mutate(deleteConfirm.id);
              if (deleteConfirm.type === "season") deleteSeason.mutate(deleteConfirm.id);
              if (deleteConfirm.type === "chapter") deleteChapter.mutate(deleteConfirm.id);
            }} data-testid="button-confirm-delete">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
