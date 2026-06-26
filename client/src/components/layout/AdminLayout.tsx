import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, FileText, Music, Image, Mail, LogOut, Loader2, Menu, X, ScrollText, BarChart2, Link2, BookOpen, Settings, Scissors, KeyRound, Download, Upload, CheckCircle2, AlertCircle, FileJson } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { CredentialsModal } from "@/components/admin/CredentialsModal";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAdminWs } from "@/hooks/use-admin-ws";

interface ImportResult {
  ok: boolean; total: number; inserted: number; updated: number; skipped: number; errors: number;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading, logout } = useAuth();

  useAdminWs(!!user && (user as any).role === "admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportBlog() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/export/blog", { credentials: "include" });
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blog-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export gagal, coba lagi.");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleImportBlog() {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("mode", importMode);
      const res = await fetch("/api/admin/import/blog", { method: "POST", credentials: "include", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import gagal");
      setImportResult(data);
    } catch (err: any) {
      alert(err.message || "Import gagal. Periksa format file JSON.");
    } finally {
      setImportLoading(false);
    }
  }

  function resetImport() {
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const { data: siteSettings } = useSiteSettings();
  const { t, language, setLanguage } = useLanguage();

  const { data: configStatus } = useQuery<{ oauthConfigured: boolean; gmailConfigured: boolean }>({
    queryKey: ["/api/admin/config-status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 60_000,
    enabled: !isLoading && !!user,
  });
  const oauthActive = configStatus?.oauthConfigured ?? false;
  const gmailActive = configStatus?.gmailConfigured ?? false;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const links = [
    { href: "/admin",            label: t("admin.nav.dashboard"),  icon: LayoutDashboard },
    { href: "/admin/analytics",  label: t("admin.nav.analytics"),  icon: BarChart2 },
    { href: "/admin/blog",       label: t("admin.nav.blog"),       icon: FileText },
    { href: "/admin/brand",      label: t("admin.nav.brand"),      icon: Image },
    { href: "/admin/music",      label: t("admin.nav.music"),      icon: Music },
    { href: "/admin/resume",     label: t("admin.nav.resume"),     icon: ScrollText },
    { href: "/admin/links",      label: t("admin.nav.links"),      icon: Link2 },
    { href: "/admin/messages",   label: t("admin.nav.messages"),   icon: Mail },
    { href: "/admin/novel",      label: t("admin.nav.novel"),      icon: BookOpen },
    { href: "/admin/short-urls", label: t("admin.nav.short_urls"), icon: Scissors },
    { href: "/admin/settings",   label: t("admin.nav.settings"),   icon: Settings },
  ];

  const currentPage = links.find(l => l.href === location)?.label || t("admin.nav.dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 border-r border-border bg-card z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-bold shrink-0 overflow-hidden">
              {siteSettings?.adminAvatarUrl ? (
                <img src={siteSettings.adminAvatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <img src="/favicon-white.ico" alt="Logo" className="w-7 h-7 object-contain" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-bold tracking-tight truncate">{user.name}</h2>
              <p className="text-xs text-muted-foreground tracking-wide uppercase">{t("admin.panel")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("admin.navigation")}</p>
          {links.map((link) => {
            const Icon = link.icon;
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-md group ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={18} className={active ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="flex-1">{link.label}</span>
                {'badge' in link && (link as { badge?: number }).badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                    {(link as { badge?: number }).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200"
          >
            <LogOut size={18} />
            <span>{t("admin.signout")}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b border-border flex items-center gap-2 px-3 md:px-8 bg-card/80 backdrop-blur-sm shrink-0 sticky top-0 z-30 overflow-hidden">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden shrink-0 p-1.5 hover:bg-accent rounded-md transition-colors"
              data-testid="button-toggle-sidebar"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-muted-foreground shrink-0 hidden sm:inline">Admin</span>
              <span className="text-muted-foreground shrink-0 hidden sm:inline">/</span>
              <span className="font-semibold truncate">{currentPage}</span>
            </div>
          </div>

          {/* Right: actions — Export/Import Blog hidden on mobile to prevent overflow */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleExportBlog}
              disabled={exportLoading}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1.5 rounded-md border border-border transition-all disabled:opacity-50"
              data-testid="button-export-blog"
              title="Export semua artikel blog ke file JSON"
            >
              {exportLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span className="hidden md:inline">Export Blog</span>
            </button>
            <button
              onClick={() => { setImportOpen(true); resetImport(); }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1.5 rounded-md border border-border transition-all"
              data-testid="button-open-import"
              title="Import artikel blog dari file JSON"
            >
              <Upload size={13} />
              <span className="hidden md:inline">Import Blog</span>
            </button>
            <button
              onClick={() => setCredentialsOpen(true)}
              className="relative hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1.5 rounded-md border border-border transition-all"
              data-testid="button-open-credentials"
              title={
                configStatus === undefined ? "Memuat status..." :
                oauthActive && gmailActive ? "Semua kredensial aktif ✓" :
                oauthActive || gmailActive ? "Sebagian kredensial belum diatur" :
                "Kredensial belum dikonfigurasi"
              }
            >
              <KeyRound size={13} />
              <span className="hidden md:inline">Kredensial</span>
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card transition-colors ${
                  configStatus === undefined
                    ? "bg-muted-foreground/30"
                    : oauthActive && gmailActive
                      ? "bg-emerald-500"
                      : oauthActive || gmailActive
                        ? "bg-amber-400"
                        : "bg-destructive"
                }`}
              />
            </button>
            <button
              onClick={() => setLanguage(language === "en" ? "id" : "en")}
              className="text-xs font-bold px-2 py-1 rounded-md border border-border bg-background hover:bg-accent transition-colors uppercase tracking-wider"
              data-testid="button-toggle-language-admin"
            >
              {language === "en" ? "ID" : "EN"}
            </button>
            <Link
              href="/"
              className="hidden sm:flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider px-1"
              data-testid="link-view-site"
            >
              {t("admin.view_site")}
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {credentialsOpen && <CredentialsModal onClose={() => setCredentialsOpen(false)} />}

      {/* Import Blog Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => { if (!importLoading) { setImportOpen(false); resetImport(); } }} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-primary" />
                <h2 className="font-semibold text-sm">Import Artikel Blog</h2>
              </div>
              {!importLoading && (
                <button onClick={() => { setImportOpen(false); resetImport(); }} className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground">
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {!importResult ? (
                <>
                  {/* Mode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode Import</label>
                    <div className="flex gap-2">
                      {(["skip", "overwrite"] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setImportMode(m)}
                          className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${importMode === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                        >
                          {m === "skip" ? "Lewati yang ada" : "Timpa yang ada"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {importMode === "skip" ? "Artikel yang slug-nya sudah ada di database tidak akan diubah." : "Artikel yang slug-nya sudah ada akan diperbarui seluruhnya."}
                    </p>
                  </div>

                  {/* File picker */}
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-import-blog"
                  >
                    <FileJson size={24} className="text-muted-foreground" />
                    {importFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">Klik untuk pilih file <span className="text-primary font-semibold">.json</span><br/>hasil export blog</p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                    data-testid="input-file-import-blog"
                  />

                  <button
                    onClick={handleImportBlog}
                    disabled={!importFile || importLoading}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    data-testid="button-import-submit"
                  >
                    {importLoading ? <><Loader2 size={14} className="animate-spin" /> Mengimpor...</> : <><Upload size={14} /> Mulai Import</>}
                  </button>
                </>
              ) : (
                /* Result */
                <div className="space-y-4">
                  <div className={`rounded-xl p-4 border space-y-3 ${importResult.errors > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"}`}>
                    <div className="flex items-center gap-2">
                      {importResult.errors > 0
                        ? <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
                        : <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                      }
                      <span className="text-sm font-semibold text-foreground">Import selesai — {importResult.total} artikel diproses</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-background/60 rounded-lg px-3 py-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{importResult.inserted}</span>
                        <p className="text-muted-foreground">artikel baru</p>
                      </div>
                      <div className="bg-background/60 rounded-lg px-3 py-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-base">{importResult.updated}</span>
                        <p className="text-muted-foreground">diperbarui</p>
                      </div>
                      <div className="bg-background/60 rounded-lg px-3 py-2">
                        <span className="text-zinc-500 font-bold text-base">{importResult.skipped}</span>
                        <p className="text-muted-foreground">dilewati</p>
                      </div>
                      <div className="bg-background/60 rounded-lg px-3 py-2">
                        <span className="text-red-500 font-bold text-base">{importResult.errors}</span>
                        <p className="text-muted-foreground">error</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetImport} className="flex-1 py-2 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground">
                      Import Lagi
                    </button>
                    <button onClick={() => { setImportOpen(false); resetImport(); }} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all">
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
