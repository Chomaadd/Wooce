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
  Info, AlertTriangle, CheckCircle2, User, UserCheck, UserX, ShieldCheck, KeyRound, BadgeCheck, Flag, AlertCircle,
  Coins, Lock, LockOpen, Search, PlusCircle, Mail, Inbox, Trash,
} from "lucide-react";
import { CredentialsModal } from "@/components/admin/CredentialsModal";
import Cropper from "react-easy-crop";
import type { NovelStory, NovelSeason, NovelChapter, BannerSlide, Announcement, Author, User as AppUserType } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

type View = "stories" | "seasons" | "chapters" | "write" | "settings" | "stats" | "announcements" | "approvals" | "reports" | "coins" | "messages";
type AppUser = AppUserType;

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

function deleteOrphanUpload(url: string) {
  if (!url || !url.startsWith("/uploads/")) return;
  fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: "DELETE", credentials: "include" }).catch(() => {});
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

  const originalImageRef = useRef(initial?.imageUrl ?? "");
  const pendingImageRef  = useRef<string | null>(null);
  const isSavedRef       = useRef(false);

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && pendingImageRef.current) {
        deleteOrphanUpload(pendingImageRef.current);
      }
    };
  }, []);

  const handleImageChange = (newUrl: string) => {
    if (pendingImageRef.current && newUrl !== pendingImageRef.current) {
      deleteOrphanUpload(pendingImageRef.current);
    }
    pendingImageRef.current =
      newUrl.startsWith("/uploads/") && newUrl !== originalImageRef.current ? newUrl : null;
    setForm(f => ({ ...f, imageUrl: newUrl }));
  };

  const handleCancel = () => {
    if (pendingImageRef.current) deleteOrphanUpload(pendingImageRef.current);
    pendingImageRef.current = null;
    onCancel();
  };

  const handleSave = () => {
    isSavedRef.current     = true;
    pendingImageRef.current = null;
    const orig = originalImageRef.current;
    if (orig && orig.startsWith("/uploads/") && orig !== form.imageUrl) {
      deleteOrphanUpload(orig);
    }
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Gambar Banner *</label>
        <BannerUploadCrop value={form.imageUrl} onChange={handleImageChange} />
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
        <Button variant="outline" onClick={handleCancel}>Batal</Button>
        <Button onClick={handleSave} disabled={!form.imageUrl}>Simpan Banner</Button>
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
    donationUrl: (initial as any)?.donationUrl ?? "",
    authorId: (initial as any)?.authorId ?? "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const parsedTags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

  const originalCoverRef = useRef(initial?.coverUrl ?? "");
  const pendingCoverRef  = useRef<string | null>(null);
  const isSavedRef       = useRef(false);

  // Cleanup: if form unmounts without saving, delete the orphan upload
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && pendingCoverRef.current) {
        deleteOrphanUpload(pendingCoverRef.current);
      }
    };
  }, []);

  const handleCoverChange = (newUrl: string) => {
    // If user uploaded a cover before in this session (not yet saved), delete it now
    if (pendingCoverRef.current && newUrl !== pendingCoverRef.current) {
      deleteOrphanUpload(pendingCoverRef.current);
    }
    pendingCoverRef.current =
      newUrl.startsWith("/uploads/") && newUrl !== originalCoverRef.current ? newUrl : null;
    set("coverUrl", newUrl);
  };

  const handleCancel = () => {
    if (pendingCoverRef.current) deleteOrphanUpload(pendingCoverRef.current);
    pendingCoverRef.current = null;
    onCancel();
  };

  const handleSave = () => {
    isSavedRef.current    = true;
    pendingCoverRef.current = null;
    // If original cover was replaced with a new upload, delete the original
    const orig = originalCoverRef.current;
    if (orig && orig.startsWith("/uploads/") && orig !== form.coverUrl) {
      deleteOrphanUpload(orig);
    }
    onSave({ ...form, tags: parsedTags, donationUrl: form.donationUrl || null, authorId: form.authorId || null });
  };

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
        <CoverUploadCrop value={form.coverUrl} onChange={handleCoverChange} />
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
      <div>
        <label className="text-sm font-medium mb-1 block">Link Donasi <span className="text-muted-foreground font-normal text-xs">(opsional)</span></label>
        <Input
          value={form.donationUrl}
          onChange={e => set("donationUrl", e.target.value)}
          placeholder="https://saweria.co/username atau https://trakteer.id/username"
          data-testid="input-story-donation-url"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Penulis <span className="text-muted-foreground font-normal text-xs">(opsional)</span></label>
        <StoryAuthorSelect value={form.authorId} onChange={v => set("authorId", v)} />
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
        <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-story">{t("admin.novel.form.cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.title || !form.slug} data-testid="button-save-story">{t("admin.novel.form.save")}</Button>
      </DialogFooter>
    </div>
  );
}

function StoryAuthorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: authors } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
    queryFn: () => fetch("/api/authors").then(r => r.json()),
  });
  return (
    <Select value={value || "__none__"} onValueChange={v => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger data-testid="select-story-author"><SelectValue placeholder="Pilih penulis..." /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— Tidak ada —</SelectItem>
        {(authors ?? []).map(a => (
          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AuthorForm({ initial, onSave, onCancel }: {
  initial?: Partial<Author>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    bio: initial?.bio ?? "",
    photoUrl: initial?.photoUrl ?? "",
    tiktok: initial?.tiktok ?? "",
    instagram: initial?.instagram ?? "",
    facebook: initial?.facebook ?? "",
    twitter: initial?.twitter ?? "",
    website: initial?.website ?? "",
    saweria: initial?.saweria ?? "",
    trakteer: initial?.trakteer ?? "",
    email: initial?.email ?? "",
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Nama Penulis *</label>
          <Input value={form.name} onChange={e => { set("name", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }} placeholder="Nama penulis" data-testid="input-author-name" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Slug *</label>
          <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="nama-penulis" data-testid="input-author-slug" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Bio</label>
        <Textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={2} placeholder="Deskripsi singkat penulis..." data-testid="input-author-bio" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Foto URL</label>
        <Input value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} placeholder="https://..." data-testid="input-author-photo" />
      </div>
      <div className="border border-border rounded-xl p-3 space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground">Sosial Media</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { k: "tiktok", label: "TikTok", ph: "@username" },
            { k: "instagram", label: "Instagram", ph: "@username" },
            { k: "facebook", label: "Facebook", ph: "username / URL" },
            { k: "twitter", label: "Twitter / X", ph: "@username" },
            { k: "website", label: "Website", ph: "https://..." },
            { k: "email", label: "Email", ph: "email@..." },
          ].map(({ k, label, ph }) => (
            <div key={k}>
              <label className="text-xs mb-1 block">{label}</label>
              <Input className="h-8 text-xs" value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={ph} data-testid={`input-author-${k}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="border border-border rounded-xl p-3 space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground">Link Donasi</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs mb-1 block">Saweria (username)</label>
            <Input className="h-8 text-xs" value={form.saweria} onChange={e => set("saweria", e.target.value)} placeholder="username" data-testid="input-author-saweria" />
          </div>
          <div>
            <label className="text-xs mb-1 block">Trakteer (username)</label>
            <Input className="h-8 text-xs" value={form.trakteer} onChange={e => set("trakteer", e.target.value)} placeholder="username" data-testid="input-author-trakteer" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button
          disabled={!form.name || !form.slug}
          onClick={() => onSave({
            name: form.name, slug: form.slug,
            bio: form.bio || null, photoUrl: form.photoUrl || null,
            tiktok: form.tiktok || null, instagram: form.instagram || null,
            facebook: form.facebook || null, twitter: form.twitter || null,
            website: form.website || null, email: form.email || null,
            saweria: form.saweria || null, trakteer: form.trakteer || null,
          })}
          data-testid="button-save-author"
        >
          Simpan Penulis
        </Button>
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

      {/* Premium Chapter Setting — only for existing chapters */}
      {chapter && (
        <PremiumChapterToggle chapterId={chapter.id} />
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

function PremiumChapterToggle({ chapterId }: { chapterId: string }) {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery<{ isPremium: boolean; coinPrice: number | null }>({
    queryKey: ["/api/admin/chapters", chapterId, "premium"],
    queryFn: () => fetch(`/api/admin/chapters/${chapterId}/premium`, { credentials: "include" }).then(r => r.json()),
  });
  const [priceInput, setPriceInput] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (data) {
      setEnabled(data.isPremium);
      setPriceInput(data.coinPrice ? String(data.coinPrice) : "");
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (coinPrice: number | null) =>
      apiRequest("PATCH", `/api/admin/chapters/${chapterId}/premium`, { coinPrice }),
    onSuccess: () => { toast({ title: "Pengaturan premium disimpan" }); refetch(); },
    onError: () => toast({ title: "Gagal simpan", variant: "destructive" }),
  });

  const handleSavePremium = () => {
    if (!enabled) { saveMut.mutate(null); return; }
    const price = parseInt(priceInput);
    if (isNaN(price) || price < 1) { toast({ title: "Harga harus angka >= 1", variant: "destructive" }); return; }
    saveMut.mutate(price);
  };

  if (isLoading) return null;

  return (
    <div className={`border rounded-xl p-4 space-y-3 transition-colors ${enabled ? "border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? <Lock size={15} className="text-amber-500" /> : <LockOpen size={15} className="text-muted-foreground" />}
          <span className="text-sm font-medium">{enabled ? "Chapter Premium" : "Chapter Gratis"}</span>
          {enabled && data?.coinPrice && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
              <Coins size={10} /> {data.coinPrice} koin
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-amber-500" : "bg-muted-foreground/30"}`}
          data-testid="toggle-chapter-premium"
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "left-5.5" : "left-0.5"}`} />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Harga (koin) *</label>
            <Input
              type="number"
              min={1}
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              placeholder="Contoh: 5"
              className="h-8 text-sm"
              data-testid="input-chapter-coin-price"
            />
          </div>
          <div className="pt-5">
            <Button size="sm" onClick={handleSavePremium} disabled={saveMut.isPending} data-testid="button-save-premium">
              {saveMut.isPending ? "Simpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      )}
      {!enabled && data?.isPremium && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSavePremium} disabled={saveMut.isPending} data-testid="button-remove-premium">
            {saveMut.isPending ? "Hapus..." : "Hapus Premium"}
          </Button>
        </div>
      )}
    </div>
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
  const [, navigate] = useLocation();
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/admin-verify", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setAdminVerified(true);
        else { setAdminVerified(false); window.location.href = "/login"; }
      })
      .catch(() => { setAdminVerified(false); window.location.href = "/login"; });
  }, []);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [view, setView] = useState<View>("stories");
  const [selectedStory, setSelectedStory] = useState<NovelStory | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<NovelSeason | null>(null);
  const [editingChapter, setEditingChapter] = useState<NovelChapter | undefined>(undefined);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // ── Story search & filter state ────────────────────────────────────────────
  const [storySearch, setStorySearch] = useState("");
  const [storyFilterCategory, setStoryFilterCategory] = useState<string>("all");
  const [storyFilterStatus, setStoryFilterStatus] = useState<string>("all");
  const [storyFilterPublished, setStoryFilterPublished] = useState<string>("all");

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
    enabled: adminVerified === true,
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/all"],
    queryFn: () => fetch("/api/announcements/all", { credentials: "include" }).then(r => r.json()),
    enabled: adminVerified === true,
  });

  const { data: banners, isLoading: bannersLoading } = useQuery<BannerSlide[]>({
    queryKey: ["/api/banners/all"],
    queryFn: () => fetch("/api/banners/all", { credentials: "include" }).then(r => r.json()),
    enabled: adminVerified === true,
  });

  const { data: stories, isLoading: storiesLoading } = useQuery<NovelStory[]>({
    queryKey: ["/api/novel/stories/all"],
    enabled: adminVerified === true,
  });

  // ── Filtered stories (client-side, instant) ────────────────────────────────
  const filteredStories = (stories ?? []).filter(story => {
    const q = storySearch.toLowerCase().trim();
    if (q) {
      const matchTitle  = story.title.toLowerCase().includes(q);
      const matchAuthor = ((story as any).authorName ?? "").toLowerCase().includes(q);
      const matchGenre  = story.category.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchGenre) return false;
    }
    if (storyFilterCategory !== "all" && story.category !== storyFilterCategory) return false;
    if (storyFilterStatus   !== "all" && story.status   !== storyFilterStatus)   return false;
    if (storyFilterPublished === "published" && !story.published)  return false;
    if (storyFilterPublished === "draft"     && story.published)   return false;
    return true;
  });
  const hasActiveFilter = storySearch || storyFilterCategory !== "all" || storyFilterStatus !== "all" || storyFilterPublished !== "all";

  const { data: seasons, isLoading: seasonsLoading } = useQuery<NovelSeason[]>({
    queryKey: ["/api/novel/stories", selectedStory?.id, "seasons"],
    queryFn: () => fetch(`/api/novel/stories/${selectedStory!.id}/seasons`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedStory?.id && adminVerified === true,
  });

  const { data: chapters, isLoading: chaptersLoading } = useQuery<NovelChapter[]>({
    queryKey: ["/api/novel/seasons", selectedSeason?.id, "chapters"],
    queryFn: async () => {
      const r = await fetch(`/api/novel/seasons/${selectedSeason!.id}/chapters/all`, { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!selectedSeason?.id && adminVerified === true,
    retry: false,
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

  const downloadChaptersPdf = async (chapterIds?: string[]) => {
    if (!selectedStory) return;
    setPdfDownloading(true);
    try {
      const res = await fetch(`/api/admin/stories/${selectedStory.id}/chapters-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterIds: chapterIds ?? [] }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Gagal download PDF", description: (err as any).message ?? "Coba lagi.", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const label = chapterIds && chapterIds.length > 0 ? `${chapterIds.length}-chapter` : "semua";
      a.download = `${selectedStory.slug ?? "novel"}-${label}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSelectedChapterIds(new Set());
      toast({ title: "PDF berhasil didownload!" });
    } catch {
      toast({ title: "Gagal download PDF", description: "Coba lagi.", variant: "destructive" });
    } finally {
      setPdfDownloading(false);
    }
  };

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

  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", target: "all" });
  const broadcastNotification = useMutation({
    mutationFn: (data: { title: string; message: string; target: string }) =>
      apiRequest("POST", "/api/admin/broadcast-notification", data),
    onSuccess: (res: any) => {
      res.json().then((data: any) => {
        toast({ title: `Notifikasi terkirim ke ${data.sent ?? 0} pengguna!` });
      }).catch(() => toast({ title: "Notifikasi berhasil dikirim!" }));
      setBroadcastForm({ title: "", message: "", target: "all" });
    },
    onError: () => toast({ title: "Gagal mengirim notifikasi", variant: "destructive" }),
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

  if (adminVerified !== true) {
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
          <img src="/image/icon-navbar.png" alt="WOOCE Novel" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-sm text-foreground">Admin Novel</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted" data-testid="button-view-site">
              <ExternalLink size={13} />
              Lihat Situs
            </button>
          </Link>
          <button
            onClick={() => setCredentialsOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
            data-testid="button-credentials"
          >
            <KeyRound size={13} />
            Kredensial
          </button>
          <button
            onClick={async () => {
              await fetch("/api/auth/admin-logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-full hover:bg-destructive/10"
            data-testid="button-logout"
          >
            <LogOut size={13} />
            Logout
          </button>
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
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          {/* Tab Nav — scrollable on mobile */}
        <div className="overflow-x-auto mb-5 -mx-1 px-1">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-max min-w-full sm:w-fit">
          <button
            onClick={() => { setView("stories"); setSelectedStory(null); setSelectedSeason(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view !== "settings" && view !== "stats" && view !== "announcements" && (view as View) !== "approvals" && (view as View) !== "reports" && (view as View) !== "coins" && (view as View) !== "messages" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Cerita
          </button>
          <button
            onClick={() => setView("stats")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view === "stats" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart2 size={13} /> Statistik
          </button>
          <button
            onClick={() => setView("settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view === "settings" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Settings size={13} /> Settings
          </button>
          <button
            onClick={() => setView("announcements")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view === "announcements" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bell size={13} /> Pengumuman
          </button>
          <button
            onClick={() => setView("approvals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${(view as View) === "approvals" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShieldCheck size={13} /> Approval
          </button>
          <button
            onClick={() => setView("reports")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${(view as View) === "reports" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Flag size={13} /> Laporan
          </button>
          <button
            onClick={() => setView("coins")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${(view as View) === "coins" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-coins"
          >
            <Coins size={13} /> Koin
          </button>
          <button
            onClick={() => setView("messages")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${(view as View) === "messages" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-messages"
          >
            <Mail size={13} /> Pesan
          </button>
          </div>
        </div>

      {view !== "approvals" && view !== "reports" && view !== "coins" && view !== "messages" && <>

        {/* Breadcrumb Nav */}
        {view !== "settings" && view !== "stats" && view !== "announcements" && (view as View) !== "approvals" && (
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
            <div className="flex items-center justify-between mb-4">
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

            {/* ── Search & Filter Bar ── */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari judul, penulis, atau genre..."
                  value={storySearch}
                  onChange={e => setStorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-story-search"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={storyFilterCategory}
                  onChange={e => setStoryFilterCategory(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  data-testid="select-filter-category"
                >
                  <option value="all">Semua Genre</option>
                  <option value="novel">Novel</option>
                  <option value="komik">Komik</option>
                  <option value="cerpen">Cerpen</option>
                </select>
                <select
                  value={storyFilterStatus}
                  onChange={e => setStoryFilterStatus(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  data-testid="select-filter-status"
                >
                  <option value="all">Semua Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
                <select
                  value={storyFilterPublished}
                  onChange={e => setStoryFilterPublished(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  data-testid="select-filter-published"
                >
                  <option value="all">Publis & Draft</option>
                  <option value="published">Publis saja</option>
                  <option value="draft">Draft saja</option>
                </select>
                {hasActiveFilter && (
                  <button
                    onClick={() => { setStorySearch(""); setStoryFilterCategory("all"); setStoryFilterStatus("all"); setStoryFilterPublished("all"); }}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors border border-border"
                    data-testid="button-clear-story-filter"
                  >
                    <X size={12} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Result count when filtering */}
            {hasActiveFilter && !storiesLoading && (
              <p className="text-xs text-muted-foreground mb-3">
                Menampilkan <span className="font-semibold text-foreground">{filteredStories.length}</span> dari {stories?.length ?? 0} cerita
              </p>
            )}

            {storiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : !stories?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <BookOpen size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">{t("admin.novel.empty.stories")}</p>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-border rounded-xl">
                <Search size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">Tidak ada cerita yang cocok dengan filter.</p>
                <button
                  onClick={() => { setStorySearch(""); setStoryFilterCategory("all"); setStoryFilterStatus("all"); setStoryFilterPublished("all"); }}
                  className="mt-3 text-xs text-primary hover:underline"
                >Reset filter</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStories.map(story => (
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
                        {(story as any).authorName && (
                          <>
                            <span>·</span>
                            <span className="text-primary/80 font-medium truncate max-w-[120px]">✍ {(story as any).authorName}</span>
                          </>
                        )}
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
            <div className="flex items-center justify-between mb-4">
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
            ) : !chapters || (chapters as any).message || !Array.isArray(chapters) ? (
              <div className="text-center py-16 border border-dashed border-destructive/30 rounded-xl">
                <FileText size={36} className="mx-auto mb-3 text-destructive/40" />
                <p className="text-muted-foreground">Gagal memuat bab — sesi mungkin berakhir.</p>
                <button onClick={() => window.location.href = "/login"} className="mt-3 text-sm text-primary hover:underline">Login ulang</button>
              </div>
            ) : !chapters.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FileText size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">{t("admin.novel.empty.chapters")}</p>
              </div>
            ) : (
              <>
                {/* Download toolbar */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted/40 border border-border rounded-xl">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                    checked={selectedChapterIds.size === (chapters as any[]).length && (chapters as any[]).length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedChapterIds(new Set((chapters as any[]).map((c: any) => c.id)));
                      else setSelectedChapterIds(new Set());
                    }}
                    title="Pilih semua"
                    data-testid="checkbox-select-all-chapters"
                  />
                  <span className="text-xs text-muted-foreground flex-1">
                    {selectedChapterIds.size > 0 ? `${selectedChapterIds.size} bab dipilih` : "Pilih bab untuk download PDF"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pdfDownloading || selectedChapterIds.size === 0}
                    onClick={() => downloadChaptersPdf(Array.from(selectedChapterIds))}
                    data-testid="button-download-selected-pdf"
                  >
                    {pdfDownloading ? <span className="mr-1 animate-spin">↻</span> : <FileText size={13} className="mr-1" />}
                    Download Dipilih
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pdfDownloading}
                    onClick={() => downloadChaptersPdf([])}
                    data-testid="button-download-all-pdf"
                  >
                    {pdfDownloading ? <span className="mr-1 animate-spin">↻</span> : <FileText size={13} className="mr-1" />}
                    Download Semua
                  </Button>
                </div>

                <div className="space-y-2">
                  {(chapters as any[]).map((ch: any) => {
                    const chScheduled = ch.scheduledAt;
                    const isChScheduled = !ch.published && !!chScheduled && new Date(chScheduled) > new Date();
                    return (
                    <div key={ch.id} className={`flex items-center gap-3 p-3.5 border rounded-xl hover:bg-muted/30 transition-colors ${selectedChapterIds.has(ch.id) ? "border-primary/50 bg-primary/5" : "border-border"}`} data-testid={`card-chapter-${ch.id}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-primary cursor-pointer flex-shrink-0"
                        checked={selectedChapterIds.has(ch.id)}
                        onChange={(e) => {
                          const next = new Set(selectedChapterIds);
                          if (e.target.checked) next.add(ch.id);
                          else next.delete(ch.id);
                          setSelectedChapterIds(next);
                        }}
                        data-testid={`checkbox-chapter-${ch.id}`}
                      />
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                          {ch.viewCount > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Eye size={9} /> {ch.viewCount.toLocaleString()} views
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
              </>
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

            {/* ── Broadcast Notification ── */}
            <div className="mb-8 p-5 rounded-2xl border border-border bg-card/60">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Kirim Notifikasi ke Pengguna</h2>
                  <p className="text-xs text-muted-foreground">Notifikasi akan muncul di lonceng notifikasi akun pengguna</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Judul notifikasi</label>
                    <Input
                      value={broadcastForm.title}
                      onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Pembaruan WOOCE Novel..."
                      data-testid="input-broadcast-title"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Kirim ke</label>
                    <Select
                      value={broadcastForm.target}
                      onValueChange={v => setBroadcastForm(f => ({ ...f, target: v }))}
                    >
                      <SelectTrigger data-testid="select-broadcast-target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua pengguna</SelectItem>
                        <SelectItem value="writers">Penulis saja</SelectItem>
                        <SelectItem value="readers">Pembaca saja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Isi pesan</label>
                  <Textarea
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tulis pesan notifikasi di sini..."
                    rows={3}
                    data-testid="input-broadcast-message"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    disabled={!broadcastForm.title.trim() || !broadcastForm.message.trim() || broadcastNotification.isPending}
                    onClick={() => broadcastNotification.mutate(broadcastForm)}
                    data-testid="button-send-broadcast"
                  >
                    {broadcastNotification.isPending ? (
                      <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" /> Mengirim...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Bell size={14} /> Kirim Notifikasi</span>
                    )}
                  </Button>
                </div>
              </div>
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

      </>}

      {view === "approvals" && <ApprovalsView />}
      {(view as View) === "reports" && <ReportsView />}
      {(view as View) === "coins" && <CoinAdminView />}
      {(view as View) === "messages" && <MessagesView />}

      </div>

      {credentialsOpen && <CredentialsModal onClose={() => setCredentialsOpen(false)} />}
    </div>
  );
}

// ── CoinAdminView ──────────────────────────────────────────────────────────────
function CoinAdminView() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [topupUserId, setTopupUserId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");

  const { data: users, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/coins/users"],
    queryFn: () => fetch("/api/admin/coins/users", { credentials: "include" }).then(r => r.json()),
  });

  const topupMut = useMutation({
    mutationFn: (body: { userId: string; amount: number; note?: string }) =>
      apiRequest("POST", "/api/admin/coins/topup", body),
    onSuccess: () => {
      toast({ title: "Top-up berhasil!" });
      setTopupUserId(null);
      setTopupAmount("");
      setTopupNote("");
      refetch();
    },
    onError: () => toast({ title: "Gagal top-up", variant: "destructive" }),
  });

  const handleTopup = () => {
    if (!topupUserId) return;
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount < 1) { toast({ title: "Jumlah harus angka >= 1", variant: "destructive" }); return; }
    topupMut.mutate({ userId: topupUserId, amount, note: topupNote || undefined });
  };

  const filtered = (users ?? []).filter((u: any) =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Coins size={22} className="text-amber-500" /> Manajemen Koin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Top-up koin manual ke reader dan lihat riwayat saldo.</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari user..."
          className="pl-8 h-9 text-sm"
          data-testid="input-search-coin-users"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Coins size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Belum ada user terdaftar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                {(u.username ?? u.email ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{u.username ?? u.email}</div>
                {u.email && u.username && <div className="text-xs text-muted-foreground truncate">{u.email}</div>}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400 mr-2">
                <Coins size={14} className="text-amber-500" />
                {u.coins ?? 0}
              </div>
              {topupUserId === u.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)}
                    placeholder="Jumlah"
                    className="h-8 w-20 text-sm"
                    data-testid="input-topup-amount"
                  />
                  <Input
                    value={topupNote}
                    onChange={e => setTopupNote(e.target.value)}
                    placeholder="Catatan (opsional)"
                    className="h-8 w-32 text-sm hidden sm:block"
                    data-testid="input-topup-note"
                  />
                  <Button size="sm" onClick={handleTopup} disabled={topupMut.isPending} data-testid="button-confirm-topup">
                    {topupMut.isPending ? "..." : "Top-up"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTopupUserId(null)} data-testid="button-cancel-topup">
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setTopupUserId(u.id); setTopupAmount(""); setTopupNote(""); }}
                  className="text-xs gap-1"
                  data-testid={`button-topup-${u.id}`}
                >
                  <PlusCircle size={12} /> Top-up
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VerifCard ─────────────────────────────────────────────────────────────────
function VerifCard({ u, onVerify, onReject, verifyPending, rejectPending }: {
  u: any;
  onVerify: () => void;
  onReject: () => void;
  verifyPending: boolean;
  rejectPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const vr = u.verificationRequest;
  const ap = u.authorProfile;
  const initials = (u.name || "?").charAt(0).toUpperCase();
  const socialLinks = [
    { key: "tiktok", label: "TikTok", val: ap?.tiktok },
    { key: "instagram", label: "Instagram", val: ap?.instagram },
    { key: "facebook", label: "Facebook", val: ap?.facebook },
    { key: "twitter", label: "Twitter/X", val: ap?.twitter },
    { key: "website", label: "Website", val: ap?.website },
    { key: "email", label: "Email Publik", val: ap?.email },
  ].filter(s => s.val);
  const donationLinks = [
    { key: "saweria", label: "Saweria", val: ap?.saweria },
    { key: "trakteer", label: "Trakteer", val: ap?.trakteer },
  ].filter(d => d.val);

  return (
    <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl overflow-hidden">
      {/* Summary row */}
      <div className="flex items-center gap-3 p-4">
        {ap?.photoUrl
          ? <img src={ap.photoUrl} alt={ap.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-500/20" />
          : <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm ring-2 ring-blue-500/20">{initials}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground">{ap?.name || u.name}</p>
            {ap?.slug && <span className="text-xs text-muted-foreground">@{ap.slug}</span>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          {vr?.novelTitle && (
            <p className="text-xs text-blue-600 mt-0.5 font-medium truncate">📖 {vr.novelTitle}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          data-testid={`button-expand-verif-${u.id}`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Tutup" : "Detail"}
        </button>
      </div>

      {/* Detail panel */}
      {expanded && (
        <div className="border-t border-blue-500/15 px-4 pb-4 pt-3 space-y-4">
          {/* Author Profile */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <User size={11} /> Profil Penulis
            </p>
            {ap?.bio ? (
              <p className="text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-lg p-3 mb-2">{ap.bio}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic mb-2">Belum ada bio.</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {socialLinks.map(s => (
                  <a
                    key={s.key}
                    href={s.val!.startsWith("http") ? s.val! : `https://${s.val}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs text-foreground/70 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                  >
                    <ExternalLink size={10} /> {s.label}
                  </a>
                ))}
              </div>
            )}
            {donationLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {donationLinks.map(d => (
                  <a
                    key={d.key}
                    href={d.val!.startsWith("http") ? d.val! : `https://${d.val}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                  >
                    <ExternalLink size={10} /> {d.label}
                  </a>
                ))}
              </div>
            )}
            {socialLinks.length === 0 && donationLinks.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Tidak ada link sosial media / donasi.</p>
            )}
          </div>

          {/* Novel / Verification Form Data */}
          {vr ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen size={11} /> Data Novel yang Diajukan
              </p>
              <div className="bg-muted/40 rounded-xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Judul Novel</p>
                    <p className="text-sm font-medium text-foreground">{vr.novelTitle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Genre</p>
                    <p className="text-sm font-medium text-foreground">{vr.novelGenre}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Total Chapter</p>
                    <p className="text-sm font-medium text-foreground">{vr.totalChapters} chapter</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Link Novel</p>
                    {vr.novelLink ? (
                      <a
                        href={vr.novelLink.startsWith("http") ? vr.novelLink : `https://${vr.novelLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <ExternalLink size={10} /> Buka Link
                      </a>
                    ) : <p className="text-xs text-muted-foreground">—</p>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Sinopsis</p>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{vr.synopsis}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Alasan Mengajukan Verifikasi</p>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{vr.reason}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Data formulir verifikasi tidak ditemukan.</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onVerify}
              disabled={verifyPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-xs font-semibold disabled:opacity-50"
              data-testid={`button-verify-${u.id}`}
            >
              <BadgeCheck size={13} /> Berikan Verifikasi
            </button>
            <button
              onClick={onReject}
              disabled={rejectPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
              data-testid={`button-reject-verification-${u.id}`}
            >
              <UserX size={13} /> Tolak Verifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ApprovalsView ─────────────────────────────────────────────────────────────
function ApprovalsView() {
  const { toast } = useToast();

  const { data: pendingUsers, isLoading, refetch } = useQuery<AppUser[]>({
    queryKey: ["/api/admin/users", "writer", "pending"],
    queryFn: () => fetch("/api/admin/users?role=writer&status=pending", { credentials: "include" }).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: activeWriters, refetch: refetchActive } = useQuery<AppUser[]>({
    queryKey: ["/api/admin/users", "writer", "active"],
    queryFn: () => fetch("/api/admin/users?role=writer&status=active", { credentials: "include" }).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: pendingVerifications, refetch: refetchVerif } = useQuery<AppUser[]>({
    queryKey: ["/api/admin/users/pending-verification"],
    queryFn: () => fetch("/api/admin/users/pending-verification", { credentials: "include" }).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: suspendedWriters, refetch: refetchSuspended } = useQuery<AppUser[]>({
    queryKey: ["/api/admin/users", "writer", "suspended"],
    queryFn: () => fetch("/api/admin/users?role=writer&status=suspended", { credentials: "include" }).then(r => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/approve`),
    onSuccess: () => {
      refetch();
      refetchActive();
      toast({ title: "Penulis disetujui!" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/verify`),
    onSuccess: () => {
      refetchVerif();
      refetchActive();
      toast({ title: "Penulis berhasil diverifikasi!" });
    },
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/reject-verification`),
    onSuccess: () => {
      refetchVerif();
      refetchActive();
      toast({ title: "Verifikasi ditolak." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/reject`),
    onSuccess: () => {
      refetch();
      refetchActive();
      toast({ title: "Permohonan ditolak." });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/suspend`),
    onSuccess: () => {
      refetch();
      refetchActive();
      refetchSuspended();
      toast({ title: "Akun disuspend." });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/unsuspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetchSuspended();
      refetchActive();
      toast({ title: "Akun berhasil dipulihkan!", description: "Penulis sudah bisa mengakses platform kembali." });
    },
    onError: () => {
      toast({ title: "Gagal memulihkan akun.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}/delete`),
    onSuccess: () => {
      refetch();
      refetchActive();
      toast({ title: "Akun berhasil dihapus permanen.", variant: "destructive" });
    },
    onError: () => {
      toast({ title: "Gagal menghapus akun.", variant: "destructive" });
    },
  });

  function handleDeleteUser(user: AppUser) {
    const isWriter = user.role === "writer";
    const msg = isWriter
      ? `Hapus PERMANEN akun penulis "${user.name}"?\n\nSemua cerita akan dihapus dan penulis akan menerima email beserta PDF backup karya mereka.\n\nTindakan ini TIDAK BISA dibatalkan!`
      : `Hapus PERMANEN akun "${user.name}"?\n\nTindakan ini TIDAK BISA dibatalkan!`;
    if (window.confirm(msg)) {
      deleteUserMutation.mutate(user.id);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={22} /> Approval Penulis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tinjau dan kelola permohonan bergabung sebagai penulis</p>
        </div>
        <button
          onClick={() => { refetch(); refetchActive(); refetchVerif(); refetchSuspended(); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border shrink-0 mt-1"
          data-testid="button-refresh-approvals"
        >
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {/* Pending */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock size={14} className="text-yellow-500" /> Menunggu Persetujuan
          {!!pendingUsers?.length && (
            <span className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
          )}
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : !pendingUsers?.length ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Tidak ada permohonan yang menunggu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                {u.photoUrl
                  ? <img src={u.photoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">{u.name.charAt(0).toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(u.id)}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    data-testid={`button-approve-${u.id}`}
                  >
                    <UserCheck size={13} /> Setujui
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(u.id)}
                    disabled={rejectMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    data-testid={`button-reject-${u.id}`}
                  >
                    <UserX size={13} /> Tolak
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={deleteUserMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    title="Hapus permanen"
                    data-testid={`button-delete-user-${u.id}`}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Writers */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <UserCheck size={14} className="text-green-500" /> Penulis Aktif
          {!!activeWriters?.length && (
            <span className="bg-green-500/10 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">{activeWriters.length}</span>
          )}
        </h2>
        {!activeWriters?.length ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">Belum ada penulis aktif</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeWriters.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors">
                {u.photoUrl
                  ? <img src={u.photoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">{u.name.charAt(0).toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground">{u.name}</p>
                    {(u as any).verificationStatus === "verified" && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => suspendMutation.mutate(u.id)}
                    disabled={suspendMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors text-xs font-semibold disabled:opacity-50"
                    data-testid={`button-suspend-${u.id}`}
                  >
                    <UserX size={13} /> Suspend
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={deleteUserMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    title="Hapus permanen"
                    data-testid={`button-delete-user-${u.id}`}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suspended Writers */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <UserX size={14} className="text-red-500" /> Penulis Tersuspend
          {!!suspendedWriters?.length && (
            <span className="bg-red-500/10 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{suspendedWriters.length}</span>
          )}
        </h2>
        {!suspendedWriters?.length ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">Tidak ada penulis yang tersuspend</p>
          </div>
        ) : (
          <div className="space-y-2">
            {suspendedWriters.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                {u.photoUrl
                  ? <img src={u.photoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 opacity-60" />
                  : <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500 font-bold text-sm opacity-60">{u.name.charAt(0).toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{u.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 uppercase tracking-wide">Suspended</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => unsuspendMutation.mutate(u.id)}
                    disabled={unsuspendMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    data-testid={`button-unsuspend-${u.id}`}
                  >
                    <UserCheck size={13} /> Pulihkan
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={deleteUserMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-semibold disabled:opacity-50"
                    title="Hapus permanen"
                    data-testid={`button-delete-suspended-${u.id}`}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Requests */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <BadgeCheck size={14} className="text-blue-500" /> Pengajuan Verifikasi
          {!!pendingVerifications?.length && (
            <span className="bg-blue-500/10 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingVerifications.length}</span>
          )}
        </h2>
        {!pendingVerifications?.length ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <BadgeCheck size={28} className="mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Tidak ada pengajuan verifikasi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingVerifications.map((u: any) => (
              <VerifCard
                key={u.id}
                u={u}
                onVerify={() => verifyMutation.mutate(u.id)}
                onReject={() => rejectVerificationMutation.mutate(u.id)}
                verifyPending={verifyMutation.isPending}
                rejectPending={rejectVerificationMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MessagesView ───────────────────────────────────────────────────────────────
function MessagesView() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<any | null>(null);

  const { data: messages = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/contact-messages"],
    queryFn: () => fetch("/api/admin/contact-messages", { credentials: "include" }).then(r => r.json()),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/contact-messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/contact-messages/${id}`),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
      toast({ title: "Pesan dihapus" });
    },
  });

  const unreadCount = messages.filter((m: any) => !m.read).length;

  function openMessage(msg: any) {
    setSelected(msg);
    if (!msg.read) markReadMutation.mutate(msg.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Inbox size={14} className="text-primary" /> Pesan Masuk
          {unreadCount > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} belum dibaca</span>
          )}
        </h2>
        <button onClick={() => refetch()} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Mail size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Belum ada pesan masuk</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-5 gap-4">
          <div className="sm:col-span-2 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {messages.map((msg: any) => (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${selected?.id === msg.id ? "border-primary/50 bg-primary/5" : !msg.read ? "border-primary/20 bg-primary/5 hover:border-primary/40" : "border-border bg-muted/20 hover:bg-muted/40"}`}
                data-testid={`button-msg-${msg.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm font-semibold truncate ${!msg.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {!msg.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 align-middle" />}
                    {msg.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
              </button>
            ))}
          </div>

          <div className="sm:col-span-3">
            {selected ? (
              <div className="border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{selected.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dari: <span className="font-medium text-foreground">{selected.name}</span>
                      {" · "}
                      <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(selected.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                      data-testid="button-reply-message"
                    >
                      <Mail size={12} /> Balas
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(selected.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      data-testid="button-delete-message"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-xl h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Pilih pesan untuk membaca</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReportsView ────────────────────────────────────────────────────────────────
function ReportsView() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);

  const { data: reports = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/reports"],
    queryFn: () => fetch("/api/admin/reports").then(r => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/reports/${id}/approve`),
    onSuccess: () => {
      refetch();
      setConfirmApprove(null);
      toast({ title: "✓ Laporan disetujui — cerita dihapus & email terkirim ke penulis" });
    },
    onError: () => toast({ title: "Gagal menyetujui laporan", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/reports/${id}/reject`),
    onSuccess: () => { refetch(); toast({ title: "Laporan ditolak" }); },
    onError: () => toast({ title: "Gagal menolak laporan", variant: "destructive" }),
  });

  const reasonLabels: Record<string, string> = {
    plagiarism:    "Plagiarisme",
    adult_content: "Konten Dewasa Tanpa Label",
    hate_speech:   "Ujaran Kebencian / Diskriminasi",
    violence:      "Kekerasan Ekstrem",
    spam:          "Spam / Konten Tidak Relevan",
    other:         "Lainnya",
  };

  const pendingCount = reports.filter((r: any) => r.status === "pending").length;
  const filtered = reports.filter((r: any) => statusFilter === "all" || r.status === statusFilter);

  return (
    <div className="space-y-6">
      <Dialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={18} /> Setujui Laporan & Hapus Cerita?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Tindakan ini akan:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />Menghapus cerita secara permanen dari platform</li>
              <li className="flex items-start gap-2"><AlertCircle size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />Mengirim email + PDF backup seluruh chapter ke penulis</li>
              <li className="flex items-start gap-2"><AlertCircle size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />Memberi notifikasi in-app ke akun penulis</li>
            </ul>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">Tindakan ini <strong>tidak bisa dibatalkan</strong>.</p>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setConfirmApprove(null)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              Batal
            </button>
            <button
              onClick={() => confirmApprove && approveMutation.mutate(confirmApprove)}
              disabled={approveMutation.isPending}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {approveMutation.isPending ? "Memproses..." : "Ya, Hapus Cerita"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Flag size={22} /> Laporan Konten</h1>
        <p className="text-sm text-muted-foreground mt-1">Tinjau laporan dari pembaca untuk konten yang melanggar ketentuan platform</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {f === "pending" ? "Menunggu" : f === "all" ? "Semua" : f === "approved" ? "Disetujui" : "Ditolak"}
            {f === "pending" && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Flag size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">{statusFilter === "pending" ? "Tidak ada laporan yang menunggu" : "Tidak ada laporan"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report: any) => (
            <div key={report.id} className={`border rounded-xl p-4 ${report.status === "pending" ? "border-orange-500/30 bg-orange-500/5" : report.status === "approved" ? "border-green-500/20 bg-green-500/5" : "border-border bg-muted/20"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`/${report.storySlug}`} target="_blank" rel="noreferrer" className="font-semibold text-sm text-foreground hover:text-primary flex items-center gap-1 transition-colors">
                      {report.storyTitle}<ExternalLink size={11} />
                    </a>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${report.status === "pending" ? "bg-orange-500/15 text-orange-600" : report.status === "approved" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {report.status === "pending" ? "Menunggu" : report.status === "approved" ? "Disetujui" : "Ditolak"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span>Pelapor: <span className="text-foreground font-medium">{report.reporterName}</span></span>
                    <span>·</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{reasonLabels[report.reason] ?? report.reason}</span>
                    <span>·</span>
                    <span>{new Date(report.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  {report.details && (
                    <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 leading-relaxed italic">"{report.details}"</p>
                  )}
                </div>
                {report.status === "pending" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => rejectMutation.mutate(report.id)} disabled={rejectMutation.isPending} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-semibold transition-colors disabled:opacity-50" data-testid={`button-reject-report-${report.id}`}>
                      Tolak
                    </button>
                    <button onClick={() => setConfirmApprove(report.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-semibold transition-colors" data-testid={`button-approve-report-${report.id}`}>
                      Setujui & Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
