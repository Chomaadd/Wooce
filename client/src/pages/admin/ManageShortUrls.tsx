import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Copy, Trash2, Link2, ExternalLink, Plus, MousePointerClick,
  RefreshCw, Clock, Infinity, Pencil, LogOut,
} from "lucide-react";

interface ShortUrl {
  id: string;
  slug: string;
  targetUrl: string;
  title: string | null;
  expiresAt: string | null;
  clicks: number;
  createdAt: string;
}

const BASE_URL = window.location.origin;

type ExpiryUnit = "permanent" | "seconds" | "minutes" | "hours" | "days" | "months";

const UNIT_MS: Record<Exclude<ExpiryUnit, "permanent">, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  months: 30 * 86_400_000,
};

const UNIT_LABELS: Record<ExpiryUnit, string> = {
  permanent: "Permanen ♾️",
  seconds: "Detik",
  minutes: "Menit",
  hours: "Jam",
  days: "Hari",
  months: "Bulan",
};

function computeExpiryMs(unit: ExpiryUnit, amount: number): number {
  if (unit === "permanent") return 0;
  return amount * UNIT_MS[unit];
}

function generateSlug() {
  return Math.random().toString(36).slice(2, 9);
}

function formatExpiry(expiresAt: string | null): { label: string; isExpired: boolean; isNearExpiry: boolean } {
  if (!expiresAt) return { label: "Permanen", isExpired: false, isNearExpiry: false };
  const exp = new Date(expiresAt);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();

  if (diffMs < 0) return { label: "Kedaluwarsa", isExpired: true, isNearExpiry: false };

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffSec < 60) return { label: `${diffSec} detik`, isExpired: false, isNearExpiry: true };
  if (diffMin < 60) return { label: `${diffMin} menit`, isExpired: false, isNearExpiry: diffMin < 10 };
  if (diffHrs < 24) return { label: `${diffHrs} jam`, isExpired: false, isNearExpiry: diffHrs <= 2 };
  if (diffDays <= 3) return { label: `${diffDays} hari lagi`, isExpired: false, isNearExpiry: true };
  return {
    label: exp.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    isExpired: false,
    isNearExpiry: false,
  };
}

