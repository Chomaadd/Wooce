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
import {
  RichTextEditor,
  renderRichContent,
} from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Layers,
  FileText,
  LogOut,
  Upload,
  ImageIcon,
  RotateCcw,
  Clock,
  CalendarClock,
  X,
  User,
  AtSign,
  CheckCircle,
  XCircle,
  Loader2,
  Menu,
  Home,
  BarChart2,
  TrendingUp,
  FileDown,
  BadgeCheck,
  Users,
} from "lucide-react";
import Cropper from "react-easy-crop";
import type { NovelStory, NovelSeason, NovelChapter } from "@shared/schema";

type WriterMe = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role: string;
  status: string;
  authorId?: string | null;
  author?: { id: string; name: string; slug: string } | null;
  verificationStatus?: string;
};

type WriterView = "stories" | "seasons" | "chapters" | "write" | "stats" | "characters";
type StoryWithStats = NovelStory & {
  totalChapters: number;
  publishedChapters?: number;
};

type WriterStats = {
  totalViews: number;
  totalStories: number;
  totalChapters: number;
  totalPublished: number;
  topStories: Array<StoryWithStats>;
  topChapters: Array<{
    id: string;
    title: string;
    chapterNumber: number;
    viewCount: number;
    storyTitle: string;
    storySlug: string;
  }>;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: any,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))),
      "image/jpeg",
      0.9,
    );
  });
}

function deleteOrphanUpload(url: string) {
  if (!url || !url.startsWith("/uploads/")) return;
  fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: "DELETE", credentials: "include" }).catch(() => {});
}

function CoverUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const onCropComplete = useCallback(
    (_: any, pixels: any) => setCroppedAreaPixels(pixels),
    [],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCrop = async () => {
    if (!rawSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, croppedAreaPixels);
      const form = new FormData();
      form.append("file", blob, `cover-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = await res.json();
      onChange(url);
      setCropOpen(false);
      setRawSrc(null);
      toast({ title: "Cover berhasil diupload" });
    } catch {
      toast({ title: "Upload gagal", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={13} className="mr-1.5" /> Upload Cover
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onChange("")}
          >
            <RotateCcw size={13} className="mr-1.5" /> Hapus
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {value ? (
        <img
          src={value}
          alt="Sampul"
          className="mt-2 w-20 aspect-[2/3] object-cover rounded-lg border border-border"
        />
      ) : (
        <div
          className="mt-2 w-20 aspect-[2/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} className="text-muted-foreground mb-1" />
          <span className="text-[9px] text-muted-foreground">2:3</span>
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Atau paste URL"
        className="text-xs h-8 mt-2"
      />
      <Dialog
        open={cropOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCropOpen(false);
            setRawSrc(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Cover</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={2 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCropOpen(false);
                setRawSrc(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCrop} disabled={uploading}>
              {uploading ? "Mengupload..." : "Gunakan Gambar Ini"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChapterPreviewModal({
  title,
  chapterNumber,
  content,
  onClose,
}: {
  title: string;
  chapterNumber: number;
  content: string;
  onClose: () => void;
}) {
  const wordCount = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">
            Preview Chapter
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Draft
          </span>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          <X size={15} /> Tutup Preview
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">Preview</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
            Bab {chapterNumber}:{" "}
            {title || (
              <span className="text-muted-foreground italic">
                Judul belum diisi
              </span>
            )}
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>
              ~{readTime} menit baca · {wordCount} kata
            </span>
          </div>
        </div>
        {content ? (
          <div
            className="prose prose-gray dark:prose-invert max-w-none prose-p:leading-[1.95] prose-headings:font-bold prose-p:my-4 font-sans text-base"
            dangerouslySetInnerHTML={{ __html: renderRichContent(content) }}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FileText size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">
              Konten belum ada. Mulai menulis di editor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WriterStories() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<WriterView>("stories");
  const [selectedStory, setSelectedStory] = useState<StoryWithStats | null>(
    null,
  );
  const [selectedSeason, setSelectedSeason] = useState<NovelSeason | null>(
    null,
  );
  const [editingChapter, setEditingChapter] = useState<NovelChapter | null>(
    null,
  );
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [writeForm, setWriteForm] = useState({
    chapterNumber: 1,
    title: "",
    content: "",
    published: false,
    scheduledAt: "",
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chapterPreviewOpen, setChapterPreviewOpen] = useState(false);

  const [storyDialog, setStoryDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryWithStats | null>(null);
  const [storyForm, setStoryForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverUrl: "",
    category: "novel",
    status: "ongoing",
    tags: "",
    published: false,
    donationUrl: "",
  });

  const storyOriginalCoverRef = useRef("");
  const storyPendingCoverRef  = useRef<string | null>(null);
  const storyIsSavedRef       = useRef(false);

  const [seasonDialog, setSeasonDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<NovelSeason | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    title: "Season 1",
    seasonNumber: 1,
  });

  const [chapterDialog, setChapterDialog] = useState(false);
  const [editingChapterMeta, setEditingChapterMeta] =
    useState<NovelChapter | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: "",
    chapterNumber: 1,
    published: false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const [characterStory, setCharacterStory] = useState<StoryWithStats | null>(null);
  const [characterDialog, setCharacterDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<any | null>(null);
  const [characterForm, setCharacterForm] = useState({ name: "", role: "pendukung", description: "", imageUrl: "", relations: "" });

  const isWriter =
    !authLoading &&
    !!user &&
    !user.isAdmin &&
    user.role === "writer" &&
    user.status === "active";

  useEffect(() => {
    if (
      !authLoading &&
      (!user ||
        user.isAdmin ||
        user.role !== "writer" ||
        user.status !== "active")
    ) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameSlug, setUsernameSlug] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [usernameChecking, setUsernameChecking] = useState(false);

  const { data: writerMe, isLoading: writerMeLoading } = useQuery<WriterMe>({
    queryKey: ["/api/writer/me"],
    queryFn: () =>
      fetch("/api/writer/me", { credentials: "include" }).then((r) => r.json()),
    enabled: isWriter,
  });

  const needsUsername =
    isWriter && !writerMeLoading && writerMe && !writerMe.author;

  const setupUsername = useMutation({
    mutationFn: (username: string) =>
      apiRequest("POST", "/api/writer/setup-username", { username }).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writer/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] });
      toast({ title: "Username berhasil disimpan!" });
      setUsernameInput("");
      setUsernameSlug("");
      setUsernameAvailable(null);
    },
    onError: (e: any) =>
      toast({
        title: e.message ?? "Gagal menyimpan username",
        variant: "destructive",
      }),
  });

  const checkUsername = async (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "");
    setUsernameSlug(slug);
    setUsernameAvailable(null);
    if (slug.length < 3) return;
    setUsernameChecking(true);
    try {
      const res = await fetch(`/api/writer/check-slug?slug=${slug}`, {
        credentials: "include",
      });
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const { data: stories, isLoading: storiesLoading } = useQuery<
    StoryWithStats[]
  >({
    queryKey: ["/api/writer/stories"],
    queryFn: () =>
      fetch("/api/writer/stories", { credentials: "include" }).then((r) =>
        r.json(),
      ),
    enabled: isWriter,
  });

  const { data: seasons } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
    queryFn: () =>
      fetch(`/api/novel/stories/${selectedStory!.id}/seasons`).then((r) =>
        r.json(),
      ),
    enabled: !!selectedStory?.id,
  });

  const { data: chapters, refetch: refetchChapters } = useQuery<NovelChapter[]>(
    {
      queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      queryFn: () =>
        fetch(`/api/writer/seasons/${selectedSeason!.id}/chapters`, {
          credentials: "include",
        }).then((r) => r.json()),
      enabled: !!selectedSeason?.id,
    },
  );

  const { data: writerStats } = useQuery<WriterStats>({
    queryKey: ["/api/writer/stats"],
    queryFn: () =>
      fetch("/api/writer/stats", { credentials: "include" }).then((r) =>
        r.json(),
      ),
    enabled: isWriter && view === "stats",
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createStory = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/writer/stories", data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] });
      setStoryDialog(false);
      toast({ title: "Cerita berhasil dibuat!" });
    },
    onError: (e: any) =>
      toast({
        title: e.message ?? "Gagal membuat cerita",
        variant: "destructive",
      }),
  });
  const updateStory = useMutation({
    mutationFn: ({ id, data }: any) =>
      apiRequest("PUT", `/api/writer/stories/${id}`, data).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] });
      setStoryDialog(false);
      toast({ title: "Cerita berhasil diperbarui!" });
    },
    onError: (e: any) =>
      toast({
        title: e.message ?? "Gagal memperbarui",
        variant: "destructive",
      }),
  });
  const deleteStory = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/writer/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writer/stories"] });
      setDeleteConfirm(null);
      setView("stories");
      setSelectedStory(null);
      toast({ title: "Cerita dihapus." });
    },
  });

  const downloadPdf = async (storyId: string, storyTitle: string) => {
    setDownloadingPdf(storyId);
    try {
      const response = await fetch(
        `/api/writer/stories/${storyId}/backup-pdf`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Gagal generate PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${storyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-backup.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: err.message ?? "Gagal download PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const createSeason = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/writer/seasons", data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
      });
      setSeasonDialog(false);
      toast({ title: "Season berhasil dibuat!" });
    },
    onError: (e: any) =>
      toast({
        title: e.message ?? "Gagal membuat season",
        variant: "destructive",
      }),
  });
  const updateSeason = useMutation({
    mutationFn: ({ id, data }: any) =>
      apiRequest("PUT", `/api/writer/seasons/${id}`, data).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
      });
      setSeasonDialog(false);
      toast({ title: "Season diperbarui!" });
    },
  });
  const deleteSeason = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/writer/seasons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
      });
      setDeleteConfirm(null);
      setView("seasons");
      setSelectedSeason(null);
      toast({ title: "Season dihapus." });
    },
  });

  const createChapter = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/writer/chapters", data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      });
      setChapterDialog(false);
      toast({ title: "Chapter berhasil dibuat!" });
    },
    onError: (e: any) =>
      toast({
        title: e.message ?? "Gagal membuat chapter",
        variant: "destructive",
      }),
  });
  const updateChapterMeta = useMutation({
    mutationFn: ({ id, data }: any) =>
      apiRequest("PUT", `/api/writer/chapters/${id}`, data).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      });
      setChapterDialog(false);
      toast({ title: "Chapter diperbarui!" });
    },
  });
  const saveWrite = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: writeForm.title,
        chapterNumber: writeForm.chapterNumber,
        content: writeForm.content,
        published: writeForm.published,
        scheduledAt: writeForm.scheduledAt
          ? new Date(writeForm.scheduledAt).toISOString()
          : null,
        storyId: selectedStory!.id,
        seasonId: selectedSeason!.id,
      };
      if (isNewChapter) {
        return apiRequest("POST", "/api/writer/chapters", payload).then((r) =>
          r.json(),
        );
      } else {
        return apiRequest(
          "PUT",
          `/api/writer/chapters/${editingChapter!.id}`,
          payload,
        ).then((r) => r.json());
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      });
      if (isNewChapter) {
        setEditingChapter(updated);
        setIsNewChapter(false);
      }
      toast({ title: "Bab berhasil disimpan!" });
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });
  const toggleChapterPublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiRequest("PUT", `/api/writer/chapters/${id}`, { published }).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      });
    },
  });
  const deleteChapter = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/writer/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/writer/seasons", selectedSeason?.id, "chapters"],
      });
      setDeleteConfirm(null);
      toast({ title: "Chapter dihapus." });
    },
  });

  const { data: characters, refetch: refetchCharacters } = useQuery<any[]>({
    queryKey: ["/api/novel/stories", characterStory?.id, "characters"],
    queryFn: () => fetch(`/api/novel/stories/${characterStory!.id}/characters`).then(r => r.json()),
    enabled: !!characterStory?.id && view === "characters",
  });

  const createCharacter = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/writer/stories/${characterStory!.id}/characters`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", characterStory?.id, "characters"] });
      setCharacterDialog(false);
      setEditingCharacter(null);
      setCharacterForm({ name: "", role: "pendukung", description: "", imageUrl: "", relations: "" });
      toast({ title: "Karakter ditambahkan!" });
    },
    onError: () => toast({ title: "Gagal menyimpan karakter", variant: "destructive" }),
  });

  const updateCharacter = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/writer/characters/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", characterStory?.id, "characters"] });
      setCharacterDialog(false);
      setEditingCharacter(null);
      setCharacterForm({ name: "", role: "pendukung", description: "", imageUrl: "", relations: "" });
      toast({ title: "Karakter diperbarui!" });
    },
    onError: () => toast({ title: "Gagal memperbarui karakter", variant: "destructive" }),
  });

  const deleteCharacter = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/writer/characters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", characterStory?.id, "characters"] });
      toast({ title: "Karakter dihapus." });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openStoryForm = (story?: StoryWithStats) => {
    if (!story && needsUsername) return;
    // Reset orphan-tracking for this new form session
    storyPendingCoverRef.current = null;
    storyIsSavedRef.current = false;
    if (story) {
      storyOriginalCoverRef.current = story.coverUrl ?? "";
      setEditingStory(story);
      setStoryForm({
        title: story.title,
        slug: story.slug,
        description: story.description ?? "",
        coverUrl: story.coverUrl ?? "",
        category: story.category,
        status: story.status,
        tags: (story.tags ?? []).join(", "),
        published: story.published,
        donationUrl: (story as any).donationUrl ?? "",
      });
    } else {
      storyOriginalCoverRef.current = "";
      setEditingStory(null);
      setStoryForm({
        title: "",
        slug: "",
        description: "",
        coverUrl: "",
        category: "novel",
        status: "ongoing",
        tags: "",
        published: false,
        donationUrl: "",
      });
    }
    setStoryDialog(true);
  };

  const handleStoryCoverChange = (url: string) => {
    if (storyPendingCoverRef.current && url !== storyPendingCoverRef.current) {
      deleteOrphanUpload(storyPendingCoverRef.current);
    }
    storyPendingCoverRef.current =
      url.startsWith("/uploads/") && url !== storyOriginalCoverRef.current ? url : null;
    setStoryForm((f) => ({ ...f, coverUrl: url }));
  };

  const handleStoryCancelDialog = () => {
    if (storyPendingCoverRef.current) deleteOrphanUpload(storyPendingCoverRef.current);
    storyPendingCoverRef.current = null;
    setStoryDialog(false);
  };

  const submitStory = () => {
    storyIsSavedRef.current = true;
    storyPendingCoverRef.current = null;
    // If original cover was replaced with a new one, delete the original
    const orig = storyOriginalCoverRef.current;
    if (orig && orig.startsWith("/uploads/") && orig !== storyForm.coverUrl) {
      deleteOrphanUpload(orig);
    }
    const data = {
      ...storyForm,
      tags: storyForm.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      donationUrl: storyForm.donationUrl || null,
    };
    if (editingStory) updateStory.mutate({ id: editingStory.id, data });
    else createStory.mutate(data);
  };

  const openSeasonForm = (season?: NovelSeason) => {
    if (season) {
      setEditingSeason(season);
      setSeasonForm({ title: season.title, seasonNumber: season.seasonNumber });
    } else {
      setEditingSeason(null);
      setSeasonForm({
        title: `Season ${(seasons?.length ?? 0) + 1}`,
        seasonNumber: (seasons?.length ?? 0) + 1,
      });
    }
    setSeasonDialog(true);
  };

  const submitSeason = () => {
    const data = { ...seasonForm, storyId: selectedStory!.id };
    if (editingSeason) updateSeason.mutate({ id: editingSeason.id, data });
    else createSeason.mutate(data);
  };

  const openChapterForm = (ch?: NovelChapter) => {
    if (ch) {
      setEditingChapterMeta(ch);
      setChapterForm({
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        published: ch.published,
      });
    } else {
      setEditingChapterMeta(null);
      setChapterForm({
        title: "",
        chapterNumber: (chapters?.length ?? 0) + 1,
        published: false,
      });
    }
    setChapterDialog(true);
  };

  const submitChapter = () => {
    const data = {
      ...chapterForm,
      storyId: selectedStory!.id,
      seasonId: selectedSeason!.id,
    };
    if (editingChapterMeta)
      updateChapterMeta.mutate({ id: editingChapterMeta.id, data });
    else createChapter.mutate(data);
  };

  const toDatetimeLocal = (val?: string | Date | null) => {
    if (!val) return "";
    const d = new Date(val as string);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openWrite = (ch: NovelChapter) => {
    setEditingChapter(ch);
    setIsNewChapter(false);
    setWriteForm({
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      content: ch.content ?? "",
      published: ch.published,
      scheduledAt: toDatetimeLocal(ch.scheduledAt),
    });
    setView("write");
  };

  const openNewWrite = () => {
    setEditingChapter(null);
    setIsNewChapter(true);
    setWriteForm({
      chapterNumber: (chapters?.length ?? 0) + 1,
      title: "",
      content: "",
      published: false,
      scheduledAt: "",
    });
    setView("write");
  };

  const navigateTo = (v: WriterView) => {
    setView(v);
    setMobileSidebarOpen(false);
  };

  const wordCount = writeForm.content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const isScheduled =
    !writeForm.published &&
    !!writeForm.scheduledAt &&
    new Date(writeForm.scheduledAt) > new Date();

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

  const mobileTitle =
    view === "stories"
      ? "Cerita Saya"
      : view === "stats"
        ? "Statistik"
        : view === "seasons"
          ? (selectedStory?.title ?? "Season")
          : view === "chapters"
            ? (selectedSeason?.title ?? "Chapter")
            : isNewChapter
              ? "Bab Baru"
              : `Bab ${editingChapter?.chapterNumber}: ${writeForm.title || "Tulis"}`;

  // ── Sidebar content ────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" onClick={() => setMobileSidebarOpen(false)}>
          <div className="flex items-center gap-2 mb-3 cursor-pointer">
            <img
              src="/image/icon-navbar.png"
              alt="WOOCE Novel"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="font-bold text-sm text-foreground">
              WOOCE Novel
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">
              {user?.name}
            </p>
            {(user as any)?.verificationStatus === "verified" ? (
              <p className="text-[9px] text-blue-500 flex items-center gap-0.5">
                <BadgeCheck size={9} /> Terverifikasi
              </p>
            ) : (user as any)?.verificationStatus === "pending" ? (
              <p className="text-[9px] text-yellow-600">
                Verifikasi Diproses...
              </p>
            ) : (
              <p className="text-[9px] text-muted-foreground">Penulis</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => navigateTo("stories")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${view === "stories" || view === "seasons" || view === "chapters" || view === "write" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          data-testid="nav-stories"
        >
          <BookOpen size={13} /> Cerita Saya
        </button>
        <button
          onClick={() => navigateTo("stats")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${view === "stats" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          data-testid="nav-stats"
        >
          <BarChart2 size={13} /> Statistik
        </button>
        {selectedStory &&
          (view === "seasons" || view === "chapters" || view === "write") && (
            <button
              onClick={() => navigateTo("seasons")}
              className="w-full flex items-center gap-2 px-3 py-2 ml-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-seasons"
            >
              <Layers size={13} />
              <span className="truncate">{selectedStory.title}</span>
            </button>
          )}
        {selectedSeason && (view === "chapters" || view === "write") && (
          <button
            onClick={() => navigateTo("chapters")}
            className={`w-full flex items-center gap-2 px-3 py-2 ml-4 rounded-lg text-xs font-medium transition-colors ${view === "chapters" || view === "write" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            data-testid="nav-chapters"
          >
            <FileText size={13} />
            <span className="truncate">{selectedSeason.title}</span>
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link href="/profile" onClick={() => setMobileSidebarOpen(false)}>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            data-testid="button-go-profile"
          >
            <User size={13} /> Profil Saya
          </button>
        </Link>
        <Link href="/" onClick={() => setMobileSidebarOpen(false)}>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Home size={13} /> Kembali ke Beranda
          </button>
        </Link>
        {(user as any)?.verificationStatus === "verified" ? (
          <div
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-500 cursor-default"
            data-testid="button-request-verification"
          >
            <BadgeCheck size={13} /> Terverifikasi
          </div>
        ) : (user as any)?.verificationStatus === "pending" ? (
          <div
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-yellow-600 cursor-default"
            data-testid="button-request-verification"
          >
            <BadgeCheck size={13} /> Verifikasi Diproses...
          </div>
        ) : (
          <Link href="/verify-author">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="button-request-verification"
            >
              <BadgeCheck size={13} /> Ajukan Verifikasi
            </button>
          </Link>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
          data-testid="button-writer-logout"
        >
          <LogOut size={13} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-card/50 flex-col min-h-screen">
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Menu
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Chapter Preview Modal ── */}
      {chapterPreviewOpen && (
        <ChapterPreviewModal
          title={writeForm.title}
          chapterNumber={writeForm.chapterNumber}
          content={writeForm.content}
          onClose={() => setChapterPreviewOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* ── Mobile Top Header ── */}
        <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-mobile-menu"
          >
            <Menu size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {mobileTitle}
            </p>
            {selectedStory && view !== "stories" && view !== "stats" && (
              <p className="text-[10px] text-muted-foreground truncate">
                {selectedStory.title}
              </p>
            )}
          </div>
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-primary" />
            </div>
          )}
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* ── Stats View ── */}
          {view === "stats" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp size={20} /> Statistik
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Ringkasan performa cerita kamu
                </p>
              </div>

              {!writerStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Total Views",
                        value: (writerStats.totalViews ?? 0).toLocaleString(),
                        icon: <Eye size={15} />,
                        color: "text-blue-500",
                        bg: "bg-blue-500/10",
                      },
                      {
                        label: "Total Cerita",
                        value: writerStats.totalStories ?? 0,
                        icon: <BookOpen size={15} />,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                      },
                      {
                        label: "Total Bab",
                        value: writerStats.totalChapters ?? 0,
                        icon: <FileText size={15} />,
                        color: "text-violet-500",
                        bg: "bg-violet-500/10",
                      },
                      {
                        label: "Dipublish",
                        value: writerStats.totalPublished ?? 0,
                        icon: <Eye size={15} />,
                        color: "text-orange-500",
                        bg: "bg-orange-500/10",
                      },
                    ].map(({ label, value, icon, color, bg }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border p-4 bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}
                        >
                          {icon}
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Top Stories */}
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                        <BarChart2
                          size={15}
                          className="text-muted-foreground"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          Top Novel
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          Views tertinggi
                        </span>
                      </div>
                      {!writerStats.topStories?.length ? (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                          Belum ada data
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {writerStats.topStories.map((story, i) => (
                            <div
                              key={story.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                            >
                              <span
                                className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}
                              >
                                {i + 1}
                              </span>
                              <div className="w-8 aspect-[2/3] rounded-md overflow-hidden bg-muted flex-shrink-0">
                                {story.coverUrl ? (
                                  <img
                                    src={story.coverUrl}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen
                                      size={10}
                                      className="text-muted-foreground"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground truncate">
                                  {story.title}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {story.category} · {story.totalChapters} ch
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 bg-muted/60 px-2 py-1 rounded-full">
                                <Eye size={10} />{" "}
                                {(story.viewCount ?? 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Chapters */}
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                        <FileText size={15} className="text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          Top Bab
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          Views per bab
                        </span>
                      </div>
                      {!writerStats.topChapters?.length ? (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                          Belum ada data bab
                        </div>
                      ) : (
                        <div className="divide-y divide-border max-h-72 overflow-y-auto">
                          {writerStats.topChapters.map((ch, i) => (
                            <div
                              key={ch.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
                            >
                              <span
                                className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}
                              >
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-foreground font-medium truncate">
                                  Bab {ch.chapterNumber}: {ch.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {ch.storyTitle}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 bg-muted/60 px-2 py-1 rounded-full">
                                <Eye size={10} />{" "}
                                {(ch.viewCount ?? 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Stories View ── */}
          {view === "stories" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Cerita Saya
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stories?.length ?? 0} cerita terdaftar
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openStoryForm()}
                  data-testid="button-create-story"
                >
                  <Plus size={14} className="mr-1.5" /> Cerita Baru
                </Button>
              </div>

              {storiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : !stories || stories.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                  <BookOpen
                    size={32}
                    className="mx-auto text-muted-foreground/30 mb-3"
                  />
                  <p className="font-semibold text-foreground mb-1">
                    Belum ada cerita
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mulai tulis cerita pertamamu!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => openStoryForm()}
                    data-testid="button-create-first-story"
                  >
                    <Plus size={13} className="mr-1" /> Buat Cerita
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
                      data-testid={`row-story-${story.id}`}
                    >
                      <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {story.coverUrl ? (
                          <img
                            src={story.coverUrl}
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen
                              size={14}
                              className="text-muted-foreground/50"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {story.title}
                          </h3>
                          {!story.published && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                              Draft
                            </span>
                          )}
                          {story.published && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                              Published
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {story.description || "Tidak ada deskripsi"}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                          <span className="capitalize">{story.category}</span>
                          <span className="capitalize">{story.status}</span>
                          <span>{story.totalChapters} chapter</span>
                          <span className="flex items-center gap-0.5">
                            <Eye size={9} /> {story.viewCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStory(story);
                            setView("seasons");
                          }}
                          data-testid={`button-manage-${story.id}`}
                        >
                          <Layers size={13} className="mr-1 hidden sm:block" />{" "}
                          Season
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCharacterStory(story);
                            setView("characters");
                          }}
                          data-testid={`button-characters-${story.id}`}
                        >
                          <Users size={13} className="mr-1 hidden sm:block" />{" "}
                          Karakter
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openStoryForm(story)}
                          data-testid={`button-edit-story-${story.id}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => downloadPdf(story.id, story.title)}
                          disabled={downloadingPdf === story.id}
                          title="Download PDF backup"
                          data-testid={`button-download-pdf-${story.id}`}
                        >
                          {downloadingPdf === story.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <FileDown size={13} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "story",
                              id: story.id,
                              name: story.title,
                            })
                          }
                          data-testid={`button-delete-story-${story.id}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Seasons View ── */}
          {view === "seasons" && selectedStory && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("stories")}
                  data-testid="button-back-to-stories"
                >
                  <ArrowLeft size={14} className="mr-1" /> Kembali
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground truncate">
                    {selectedStory.title}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Kelola season cerita
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openSeasonForm()}
                  data-testid="button-create-season"
                >
                  <Plus size={14} className="mr-0" /> Tambah Season
                </Button>
              </div>
              {!seasons || seasons.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                  <Layers
                    size={32}
                    className="mx-auto text-muted-foreground/30 mb-3"
                  />
                  <p className="font-semibold text-foreground mb-1">
                    Belum ada season. Tambahkan season pertama!
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => openSeasonForm()}
                    data-testid="button-create-first-season"
                  >
                    <Plus size={13} className="mr-1" /> Buat Season
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {seasons.map((season) => (
                    <div
                      key={season.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                      data-testid={`row-season-${season.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {season.seasonNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">
                          {season.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSeason(season);
                            setView("chapters");
                          }}
                          data-testid={`button-chapters-${season.id}`}
                        >
                          <FileText
                            size={13}
                            className="mr-1 hidden sm:block"
                          />{" "}
                          Bab
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openSeasonForm(season)}
                          data-testid={`button-edit-season-${season.id}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "season",
                              id: season.id,
                              name: season.title,
                            })
                          }
                          data-testid={`button-delete-season-${season.id}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Chapters View ── */}
          {view === "chapters" && selectedSeason && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("seasons")}
                  data-testid="button-back-to-seasons"
                >
                  <ArrowLeft size={14} className="mr-1" /> Kembali
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground">
                    {selectedSeason.title}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {selectedStory?.title} · {chapters?.length ?? 0} chapter
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openNewWrite()}
                  data-testid="button-create-chapter"
                >
                  <Plus size={14} className="mr-0" /> Bab Baru
                </Button>
              </div>
              {!chapters || chapters.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                  <FileText
                    size={32}
                    className="mx-auto text-muted-foreground/30 mb-3"
                  />
                  <p className="font-semibold text-foreground mb-1">
                    Belum ada bab. Mulai menulis!
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => openNewWrite()}
                    data-testid="button-create-first-chapter"
                  >
                    <Plus size={13} className="mr-0" /> Bab Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                      data-testid={`row-chapter-${ch.id}`}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-8 text-center flex-shrink-0">
                        {ch.chapterNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {ch.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {ch.published ? (
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <Eye size={9} /> Published
                            </span>
                          ) : ch.scheduledAt ? (
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <CalendarClock size={9} /> Terjadwal
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <EyeOff size={9} /> Draft
                            </span>
                          )}
                          <span>{ch.viewCount} views</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Quick publish toggle */}
                        <button
                          onClick={() =>
                            toggleChapterPublish.mutate({
                              id: ch.id,
                              published: !ch.published,
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${ch.published ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                          title={ch.published ? "Unpublish" : "Publish"}
                          data-testid={`button-toggle-publish-${ch.id}`}
                        >
                          {ch.published ? (
                            <Eye size={13} />
                          ) : (
                            <EyeOff size={13} />
                          )}
                        </button>
                        <Button
                          size="sm"
                          onClick={() => openWrite(ch)}
                          data-testid={`button-write-${ch.id}`}
                        >
                          <Pencil size={13} className="mr-1 hidden sm:block" />{" "}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openChapterForm(ch)}
                          data-testid={`button-edit-chapter-${ch.id}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "chapter",
                              id: ch.id,
                              name: ch.title,
                            })
                          }
                          data-testid={`button-delete-chapter-${ch.id}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Write View ── */}
          {view === "write" && (
            <div className="space-y-4">
              {/* Header: back + preview */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setView("chapters")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-back-to-chapters"
                >
                  <ArrowLeft size={16} /> Kembali ke daftar bab
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChapterPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                    data-testid="button-preview-chapter"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <Button
                    size="sm"
                    onClick={() => saveWrite.mutate()}
                    disabled={saveWrite.isPending || !writeForm.title}
                    data-testid="button-save-chapter"
                  >
                    {saveWrite.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>

              {/* No. Bab + Terbitkan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    No. Bab *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={writeForm.chapterNumber}
                    onChange={(e) =>
                      setWriteForm((f) => ({
                        ...f,
                        chapterNumber: Number(e.target.value),
                      }))
                    }
                    data-testid="input-chapter-number"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={writeForm.published}
                      onChange={(e) =>
                        setWriteForm((f) => ({
                          ...f,
                          published: e.target.checked,
                          scheduledAt: e.target.checked ? "" : f.scheduledAt,
                        }))
                      }
                      className="rounded accent-primary"
                      data-testid="checkbox-chapter-published"
                    />
                    Terbitkan
                  </label>
                </div>
              </div>

              {/* Judul Bab */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Judul Bab *
                </label>
                <Input
                  value={writeForm.title}
                  onChange={(e) =>
                    setWriteForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Judul chapter..."
                  data-testid="input-write-chapter-title"
                />
              </div>

              {/* Konten Cerita */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Konten Cerita *
                </label>
                <div className="border border-border rounded-xl overflow-hidden">
                  <RichTextEditor
                    value={writeForm.content}
                    onChange={(html) =>
                      setWriteForm((f) => ({ ...f, content: html }))
                    }
                    minHeight={450}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {wordCount} kata · ~{readTime} menit baca
                </p>
              </div>

              {/* Jadwal Terbit (hanya saat draft) */}
              {!writeForm.published && (
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      size={15}
                      className="text-muted-foreground"
                    />
                    <span className="text-sm font-medium">Jadwalkan Rilis</span>
                    {isScheduled && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                        <Clock size={10} /> Terjadwal
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Tanggal &amp; Waktu
                    </label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="datetime-local"
                        value={writeForm.scheduledAt}
                        onChange={(e) =>
                          setWriteForm((f) => ({
                            ...f,
                            scheduledAt: e.target.value,
                          }))
                        }
                        className="flex-1 text-sm"
                        data-testid="input-schedule-date"
                      />
                      {writeForm.scheduledAt && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setWriteForm((f) => ({ ...f, scheduledAt: "" }))
                          }
                          data-testid="button-clear-schedule"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bab akan otomatis terbit pada tanggal dan waktu ini.
                  </p>
                </div>
              )}

              {/* Save button (bottom) */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveWrite.mutate()}
                  disabled={saveWrite.isPending || !writeForm.title}
                  data-testid="button-save-chapter-bottom"
                >
                  {saveWrite.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Bab"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Characters View ── */}
          {view === "characters" && characterStory && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setView("stories"); setCharacterStory(null); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users size={18} /> Daftar Karakter
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{characterStory.title}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCharacter(null);
                    setCharacterForm({ name: "", role: "pendukung", description: "", imageUrl: "", relations: "" });
                    setCharacterDialog(true);
                  }}
                  data-testid="button-add-character"
                >
                  <Plus size={14} className="mr-1.5" /> Tambah
                </Button>
              </div>

              {!characters ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
              ) : characters.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                  <Users size={28} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Belum ada karakter</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tambah karakter untuk cerita ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {characters.map((char: any) => (
                    <div key={char.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors" data-testid={`row-character-${char.id}`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {char.imageUrl ? (
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User size={16} className="text-primary/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-foreground">{char.name}</span>
                          {char.role && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{char.role}</span>
                          )}
                        </div>
                        {char.description && <p className="text-xs text-muted-foreground line-clamp-2">{char.description}</p>}
                        {char.relations && <p className="text-[11px] text-muted-foreground/70 mt-1 italic line-clamp-1">Hubungan: {char.relations}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingCharacter(char);
                          setCharacterForm({ name: char.name, role: char.role || "pendukung", description: char.description || "", imageUrl: char.imageUrl || "", relations: char.relations || "" });
                          setCharacterDialog(true);
                        }} data-testid={`button-edit-character-${char.id}`}>
                          <Pencil size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteCharacter.mutate(char.id)} data-testid={`button-delete-character-${char.id}`}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Story Dialog ── */}
      <Dialog open={storyDialog} onOpenChange={(open) => { if (!open) handleStoryCancelDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStory ? "Edit Cerita" : "Cerita Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul *
              </label>
              <Input
                value={storyForm.title}
                onChange={(e) =>
                  setStoryForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: slugify(e.target.value),
                  }))
                }
                placeholder="Judul cerita"
                data-testid="input-story-title"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Slug
              </label>
              <Input
                value={storyForm.slug}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="url-cerita"
                data-testid="input-story-slug"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Sinopsis
              </label>
              <Textarea
                value={storyForm.description}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Cerita singkat tentang novel ini..."
                data-testid="input-story-desc"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Cover
              </label>
              <CoverUpload
                value={storyForm.coverUrl}
                onChange={handleStoryCoverChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Kategori
                </label>
                <Select
                  value={storyForm.category}
                  onValueChange={(v) =>
                    setStoryForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-testid="select-story-category"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novel">Novel</SelectItem>
                    <SelectItem value="komik">Komik</SelectItem>
                    <SelectItem value="cerpen">Cerpen</SelectItem>
                    <SelectItem value="puisi">Puisi</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Status
                </label>
                <Select
                  value={storyForm.status}
                  onValueChange={(v) =>
                    setStoryForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-testid="select-story-status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tags
              </label>
              <Input
                value={storyForm.tags}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="e.g Romance, Fantasy, Action (Pisahkan dengan koma)"
                data-testid="input-story-tags"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Link Donasi{" "}
                <span className="font-normal text-muted-foreground/70">
                  (opsional)
                </span>
              </label>
              <Input
                value={storyForm.donationUrl}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, donationUrl: e.target.value }))
                }
                placeholder="https://saweria.co/username atau https://trakteer.id/username"
                data-testid="input-story-donation"
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={storyForm.published}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, published: e.target.checked }))
                }
                className="accent-primary"
                data-testid="check-published"
              />
              Publish sekarang
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleStoryCancelDialog}>
              Batal
            </Button>
            <Button
              onClick={submitStory}
              disabled={
                createStory.isPending ||
                updateStory.isPending ||
                !storyForm.title
              }
              data-testid="button-submit-story"
            >
              {createStory.isPending || updateStory.isPending
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={seasonDialog} onOpenChange={setSeasonDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingSeason ? "Edit Season" : "Tambah Season"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nomor Season
              </label>
              <Input
                type="number"
                value={seasonForm.seasonNumber}
                onChange={(e) =>
                  setSeasonForm((f) => ({
                    ...f,
                    seasonNumber: Number(e.target.value),
                  }))
                }
                min={1}
                data-testid="input-season-number"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul Season
              </label>
              <Input
                value={seasonForm.title}
                onChange={(e) =>
                  setSeasonForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g Season: The Beginning"
                data-testid="input-season-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={submitSeason}
              disabled={createSeason.isPending || updateSeason.isPending}
              data-testid="button-submit-season"
            >
              {createSeason.isPending || updateSeason.isPending
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingChapterMeta ? "Edit Chapter" : "Tambah Chapter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nomor Bab
              </label>
              <Input
                type="number"
                value={chapterForm.chapterNumber}
                onChange={(e) =>
                  setChapterForm((f) => ({
                    ...f,
                    chapterNumber: Number(e.target.value),
                  }))
                }
                min={1}
                data-testid="input-chapter-number"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul Bab
              </label>
              <Input
                value={chapterForm.title}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Judul chapter"
                data-testid="input-chapter-title"
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={chapterForm.published}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, published: e.target.checked }))
                }
                className="accent-primary"
                data-testid="check-chapter-published"
              />
              Publish langsung
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={submitChapter}
              disabled={
                createChapter.isPending ||
                updateChapterMeta.isPending ||
                !chapterForm.title
              }
              data-testid="button-submit-chapter"
            >
              {createChapter.isPending || updateChapterMeta.isPending
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(o) => {
          if (!o) setDeleteConfirm(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Hapus{" "}
              {deleteConfirm?.type === "story" ? "Novel" : deleteConfirm?.type}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Yakin mau hapus{" "}
              <span className="font-semibold text-foreground">
                "{deleteConfirm?.name}"
              </span>
              ? Aksi ini tidak bisa dibatalkan.
            </p>
            {deleteConfirm?.type === "story" && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex gap-3 items-start">
                <span className="text-base mt-0.5">📄</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tenang — kami akan kirim{" "}
                  <span className="font-semibold text-foreground">
                    file backup PDF
                  </span>{" "}
                  berisi seluruh isi novel ini ke emailmu secara otomatis
                  sebelum dihapus.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "story")
                  deleteStory.mutate(deleteConfirm.id);
                if (deleteConfirm.type === "season")
                  deleteSeason.mutate(deleteConfirm.id);
                if (deleteConfirm.type === "chapter")
                  deleteChapter.mutate(deleteConfirm.id);
              }}
              data-testid="button-confirm-delete"
            >
              {deleteConfirm?.type === "story"
                ? "Hapus & Kirim Backup"
                : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!needsUsername} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <AtSign size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  Buat Username Kamu
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wajib diisi sebelum mulai menulis
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selamat, kamu sudah diterima sebagai penulis! Sebelum mulai
              menulis novel, silakan pilih username kamu. Username ini akan
              tampil sebagai nama penulis di halaman publik.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                Username
              </label>
              <div className="flex items-center border border-border rounded-xl overflow-hidden bg-muted/30 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                <span className="px-3 text-xs text-muted-foreground bg-muted/50 border-r border-border py-2.5 shrink-0">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setUsernameAvailable(null);
                    checkUsername(e.target.value);
                  }}
                  placeholder="nama-penulis"
                  maxLength={30}
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
                  data-testid="input-username-setup"
                />
                <div className="px-3">
                  {usernameChecking && (
                    <Loader2
                      size={14}
                      className="animate-spin text-muted-foreground"
                    />
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <CheckCircle size={14} className="text-emerald-500" />
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <XCircle size={14} className="text-destructive" />
                  )}
                </div>
              </div>
              {usernameSlug.length > 0 && usernameSlug.length < 3 && (
                <p className="text-xs text-muted-foreground">
                  Minimal 3 karakter
                </p>
              )}
              {usernameAvailable === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={11} /> Username tersedia
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle size={11} /> Username sudah dipakai, coba yang lain
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Hanya huruf kecil, angka, dan tanda - (contoh: nama-penulis)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setupUsername.mutate(usernameSlug)}
              disabled={
                !usernameAvailable ||
                setupUsername.isPending ||
                usernameSlug.length < 3
              }
              className="w-full"
              data-testid="button-save-username"
            >
              {setupUsername.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />{" "}
                  Menyimpan...
                </>
              ) : (
                "Simpan Username"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Character Dialog ── */}
      <Dialog open={characterDialog} onOpenChange={(open) => { setCharacterDialog(open); if (!open) { setEditingCharacter(null); setCharacterForm({ name: "", role: "pendukung", description: "", imageUrl: "", relations: "" }); } }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCharacter ? "Edit Karakter" : "Tambah Karakter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nama *</label>
              <Input value={characterForm.name} onChange={e => setCharacterForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama karakter" data-testid="input-char-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Peran</label>
              <Select value={characterForm.role} onValueChange={v => setCharacterForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-char-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="protagonis">Protagonis</SelectItem>
                  <SelectItem value="antagonis">Antagonis</SelectItem>
                  <SelectItem value="pendukung">Pendukung</SelectItem>
                  <SelectItem value="figuran">Figuran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Deskripsi</label>
              <Textarea value={characterForm.description} onChange={e => setCharacterForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Kepribadian, latar belakang, dll..." data-testid="input-char-desc" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">URL Foto (opsional)</label>
              <Input value={characterForm.imageUrl} onChange={e => setCharacterForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." data-testid="input-char-image" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Hubungan dengan karakter lain</label>
              <Input value={characterForm.relations} onChange={e => setCharacterForm(f => ({ ...f, relations: e.target.value }))} placeholder="e.g. Adik Arya, musuh bebuyutan..." data-testid="input-char-relations" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharacterDialog(false)}>Batal</Button>
            <Button
              disabled={!characterForm.name.trim() || createCharacter.isPending || updateCharacter.isPending}
              onClick={() => {
                if (editingCharacter) {
                  updateCharacter.mutate({ id: editingCharacter.id, data: characterForm });
                } else {
                  createCharacter.mutate(characterForm);
                }
              }}
              data-testid="button-submit-character"
            >
              {(createCharacter.isPending || updateCharacter.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
