import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor, renderRichContent } from "@/components/ui/rich-text-editor";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Plus, Pencil, Trash2, ChevronRight, ChevronUp, ChevronDown,
  Eye, EyeOff, Star, ArrowLeft, Layers, FileText,
  Upload, ImageIcon, RotateCcw, Clock, CalendarClock, X,
  LogOut, ExternalLink, Settings, TrendingUp, BarChart2, Bell,
  Info, AlertTriangle, CheckCircle2,
} from "lucide-react";
import Cropper from "react-easy-crop";
import type { NovelStory, NovelSeason, NovelChapter, BannerSlide, Announcement } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

type View = "stories" | "seasons" | "chapters" | "write" | "settings" | "stats" | "announcements";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: { x: number; y: number; width: number; height: number }): Promise<Blob> {
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
    0, 0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas is empty")), "image/jpeg", 0.9);
  });
}

function CoverUploadCrop({
  value, onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleConfirmCrop = async () => {
    if (!rawSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob, `cover-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
      setCropOpen(false);
      setRawSrc(null);
      toast({ title: t("admin.novel.toast.coverUploaded") });
    } catch {
      toast({ title: t("admin.novel.toast.coverFailed"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-upload-cover"
        >
          <Upload size={14} className="mr-1.5" /> {t("admin.novel.form.uploadCover")}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange("")}
            data-testid="button-remove-cover"
          >
            <RotateCcw size={14} className="mr-1.5" /> {t("admin.novel.form.deleteCover")}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-cover-file"
        />
      </div>

      {value ? (
        <div className="mt-2 relative w-24">
          <img
            src={value}
            alt="Sampul"
            className="w-24 aspect-[2/3] object-cover rounded-lg border border-border"
          />
        </div>
      ) : (
        <div
          className="mt-2 w-24 aspect-[2/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-testid="cover-placeholder"
        >
          <ImageIcon size={20} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">2:3</span>
        </div>
      )}

      <div className="mt-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t("admin.orUrl")}
          className="text-xs h-8"
          data-testid="input-story-cover-url"
        />
      </div>

      <Dialog open={cropOpen} onOpenChange={open => { if (!open) { setCropOpen(false); setRawSrc(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.novel.form.cropCover")}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden">
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
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
                data-testid="slider-crop-zoom"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropOpen(false); setRawSrc(null); }}>{t("admin.novel.form.cancel")}</Button>
            <Button onClick={handleConfirmCrop} disabled={uploading} data-testid="button-confirm-crop">
              {uploading ? t("admin.uploading") : t("admin.novel.form.useThisImage")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerUploadCrop({
  value, onChange,
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

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleConfirmCrop = async () => {
    if (!rawSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob, `banner-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
      setCropOpen(false);
      setRawSrc(null);
      toast({ title: "Banner berhasil diupload!" });
    } catch {
      toast({ title: "Upload gagal", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} className="mr-1.5" /> Upload Gambar
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange("")}>
            <RotateCcw size={14} className="mr-1.5" /> Hapus
          </Button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {value ? (
        <div className="mt-2 relative w-full max-w-xs">
          <img src={value} alt="Banner" className="w-full h-20 object-cover rounded-lg border border-border" />
        </div>
      ) : (
        <div
          className="mt-2 w-full max-w-xs h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={20} className="text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">16:5 (Banner)</span>
        </div>
      )}

      <div className="mt-2">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="atau tempel URL gambar..." className="text-xs h-8" />
      </div>

      <Dialog open={cropOpen} onOpenChange={open => { if (!open) { setCropOpen(false); setRawSrc(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Gambar Banner</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-52 bg-black rounded-lg overflow-hidden">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">Zoom</span>
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-primary" />
              <span className="text-xs text-muted-foreground w-8 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropOpen(false); setRawSrc(null); }}>Batal</Button>
            <Button onClick={handleConfirmCrop} disabled={uploading}>
              {uploading ? "Mengupload..." : "Gunakan Gambar Ini"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<BannerSlide>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    imageUrl: initial?.imageUrl ?? "",
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    link: initial?.link ?? "",
    active: initial?.active ?? true,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Gambar Banner *</label>
        <BannerUploadCrop value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Judul <span className="text-muted-foreground font-normal">(opsional)</span></label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul yang muncul di banner..." />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Label Badge <span className="text-muted-foreground font-normal">(opsional · cth: Eksklusif, Baru, Hot)</span></label>
        <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Eksklusif..." />
        <p className="text-[11px] text-muted-foreground mt-1">Tampil sebagai badge hijau di banner. Kosongkan jika tidak perlu.</p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Link Novel <span className="text-muted-foreground font-normal">(opsional · cth: /judul-novel)</span></label>
        <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/judul-novel" />
        <p className="text-[11px] text-muted-foreground mt-1">Isi dengan slug novel (cth: <code>/ruang-di-antara-kita</code>) agar banner tampilkan badge &amp; sampul novel unggulan secara otomatis.</p>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
        Aktifkan banner (tampil di halaman utama)
      </label>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button onClick={() => onSave(form)} disabled={!form.imageUrl}>Simpan Banner</Button>
      </DialogFooter>
    </div>
  );
}

function StoryForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<NovelStory>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    coverUrl: initial?.coverUrl ?? "",
    category: initial?.category ?? "novel",
    status: initial?.status ?? "ongoing",
    tags: (initial?.tags ?? []).join(", "),
    published: initial?.published ?? false,
    featured: initial?.featured ?? false,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const parsedTags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.storyTitle")} *</label>
        <Input
          value={form.title}
          onChange={e => { set("title", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
          placeholder="Story title"
          data-testid="input-story-title"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.slug")} *</label>
        <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="url-cerita" data-testid="input-story-slug" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.description")}</label>
        <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Story synopsis..." data-testid="input-story-description" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.cover")}</label>
        <CoverUploadCrop value={form.coverUrl} onChange={v => set("coverUrl", v)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.tags")}</label>
        <Input
          value={form.tags}
          onChange={e => set("tags", e.target.value)}
          placeholder="e.g. Action, Romance, Isekai (separate with commas)"
          data-testid="input-story-tags"
        />
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {parsedTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.category")}</label>
          <Select value={form.category} onValueChange={v => set("category", v)}>
            <SelectTrigger data-testid="select-story-category"><SelectValue /></SelectTrigger>
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
          <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.status")}</label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger data-testid="select-story-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} className="rounded" data-testid="checkbox-story-published" />
          {t("admin.novel.form.publish")}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="rounded" data-testid="checkbox-story-featured" />
          {t("admin.novel.form.featured")}
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-story">{t("admin.novel.form.cancel")}</Button>
        <Button onClick={() => onSave({ ...form, tags: parsedTags })} disabled={!form.title || !form.slug} data-testid="button-save-story">{t("admin.novel.form.save")}</Button>
      </DialogFooter>
    </div>
  );
}

function SeasonForm({ storyId, initial, onSave, onCancel }: {
  storyId: string;
  initial?: Partial<NovelSeason>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    seasonNumber: initial?.seasonNumber ?? 1,
  });
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.seasonNumber")} *</label>
        <Input type="number" min={1} value={form.seasonNumber} onChange={e => setForm(f => ({ ...f, seasonNumber: Number(e.target.value) }))} data-testid="input-season-number" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.seasonTitle")} *</label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g: The Beginning" data-testid="input-season-title" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-season">{t("admin.novel.form.cancel")}</Button>
        <Button onClick={() => onSave({ ...form, storyId })} disabled={!form.title} data-testid="button-save-season">{t("admin.novel.form.save")}</Button>
      </DialogFooter>
    </div>
  );
}

function ChapterPreviewModal({ title, chapterNumber, content, onClose }: {
  title: string;
  chapterNumber: number;
  content: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const wordCount = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">{t("admin.novel.form.previewTitle")}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Draft</span>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          <X size={15} />
          Tutup Preview
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">Preview</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
            Bab {chapterNumber}: {title || <span className="text-muted-foreground italic">Judul belum diisi</span>}
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>~{readTime} menit baca · {wordCount} kata</span>
          </div>
        </div>
        {content ? (
          <div
            className="prose prose-gray dark:prose-invert max-w-none prose-p:leading-[1.95] prose-headings:font-bold prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-ul:my-2 prose-ol:my-2 prose-strong:font-bold prose-em:italic prose-p:my-4 prose-hr:my-8 font-sans text-base"
            dangerouslySetInnerHTML={{ __html: renderRichContent(content) }}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FileText size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Konten belum ada. Mulai menulis di editor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterWrite({ chapter, storyId, seasonId, onBack }: {
  chapter?: NovelChapter;
  storyId: string;
  seasonId: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { t } = useLanguage();

  const toDatetimeLocal = (val?: string | Date | null) => {
    if (!val) return "";
    const d = new Date(val as string);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: chapter?.title ?? "",
    chapterNumber: chapter?.chapterNumber ?? 1,
    content: chapter ? renderRichContent(chapter.content) : "",
    published: chapter?.published ?? false,
    scheduledAt: toDatetimeLocal(chapter?.scheduledAt),
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const isScheduled = !form.published && !!form.scheduledAt && new Date(form.scheduledAt) > new Date();

  const save = useMutation({
    mutationFn: (data: any) => chapter
      ? apiRequest("PUT", `/api/novel/chapters/${chapter.id}`, data)
      : apiRequest("POST", "/api/novel/chapters", { ...data, storyId, seasonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/seasons", seasonId, "chapters"] });
      toast({ title: "Saved successfully!" });
      onBack();
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const handleSave = () => {
    const payload: any = {
      title: form.title,
      chapterNumber: form.chapterNumber,
      content: form.content,
      published: form.published,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    };
    save.mutate(payload);
  };

  return (
    <>
    {previewOpen && (
      <ChapterPreviewModal
        title={form.title}
        chapterNumber={form.chapterNumber}
        content={form.content}
        onClose={() => setPreviewOpen(false)}
      />
    )}
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-from-write">
          <ArrowLeft size={16} /> {t("admin.novel.form.returnToChapters")}
        </button>
        <button
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
          data-testid="button-preview-chapter"
        >
          <Eye size={14} />
          {t("admin.novel.form.previewChapter")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.chapterNumber")} *</label>
          <Input type="number" min={1} value={form.chapterNumber} onChange={e => setForm(f => ({ ...f, chapterNumber: Number(e.target.value) }))} data-testid="input-chapter-number" />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => setForm(f => ({ ...f, published: e.target.checked, scheduledAt: e.target.checked ? "" : f.scheduledAt }))}
              className="rounded"
              data-testid="checkbox-chapter-published"
            />
            {t("admin.novel.form.publish")}
          </label>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.chapterTitle")} *</label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Chapter title" data-testid="input-chapter-title" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{t("admin.novel.form.storyContent")} *</label>
        <RichTextEditor
          value={form.content}
          onChange={html => setForm(f => ({ ...f, content: html }))}
          placeholder="Write the story content here... Use the toolbar for bold, italic, list, and more."
          minHeight={450}
        />
        {(() => {
          const text = form.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const words = text ? text.split(" ").filter(Boolean).length : 0;
          return <p className="text-xs text-muted-foreground mt-1">{words} {t("admin.novel.form.words")} · ~{Math.max(1, Math.ceil(words / 200))} {t("admin.novel.form.minRead")}</p>;
        })()}
      </div>

      {/* Schedule Release */}
      {!form.published && (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">{t("admin.novel.form.scheduleRelease")}</span>
            {isScheduled && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                <Clock size={10} /> {t("admin.novel.scheduled")}
              </span>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("admin.novel.form.scheduleDate")}</label>
            <div className="flex gap-2 items-center">
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="flex-1 text-sm"
                data-testid="input-chapter-scheduled-at"
              />
              {form.scheduledAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setForm(f => ({ ...f, scheduledAt: "" }))}
                  data-testid="button-clear-schedule"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("admin.novel.form.scheduleHint")}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} data-testid="button-discard-chapter">{t("admin.novel.form.cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.title || !form.content || save.isPending} data-testid="button-save-chapter">
          {save.isPending ? t("admin.uploading") : t("admin.novel.form.saveChapter")}
        </Button>
      </div>
    </div>
    </>
  );
}

function AnnouncementForm({ initial, onSave, onCancel }: {
  initial?: { message: string; type: string; link?: string | null; linkText?: string | null; active: boolean; expiresAt?: string | Date | null };
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    message: initial?.message ?? "",
    type: (initial?.type ?? "info") as "info" | "warning" | "success",
    link: initial?.link ?? "",
    linkText: initial?.linkText ?? "",
    active: initial?.active ?? true,
    expiresAt: initial?.expiresAt ? new Date(initial.expiresAt as string).toISOString().slice(0, 16) : "",
  });

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Pesan *</label>
        <Textarea
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Tulis pesan pengumuman..."
          rows={3}
          data-testid="input-announcement-message"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Tipe</label>
        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
          <SelectTrigger data-testid="select-announcement-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info (biru)</SelectItem>
            <SelectItem value="warning">Peringatan (kuning)</SelectItem>
            <SelectItem value="success">Sukses (hijau)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Link (opsional)</label>
        <Input
          value={form.link}
          onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
          placeholder="https://... atau /slug"
          data-testid="input-announcement-link"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Teks Link (opsional)</label>
        <Input
          value={form.linkText}
          onChange={e => setForm(f => ({ ...f, linkText: e.target.value }))}
          placeholder="Selengkapnya"
          data-testid="input-announcement-linktext"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Berakhir pada (opsional)</label>
        <Input
          type="datetime-local"
          value={form.expiresAt}
          onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
          data-testid="input-announcement-expires"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, active: !f.active }))}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.active ? "bg-primary" : "bg-muted-foreground/30"}`}
          data-testid="toggle-announcement-active"
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm text-muted-foreground">Aktifkan pengumuman</span>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button
          disabled={!form.message.trim()}
          onClick={() => onSave({
            message: form.message.trim(),
            type: form.type,
            link: form.link.trim() || null,
            linkText: form.linkText.trim() || null,
            active: form.active,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          })}
          data-testid="button-save-announcement"
        >
          Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function ManageNovel() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("stories");
  const [selectedStory, setSelectedStory] = useState<NovelStory | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<NovelSeason | null>(null);
  const [editingChapter, setEditingChapter] = useState<NovelChapter | undefined>(undefined);

  const [storyDialog, setStoryDialog] = useState<{ open: boolean; story?: NovelStory }>({ open: false });
  const [seasonDialog, setSeasonDialog] = useState<{ open: boolean; season?: NovelSeason }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; name: string } | null>(null);
  const [bannerDialog, setBannerDialog] = useState<{ open: boolean; banner?: BannerSlide }>({ open: false });
  const [announcementDialog, setAnnouncementDialog] = useState<{ open: boolean; ann?: Announcement }>({ open: false });

  const { data: adminStats } = useQuery<{
    totalViews: number; totalStories: number; totalChapters: number; totalFeatured: number;
    totalRatings: number; avgRating: number;
    topStories: Array<{ id: string; title: string; coverUrl?: string; viewCount: number; totalChapters: number; category: string; }>;
    topChapters: Array<{ id: string; title: string; chapterNumber: number; viewCount: number; storyTitle: string; storySlug: string; }>;
  }>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
    enabled: !!user,
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/all"],
    queryFn: () => fetch("/api/announcements/all", { credentials: "include" }).then(r => r.json()),
    enabled: !!user,
  });

  const { data: banners, isLoading: bannersLoading } = useQuery<BannerSlide[]>({
    queryKey: ["/api/banners/all"],
    queryFn: () => fetch("/api/banners/all", { credentials: "include" }).then(r => r.json()),
    enabled: !!user,
  });

  const { data: stories, isLoading: storiesLoading } = useQuery<NovelStory[]>({
    queryKey: ["/api/novel/stories/all"],
    enabled: !!user,
  });

  const { data: seasons, isLoading: seasonsLoading } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
    queryFn: () => fetch(`/api/novel/stories/${selectedStory!.id}/seasons`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedStory?.id && !!user,
  });

  const { data: chapters, isLoading: chaptersLoading } = useQuery<NovelChapter[]>({
    queryKey: ["/api/novel/seasons", selectedSeason?.id, "chapters"],
    queryFn: () => fetch(`/api/novel/seasons/${selectedSeason!.id}/chapters/all`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedSeason?.id && !!user,
  });

  const createStory = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/novel/stories", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories/all"] }); setStoryDialog({ open: false }); toast({ title: "The story has been successfully created!" }); },
    onError: () => toast({ title: "Failed to create a story", variant: "destructive" }),
  });

  const updateStory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/novel/stories/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories/all"] }); setStoryDialog({ open: false }); toast({ title: "Story updated!" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteStory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/novel/stories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories/all"] }); setDeleteDialog(null); toast({ title: "Story deleted!" }); },
    onError: () => toast({ title: "Delete failed!", variant: "destructive" }),
  });

  const createSeason = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/novel/seasons", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setSeasonDialog({ open: false }); toast({ title: "Season successfully created!" }); },
    onError: () => toast({ title: "Failed to make a season", variant: "destructive" }),
  });

  const updateSeason = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/novel/seasons/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setSeasonDialog({ open: false }); toast({ title: "Season updated!" }); },
    onError: () => toast({ title: "Failed to renew season", variant: "destructive" }),
  });

  const deleteSeason = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/novel/seasons/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"] }); setDeleteDialog(null); toast({ title: "Season deleted!" }); },
    onError: () => toast({ title: "Failed to delete season", variant: "destructive" }),
  });

  const deleteChapter = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/novel/chapters/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/novel/seasons", selectedSeason?.id, "chapters"] }); setDeleteDialog(null); toast({ title: "Chapter deleted!" }); },
    onError: () => toast({ title: "Failed to delete chapter", variant: "destructive" }),
  });

  const toggleChapterPublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => apiRequest("PUT", `/api/novel/chapters/${id}`, { published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/novel/seasons", selectedSeason?.id, "chapters"] }),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      apiRequest("PUT", `/api/novel/stories/${id}`, { featured }),
    onSuccess: (_, { featured }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel/stories/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/novel/stories"] });
      toast({ title: featured ? "⭐ Ditandai sebagai Novel Unggulan!" : "Dihapus dari Novel Unggulan" });
    },
    onError: () => toast({ title: "Gagal mengubah status unggulan", variant: "destructive" }),
  });

  const createBanner = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/banners", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] }); setBannerDialog({ open: false }); toast({ title: "Banner berhasil ditambahkan!" }); },
    onError: () => toast({ title: "Gagal menambah banner", variant: "destructive" }),
  });

  const updateBanner = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/banners/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] }); setBannerDialog({ open: false }); toast({ title: "Banner diperbarui!" }); },
    onError: () => toast({ title: "Gagal memperbarui banner", variant: "destructive" }),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/banners/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] }); setDeleteDialog(null); toast({ title: "Banner dihapus!" }); },
    onError: () => toast({ title: "Gagal menghapus banner", variant: "destructive" }),
  });

  const createAnnouncement = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/announcements", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] }); queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }); setAnnouncementDialog({ open: false }); toast({ title: "Pengumuman ditambahkan!" }); },
    onError: () => toast({ title: "Gagal menambah pengumuman", variant: "destructive" }),
  });
  const updateAnnouncement = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/announcements/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] }); queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }); setAnnouncementDialog({ open: false }); toast({ title: "Pengumuman diperbarui!" }); },
    onError: () => toast({ title: "Gagal memperbarui pengumuman", variant: "destructive" }),
  });
  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] }); queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }); setDeleteDialog(null); toast({ title: "Pengumuman dihapus!" }); },
    onError: () => toast({ title: "Gagal menghapus pengumuman", variant: "destructive" }),
  });

  const reorderBanner = useMutation({
    mutationFn: (ids: string[]) => apiRequest("PATCH", "/api/banners/reorder", { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] }),
  });

  const handleBannerMove = (bannerId: string, direction: "up" | "down") => {
    if (!banners) return;
    const sorted = [...banners].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex(b => b.id === bannerId);
    if (direction === "up" && i === 0) return;
    if (direction === "down" && i === sorted.length - 1) return;
    const swap = direction === "up" ? i - 1 : i + 1;
    const newOrder = [...sorted];
    [newOrder[i], newOrder[swap]] = [newOrder[swap], newOrder[i]];
    reorderBanner.mutate(newOrder.map(b => b.id));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "story") deleteStory.mutate(deleteDialog.id);
    if (deleteDialog.type === "season") deleteSeason.mutate(deleteDialog.id);
    if (deleteDialog.type === "chapter") deleteChapter.mutate(deleteDialog.id);
    if (deleteDialog.type === "banner") deleteBanner.mutate(deleteDialog.id);
    if (deleteDialog.type === "announcement") deleteAnnouncement.mutate(deleteDialog.id);
  };

  const AdminHeader = () => (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen size={14} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">Admin Novel</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted" data-testid="button-view-site">
              <ExternalLink size={13} />
              Lihat Situs
            </button>
          </Link>
          {user && (
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-full hover:bg-destructive/10"
              data-testid="button-logout"
            >
              <LogOut size={13} />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );

  if (view === "write" && selectedSeason) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <ChapterWrite
            chapter={editingChapter}
            storyId={selectedStory!.id}
            seasonId={selectedSeason.id}
            onBack={() => { setEditingChapter(undefined); setView("chapters"); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tab Nav */}
        <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-xl w-fit">
          <button
            onClick={() => { setView("stories"); setSelectedStory(null); setSelectedSeason(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view !== "settings" && view !== "stats" && view !== "announcements" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Cerita
          </button>
          <button
            onClick={() => setView("stats")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "stats" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart2 size={13} /> Statistik
          </button>
          <button
            onClick={() => setView("settings")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "settings" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Settings size={13} /> Settings
          </button>
          <button
            onClick={() => setView("announcements")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "announcements" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bell size={13} /> Pengumuman
          </button>
        </div>

        {/* Breadcrumb Nav */}
        {view !== "settings" && view !== "stats" && view !== "announcements" && (
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link href="/"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Novel</span></Link>
          <ChevronRight size={14} className="text-muted-foreground" />
          <button onClick={() => { setView("stories"); setSelectedStory(null); setSelectedSeason(null); }} className={view === "stories" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} data-testid="breadcrumb-stories">
            {t("admin.novel.title")}
          </button>
          {selectedStory && (
            <>
              <ChevronRight size={14} className="text-muted-foreground" />
              <button onClick={() => { setView("seasons"); setSelectedSeason(null); }} className={view === "seasons" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} data-testid="breadcrumb-seasons">
                {selectedStory.title}
              </button>
            </>
          )}
          {selectedSeason && (
            <>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">Season {selectedSeason.seasonNumber}</span>
            </>
          )}
        </div>
        )}

        {/* ── STATS VIEW ── */}
        {view === "stats" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={22} /> Statistik
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Ringkasan data platform WOOCE Novel</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Views", value: (adminStats?.totalViews ?? 0).toLocaleString(), icon: <Eye size={15} />, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Total Novel", value: adminStats?.totalStories ?? 0, icon: <BookOpen size={15} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Total Chapter", value: adminStats?.totalChapters ?? 0, icon: <FileText size={15} />, color: "text-violet-500", bg: "bg-violet-500/10" },
                { label: "Novel Unggulan", value: adminStats?.totalFeatured ?? 0, icon: <Star size={15} fill="currentColor" />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { label: "Total Rating", value: adminStats?.totalRatings ?? 0, icon: <Star size={15} />, color: "text-orange-500", bg: "bg-orange-500/10" },
                { label: "Rata-rata Rating", value: adminStats?.avgRating ? adminStats.avgRating.toFixed(1) + "★" : "—", icon: <TrendingUp size={15} />, color: "text-pink-500", bg: "bg-pink-500/10" },
              ].map(({ label, value, icon, color, bg }) => (
                <div key={label} className="rounded-xl border border-border p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
                  <div className="text-xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Stories */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <BarChart2 size={15} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Top 5 Novel</span>
                  <span className="ml-auto text-xs text-muted-foreground">Views tertinggi</span>
                </div>
                {!adminStats?.topStories?.length ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">Belum ada data</div>
                ) : (
                  <div className="divide-y divide-border">
                    {adminStats.topStories.map((story, i) => (
                      <div key={story.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div className="w-8 aspect-[2/3] rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {story.coverUrl
                            ? <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><BookOpen size={10} className="text-muted-foreground" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{story.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">{story.category} · {story.totalChapters} ch</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 bg-muted/60 px-2 py-1 rounded-full">
                          <Eye size={10} />
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
                  <span className="text-sm font-semibold text-foreground">Top 10 Chapter</span>
                  <span className="ml-auto text-xs text-muted-foreground">Views tertinggi per chapter</span>
                </div>
                {!adminStats?.topChapters?.length ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">Belum ada data chapter views</div>
                ) : (
                  <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {adminStats.topChapters.map((ch, i) => (
                      <div key={ch.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                        <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground font-medium truncate">
                            Bab {ch.chapterNumber}: {ch.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{ch.storyTitle}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 bg-muted/60 px-2 py-1 rounded-full">
                          <Eye size={10} />
                          {(ch.viewCount ?? 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STORIES VIEW ── */}
        {view === "stories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen size={22} /> {t("admin.novel.title")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.novel.subtitle")}</p>
              </div>
              <Button onClick={() => setStoryDialog({ open: true })} data-testid="button-add-story">
                <Plus size={16} className="mr-1.5" /> {t("admin.novel.addStory")}
              </Button>
            </div>

            {storiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : !stories?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <BookOpen size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">{t("admin.novel.empty.stories")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stories.map(story => (
                  <div key={story.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors" data-testid={`card-story-${story.id}`}>
                    <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {story.coverUrl
                        ? <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-muted-foreground" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground truncate">{story.title}</span>
                        {story.featured && <Star size={12} className="text-yellow-500 flex-shrink-0" fill="currentColor" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{story.category}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${story.status === "ongoing" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : story.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                          {story.status}
                        </span>
                        <span>·</span>
                        <span className={story.published ? "text-green-600" : "text-muted-foreground"}>{story.published ? t("admin.novel.published") : t("admin.novel.draft")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        title={story.featured ? "Hapus dari Unggulan" : "Tandai sebagai Unggulan"}
                        disabled={toggleFeatured.isPending}
                        onClick={() => toggleFeatured.mutate({ id: story.id, featured: !story.featured })}
                        className={story.featured ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                        data-testid={`button-toggle-featured-${story.id}`}
                      >
                        <Star size={15} fill={story.featured ? "currentColor" : "none"} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedStory(story); setView("seasons"); }} data-testid={`button-manage-seasons-${story.id}`}>
                        <Layers size={14} className="mr-1" /> {t("admin.novel.season")}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setStoryDialog({ open: true, story })} data-testid={`button-edit-story-${story.id}`}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: "story", id: story.id, name: story.title })} data-testid={`button-delete-story-${story.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SEASONS VIEW ── */}
        {view === "seasons" && selectedStory && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedStory.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.novel.manageSeasonsSubtitle")}</p>
              </div>
              <Button onClick={() => setSeasonDialog({ open: true })} data-testid="button-add-season">
                <Plus size={16} className="mr-1.5" /> {t("admin.novel.addSeason")}
              </Button>
            </div>

            {seasonsLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !seasons?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Layers size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">{t("admin.novel.empty.seasons")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {seasons.map(season => (
                  <div key={season.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors" data-testid={`card-season-${season.id}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{season.seasonNumber}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Season {season.seasonNumber}</p>
                      <p className="text-sm text-muted-foreground">{season.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedSeason(season); setView("chapters"); }} data-testid={`button-manage-chapters-${season.id}`}>
                        <FileText size={14} className="mr-1" /> {t("admin.novel.chapters")}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setSeasonDialog({ open: true, season })} data-testid={`button-edit-season-${season.id}`}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: "season", id: season.id, name: `Season ${season.seasonNumber}` })} data-testid={`button-delete-season-${season.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHAPTERS VIEW ── */}
        {view === "chapters" && selectedSeason && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Season {selectedSeason.seasonNumber} — {selectedSeason.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.novel.manageChaptersSubtitle")}</p>
              </div>
              <Button onClick={() => { setEditingChapter(undefined); setView("write"); }} data-testid="button-add-chapter">
                <Plus size={16} className="mr-1.5" /> {t("admin.novel.newChapter")}
              </Button>
            </div>

            {chaptersLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : !chapters?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FileText size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">{t("admin.novel.empty.chapters")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map(ch => {
                  const chScheduled = (ch as any).scheduledAt;
                  const isChScheduled = !ch.published && !!chScheduled && new Date(chScheduled) > new Date();
                  return (
                  <div key={ch.id} className="flex items-center gap-3 p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors" data-testid={`card-chapter-${ch.id}`}>
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{ch.chapterNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">{ch.title}</p>
                        {isChScheduled && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(chScheduled).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{(ch.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length} {t("admin.novel.form.words")}</span>
                        {(ch as any).viewCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Eye size={9} /> {((ch as any).viewCount).toLocaleString()} views
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleChapterPublish.mutate({ id: ch.id, published: !ch.published })}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${ch.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                        data-testid={`button-toggle-publish-${ch.id}`}
                        title={isChScheduled ? new Date(chScheduled).toLocaleString("id-ID") : undefined}
                      >
                        {ch.published ? <Eye size={12} /> : isChScheduled ? <Clock size={12} /> : <EyeOff size={12} />}
                      </button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingChapter(ch); setView("write"); }} data-testid={`button-edit-chapter-${ch.id}`}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: "chapter", id: ch.id, name: ch.title })} data-testid={`button-delete-chapter-${ch.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS VIEW ── */}
        {view === "settings" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Settings size={22} /> Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Kelola banner slideshow di halaman utama</p>
              </div>
              <Button onClick={() => setBannerDialog({ open: true })}>
                <Plus size={16} className="mr-1.5" /> Tambah Banner
              </Button>
            </div>

            {bannersLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !banners?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <ImageIcon size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">Belum ada banner. Tambah banner pertamamu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...(banners ?? [])].sort((a, b) => a.order - b.order).map((banner, idx, arr) => (
                  <div key={banner.id} className="flex items-center gap-3 p-3.5 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-24 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {banner.imageUrl
                        ? <img src={banner.imageUrl} alt={banner.title ?? "banner"} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-muted-foreground" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{banner.title || <span className="text-muted-foreground italic">Tanpa judul</span>}</p>
                      {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
                      {banner.link && <p className="text-xs text-blue-500 truncate">{banner.link}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {banner.active ? "Aktif" : "Nonaktif"}
                      </span>
                      <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => handleBannerMove(banner.id, "up")} title="Pindah ke atas">
                        <ChevronUp size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" disabled={idx === arr.length - 1} onClick={() => handleBannerMove(banner.id, "down")} title="Pindah ke bawah">
                        <ChevronDown size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setBannerDialog({ open: true, banner })}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: "banner", id: banner.id, name: banner.title ?? "Banner ini" })}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS VIEW ── */}
        {view === "announcements" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Bell size={22} /> Pengumuman
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Tampilkan pesan penting ke pengunjung</p>
              </div>
              <Button onClick={() => setAnnouncementDialog({ open: true })}>
                <Plus size={16} className="mr-1.5" /> Tambah
              </Button>
            </div>

            {!announcements?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Bell size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">Belum ada pengumuman. Buat yang pertama!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => {
                  const TYPE_ICON = { info: Info, warning: AlertTriangle, success: CheckCircle2 }[ann.type] ?? Info;
                  const TYPE_COLOR = { info: "text-blue-500", warning: "text-amber-500", success: "text-emerald-500" }[ann.type] ?? "text-blue-500";
                  const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
                  return (
                    <div key={ann.id} className="flex items-start gap-3 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                      <TYPE_ICON size={16} className={`${TYPE_COLOR} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium">{ann.message}</p>
                        {ann.link && <p className="text-xs text-blue-500 truncate mt-0.5">{ann.link}</p>}
                        {ann.expiresAt && (
                          <p className={`text-xs mt-0.5 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                            {isExpired ? "Sudah kedaluwarsa" : `Berakhir: ${new Date(ann.expiresAt).toLocaleDateString("id-ID")}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.active && !isExpired ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {ann.active && !isExpired ? "Aktif" : "Nonaktif"}
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => setAnnouncementDialog({ open: true, ann })}>
                          <Pencil size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: "announcement", id: ann.id, name: ann.message.slice(0, 40) })}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Banner Dialog ── */}
        <Dialog open={bannerDialog.open} onOpenChange={open => setBannerDialog({ open })}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{bannerDialog.banner ? "Edit Banner" : "Tambah Banner Baru"}</DialogTitle>
            </DialogHeader>
            <BannerForm
              initial={bannerDialog.banner}
              onSave={(data) => bannerDialog.banner
                ? updateBanner.mutate({ id: bannerDialog.banner.id, data })
                : createBanner.mutate(data)
              }
              onCancel={() => setBannerDialog({ open: false })}
            />
          </DialogContent>
        </Dialog>

        {/* ── Announcement Dialog ── */}
        <Dialog open={announcementDialog.open} onOpenChange={open => setAnnouncementDialog({ open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{announcementDialog.ann ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle>
            </DialogHeader>
            <AnnouncementForm
              initial={announcementDialog.ann}
              onSave={(data) => announcementDialog.ann
                ? updateAnnouncement.mutate({ id: announcementDialog.ann.id, data })
                : createAnnouncement.mutate(data)
              }
              onCancel={() => setAnnouncementDialog({ open: false })}
            />
          </DialogContent>
        </Dialog>

        {/* ── Story Dialog ── */}
        <Dialog open={storyDialog.open} onOpenChange={open => setStoryDialog({ open })}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{storyDialog.story ? t("admin.novel.dialog.editStory") : t("admin.novel.dialog.addStory")}</DialogTitle>
            </DialogHeader>
            <StoryForm
              initial={storyDialog.story}
              onSave={(data) => storyDialog.story
                ? updateStory.mutate({ id: storyDialog.story.id, data })
                : createStory.mutate(data)
              }
              onCancel={() => setStoryDialog({ open: false })}
            />
          </DialogContent>
        </Dialog>

        {/* ── Season Dialog ── */}
        <Dialog open={seasonDialog.open} onOpenChange={open => setSeasonDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{seasonDialog.season ? t("admin.novel.dialog.editSeason") : t("admin.novel.dialog.addSeason")}</DialogTitle>
            </DialogHeader>
            {selectedStory && (
              <SeasonForm
                storyId={selectedStory.id}
                initial={seasonDialog.season}
                onSave={(data) => seasonDialog.season
                  ? updateSeason.mutate({ id: seasonDialog.season.id, data })
                  : createSeason.mutate(data)
                }
                onCancel={() => setSeasonDialog({ open: false })}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm Dialog ── */}
        <Dialog open={!!deleteDialog?.open} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.novel.dialog.confirmDelete")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              {t("admin.novel.dialog.deleteConfirmMsg")} <strong className="text-foreground">"{deleteDialog?.name}"</strong>? {t("admin.confirm.undone")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)} data-testid="button-cancel-delete">{t("admin.novel.form.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete} data-testid="button-confirm-delete">{t("admin.confirm.delete")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