function UrlCard({
  url, onCopy, onDelete, isDeleting,
}: {
  url: ShortUrl;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editTargetUrl, setEditTargetUrl] = useState(url.targetUrl);
  const [editTitle, setEditTitle] = useState(url.title || "");
  const [editExpiryMode, setEditExpiryMode] = useState<"keep" | ExpiryUnit>("keep");
  const [editExpiryAmount, setEditExpiryAmount] = useState(7);

  const editMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, any> = {
        targetUrl: editTargetUrl,
        title: editTitle,
      };
      if (editExpiryMode !== "keep") {
        body.expiryMs = computeExpiryMs(editExpiryMode as ExpiryUnit, editExpiryAmount);
      }
      return apiRequest("PATCH", `/api/short-urls/${url.id}`, body).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/short-urls"] });
      setEditing(false);
      toast({ title: "URL berhasil diperbarui" });
    },
    onError: () => {
      toast({ title: "Gagal memperbarui URL", variant: "destructive" });
    },
  });

  const shortLink = `${BASE_URL}/${url.slug}`;
  const expiry = formatExpiry(url.expiresAt);
  const expired = url.expiresAt && new Date(url.expiresAt) <= new Date();

  return (
    <div
      data-testid={`card-short-url-${url.id}`}
      className={`bg-card border rounded-2xl px-4 py-4 transition-all ${
        expired ? "border-border/50 opacity-60" : "border-border"
      }`}
    >
      {!editing ? (
        <>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {url.title && (
                <p className="font-medium text-sm truncate">{url.title}</p>
              )}
              <button
                type="button"
                className="font-mono text-primary text-sm hover:underline truncate max-w-full text-left"
                data-testid={`text-short-url-slug-${url.id}`}
                onClick={() => onCopy(shortLink)}
              >
                {shortLink}
              </button>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{url.targetUrl}</p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost" size="icon"
                data-testid={`button-copy-${url.id}`}
                onClick={() => onCopy(shortLink)}
                title="Salin link"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                data-testid={`button-open-${url.id}`}
                onClick={() => window.open(shortLink, "_blank")}
                title="Buka link"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                data-testid={`button-edit-short-url-${url.id}`}
                onClick={() => {
                  setEditTargetUrl(url.targetUrl);
                  setEditTitle(url.title || "");
                  setEditExpiryMode("keep");
                  setEditExpiryAmount(7);
                  setEditing(true);
                }}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                data-testid={`button-delete-short-url-${url.id}`}
                onClick={() => onDelete(url.id)}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <div className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
              expiry.isExpired
                ? "bg-destructive/10 text-destructive"
                : expiry.isNearExpiry
                ? "bg-orange-500/10 text-orange-500"
                : "bg-muted/60 text-muted-foreground"
            }`}>
              {url.expiresAt ? <Clock className="w-3 h-3" /> : <Infinity className="w-3 h-3" />}
              <span data-testid={`text-expiry-${url.id}`}>{expiry.label}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              <MousePointerClick className="w-3 h-3" />
              <span data-testid={`text-clicks-${url.id}`}>{url.clicks} klik</span>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Edit URL</p>
            <span className="font-mono text-xs text-muted-foreground">{BASE_URL}/{url.slug}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL Tujuan</Label>
            <Input
              type="url"
              value={editTargetUrl}
              onChange={e => setEditTargetUrl(e.target.value)}
              data-testid={`input-edit-target-url-${url.id}`}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label (opsional)</Label>
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Contoh: Link Portfolio"
              data-testid={`input-edit-title-${url.id}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Masa Berlaku</Label>
            <div className="flex gap-2">
              {editExpiryMode !== "keep" && editExpiryMode !== "permanent" && (
                <Input
                  type="number"
                  min={1}
                  value={editExpiryAmount}
                  onChange={e => setEditExpiryAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 shrink-0"
                  data-testid={`input-edit-expiry-amount-${url.id}`}
                />
              )}
              <Select value={editExpiryMode} onValueChange={v => setEditExpiryMode(v as "keep" | ExpiryUnit)}>
                <SelectTrigger data-testid={`select-edit-expiry-${url.id}`} className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Jangan ubah masa berlaku</SelectItem>
                  <SelectItem value="permanent">Ubah ke Permanen ♾️</SelectItem>
                  {(["seconds", "minutes", "hours", "days", "months"] as Exclude<ExpiryUnit, "permanent">[]).map(u => (
                    <SelectItem key={u} value={u}>Setel ulang — hitung dari sekarang (dalam {UNIT_LABELS[u]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending || !editTargetUrl}
              data-testid={`button-save-edit-${url.id}`}
              className="flex-1"
            >
              {editMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              data-testid={`button-cancel-edit-${url.id}`}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlSection({
  title, emptyLabel, urls, onCopy, onDelete, isDeleting,
}: {
  title: string;
  emptyLabel: string;
  urls: ShortUrl[];
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-base flex items-center gap-2">
        {title}
        {urls.length > 0 && (
          <span className="text-muted-foreground font-normal text-sm">({urls.length})</span>
        )}
      </h2>

      {urls.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl py-10 text-center">
          <Link2 className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urls.map(url => (
            <UrlCard
              key={url.id}
              url={url}
              onCopy={onCopy}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageShortUrls() {
  const { toast } = useToast();
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/admin-verify", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.ok) setAdminVerified(true); else { setAdminVerified(false); window.location.href = "/login"; } })
      .catch(() => { setAdminVerified(false); window.location.href = "/login"; });
  }, []);

  const [targetUrl, setTargetUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(generateSlug());
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [expiryUnit, setExpiryUnit] = useState<ExpiryUnit>("permanent");
  const [expiryAmount, setExpiryAmount] = useState(7);

  const expiryMs = computeExpiryMs(expiryUnit, expiryAmount);

  function expiryPreviewLabel(): string {
    if (expiryUnit === "permanent") return "Permanen (tidak pernah kedaluwarsa)";
    return `${expiryAmount} ${UNIT_LABELS[expiryUnit]}`;
  }

  const { data: urls = [], isLoading } = useQuery<ShortUrl[]>({
    queryKey: ["/api/short-urls"],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/short-urls", {
        targetUrl,
        title: title || undefined,
        slug,
        expiryMs,
      }).then(r => r.json()),
    onSuccess: (created: ShortUrl) => {
      queryClient.invalidateQueries({ queryKey: ["/api/short-urls"] });
      const savedSlug = created.slug;
      setTargetUrl("");
      setTitle("");
      setSlug(generateSlug());
      setIsCustomSlug(false);
      setExpiryUnit("permanent");
      setExpiryAmount(7);
      toast({ title: "URL pendek berhasil dibuat!", description: `${BASE_URL}/${savedSlug}` });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Slug sudah dipakai.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/short-urls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/short-urls"] });
      toast({ title: "URL berhasil dihapus" });
    },
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Tersalin!", description: text });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUrl || slug.length < 4) return;
    createMutation.mutate();
  }

  const activeUrls = urls.filter(u => !u.expiresAt || new Date(u.expiresAt) > new Date());
  const expiredUrls = urls.filter(u => u.expiresAt && new Date(u.expiresAt) <= new Date());

  if (adminVerified === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/image/icon-navbar.png" alt="WOOCE Novel" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-sm text-foreground">Admin URL Pendek</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/novel">
              <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted">
                ← Dashboard
              </button>
            </Link>
            <Link href="/">
              <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted" data-testid="button-view-site">
                <ExternalLink size={13} />
                Lihat Situs
              </button>
            </Link>
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">URL Pendek</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Buat tautan pendek seperti{" "}
            <span className="font-mono text-primary">{BASE_URL}/xuwkajs</span>{" "}
            yang redirect ke URL manapun.
          </p>
        </div>

        {/* Form Buat URL */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Buat URL Pendek Baru</h2>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">URL Tujuan</Label>
            <Input
              id="targetUrl"
              data-testid="input-target-url"
              type="url"
              placeholder="https://contoh.com/halaman-yang-panjang-sekali"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Label (opsional)</Label>
              <Input
                id="title"
                data-testid="input-short-url-title"
                placeholder="Contoh: Link Portfolio"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kedaluwarsa</Label>
              <div className="flex gap-2">
                {expiryUnit !== "permanent" && (
                  <Input
                    data-testid="input-expiry-amount"
                    type="number"
                    min={1}
                    value={expiryAmount}
                    onChange={e => setExpiryAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 shrink-0"
                  />
                )}
                <Select value={expiryUnit} onValueChange={v => setExpiryUnit(v as ExpiryUnit)}>
                  <SelectTrigger data-testid="select-expiry-unit" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UNIT_LABELS) as ExpiryUnit[]).map(u => (
                      <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">Slug (akhiran URL)</Label>
              {!isCustomSlug && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  onClick={() => setIsCustomSlug(true)}
                >
                  Edit manual
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{BASE_URL}/</span>
              <Input
                id="slug"
                data-testid="input-slug"
                value={slug}
                onChange={e => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                  setIsCustomSlug(true);
                }}
                className="font-mono"
                maxLength={12}
              />
              {!isCustomSlug && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid="button-regenerate-slug"
                  onClick={() => setSlug(generateSlug())}
                  title="Acak slug baru"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Hanya huruf kecil dan angka, minimal 4 karakter, maksimal 12 karakter.
            </p>
          </div>

          {targetUrl && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-muted-foreground">Pratinjau:</span>
                <span className="font-mono text-primary">{BASE_URL}/{slug}</span>
                <span className="text-muted-foreground">→</span>
                <span className="truncate text-xs">{targetUrl}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                {expiryUnit === "permanent"
                  ? <><Infinity className="w-3 h-3" /> Permanen (tidak pernah kedaluwarsa)</>
                  : <><Clock className="w-3 h-3" /> Aktif selama {expiryPreviewLabel()}</>
                }
              </div>
            </div>
          )}

          <Button
            type="submit"
            data-testid="button-create-short-url"
            disabled={createMutation.isPending || !targetUrl || slug.length < 4}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Membuat..." : "Buat URL Pendek"}
          </Button>
        </form>

        {/* Daftar URL */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <UrlSection
              title="URL Aktif"
              emptyLabel="Belum ada URL pendek. Buat yang pertama di atas!"
              urls={activeUrls}
              onCopy={copyToClipboard}
              onDelete={id => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
            {expiredUrls.length > 0 && (
              <UrlSection
                title="URL Kedaluwarsa"
                emptyLabel="Tidak ada URL kedaluwarsa."
                urls={expiredUrls}
                onCopy={copyToClipboard}
                onDelete={id => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
