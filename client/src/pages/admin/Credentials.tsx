import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Save, RefreshCw, Mail, Globe, Shield, ChevronRight, Loader2 } from "lucide-react";

interface ConfigField {
  value: string;
  configured: boolean;
  fromDb: boolean;
}

interface SiteConfig {
  googleClientId: ConfigField;
  googleClientSecret: ConfigField;
  gmailUser: ConfigField;
  gmailAppPassword: ConfigField;
  siteUrl: ConfigField;
}

type FieldKey = keyof SiteConfig;

const FIELD_META: Record<FieldKey, { label: string; hint: string; placeholder: string; secret: boolean; group: string }> = {
  siteUrl:            { label: "Site URL",             hint: "URL publik platform, misal: https://wooce-novel.replit.app", placeholder: "https://wooce-novel.replit.app", secret: false, group: "general" },
  gmailUser:          { label: "Gmail Address",        hint: "Alamat Gmail pengirim notifikasi email",                     placeholder: "yourmail@gmail.com",              secret: false, group: "email" },
  gmailAppPassword:   { label: "Gmail App Password",   hint: "App Password Gmail (bukan password biasa)",                  placeholder: "xxxx xxxx xxxx xxxx",             secret: true,  group: "email" },
  googleClientId:     { label: "Google Client ID",     hint: "Client ID dari Google Cloud Console untuk OAuth",            placeholder: "xxxxxx.apps.googleusercontent.com", secret: false, group: "oauth" },
  googleClientSecret: { label: "Google Client Secret", hint: "Client Secret Google OAuth",                                placeholder: "GOCSPX-xxxxxxxxxxxx",             secret: true,  group: "oauth" },
};

const GROUP_META = {
  general: { label: "Umum",        icon: Globe,  desc: "Konfigurasi dasar platform" },
  email:   { label: "Email",       icon: Mail,   desc: "Notifikasi & pengiriman email via Gmail" },
  oauth:   { label: "Google OAuth",icon: Shield, desc: "Login dengan Google untuk pembaca & penulis" },
};

function StatusBadge({ configured, fromDb }: { configured: boolean; fromDb: boolean }) {
  if (!configured) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
      <XCircle size={12} /> Belum diatur
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 size={12} /> {fromDb ? "Dari database" : "Dari environment"}
    </span>
  );
}

export default function Credentials() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [editing, setEditing] = useState<Partial<Record<FieldKey, string>>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Set<FieldKey>>(new Set());
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);

  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/admin/site-config"],
    enabled: unlocked,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Record<FieldKey, string>>) =>
      apiRequest("PUT", "/api/admin/site-config", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/site-config"] });
      setEditing({});
      toast({ title: "Tersimpan!", description: "Konfigurasi berhasil diperbarui." });
    },
    onError: (err: any) => {
      toast({ title: "Gagal menyimpan", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setPasswordError("");
    try {
      const res = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setUnlocked(true);
        setPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.message || "Password salah");
      }
    } catch {
      setPasswordError("Terjadi kesalahan jaringan");
    } finally {
      setVerifying(false);
    }
  }

  function handleEdit(key: FieldKey, value: string) {
    setEditing(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (Object.keys(editing).length === 0) return;
    saveMutation.mutate(editing);
  }

  function toggleSecret(key: FieldKey) {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleTestEmail(e: React.FormEvent) {
    e.preventDefault();
    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: testEmailTo }),
      });
      if (res.ok) {
        toast({ title: "Email terkirim!", description: `Test email dikirim ke ${testEmailTo}` });
        setTestEmailTo("");
      } else {
        const data = await res.json();
        toast({ title: "Gagal kirim", description: data.message || "Periksa konfigurasi Gmail.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal kirim", description: "Terjadi kesalahan jaringan.", variant: "destructive" });
    } finally {
      setTestingEmail(false);
    }
  }

  if (!unlocked) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock size={32} className="text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Halaman Terkunci</h1>
                <p className="text-sm text-muted-foreground mt-1">Masukkan password website untuk mengakses konfigurasi credentials</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Password website..."
                  className={`w-full px-4 py-3 pr-12 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${passwordError ? "border-destructive focus:ring-destructive" : "border-border"}`}
                  data-testid="input-credentials-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle size={12} /> {passwordError}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || !password}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                data-testid="button-unlock-credentials"
              >
                {verifying ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {verifying ? "Memverifikasi..." : "Buka Akses"}
              </button>
            </form>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const hasEdits = Object.keys(editing).length > 0;
  const groups = (["general", "email", "oauth"] as const);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound size={20} className="text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
            </div>
            <p className="text-sm text-muted-foreground">Kelola konfigurasi sistem — email, Google OAuth, dan URL platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["/api/admin/site-config"] })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-all"
              data-testid="button-refresh-config"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            {hasEdits && (
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                data-testid="button-save-config"
              >
                {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Simpan Perubahan
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(groupKey => {
              const group = GROUP_META[groupKey];
              const GroupIcon = group.icon;
              const fields = Object.entries(FIELD_META).filter(([, m]) => m.group === groupKey) as [FieldKey, typeof FIELD_META[FieldKey]][];

              return (
                <div key={groupKey} className="border border-border rounded-xl overflow-hidden bg-card">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GroupIcon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{group.label}</p>
                      <p className="text-xs text-muted-foreground">{group.desc}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {fields.map(([key, meta]) => {
                      const field = config?.[key];
                      const isEditing = key in editing;
                      const isSecret = meta.secret;
                      const showRaw = visibleSecrets.has(key);

                      return (
                        <div key={key} className="px-5 py-4 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium">{meta.label}</span>
                                {field && <StatusBadge configured={field.configured} fromDb={field.fromDb} />}
                              </div>
                              <p className="text-xs text-muted-foreground">{meta.hint}</p>
                            </div>
                            {!isEditing && (
                              <button
                                onClick={() => handleEdit(key, "")}
                                className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                                data-testid={`button-edit-${key}`}
                              >
                                Edit <ChevronRight size={12} />
                              </button>
                            )}
                          </div>

                          {!isEditing && field?.configured && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs font-mono text-muted-foreground truncate">
                                {isSecret && !showRaw ? field.value : field.value || "—"}
                              </div>
                              {isSecret && (
                                <button onClick={() => toggleSecret(key)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                                  {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              )}
                            </div>
                          )}

                          {isEditing && (
                            <div className="space-y-2">
                              <div className="relative">
                                <input
                                  type={isSecret && !showRaw ? "password" : "text"}
                                  value={editing[key] ?? ""}
                                  onChange={e => handleEdit(key, e.target.value)}
                                  placeholder={meta.placeholder}
                                  className="w-full px-3 py-2 pr-10 rounded-lg border border-primary bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                                  data-testid={`input-${key}`}
                                  autoFocus
                                />
                                {isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecret(key)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                  >
                                    {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditing(prev => { const n = { ...prev }; delete n[key]; return n; })}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Test Email</p>
                  <p className="text-xs text-muted-foreground">Kirim email percobaan untuk verifikasi konfigurasi Gmail</p>
                </div>
              </div>
              <div className="px-5 py-4">
                <form onSubmit={handleTestEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={e => setTestEmailTo(e.target.value)}
                    placeholder="Kirim ke email..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    data-testid="input-test-email"
                  />
                  <button
                    type="submit"
                    disabled={testingEmail || !testEmailTo || !config?.gmailUser?.configured}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all whitespace-nowrap"
                    data-testid="button-send-test-email"
                  >
                    {testingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    {testingEmail ? "Mengirim..." : "Kirim Test"}
                  </button>
                </form>
                {!config?.gmailUser?.configured && (
                  <p className="text-xs text-muted-foreground mt-2">Atur Gmail Address & App Password terlebih dahulu untuk mengaktifkan fitur ini.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Catatan penting</p>
              <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-disc list-inside">
                <li>Nilai yang diatur di sini <strong>lebih diutamakan</strong> dari environment variables.</li>
                <li>Perubahan Gmail & Site URL berlaku <strong>langsung</strong> tanpa restart.</li>
                <li>Perubahan Google OAuth berlaku <strong>langsung</strong> di session berjalan.</li>
                <li>Semua nilai sensitif disimpan terenkripsi di database.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
