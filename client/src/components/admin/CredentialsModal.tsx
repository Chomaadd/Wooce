import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Lock, KeyRound, Eye, EyeOff, CheckCircle2, XCircle,
  Save, RefreshCw, Mail, Globe, Shield, ChevronRight,
  Loader2, ShieldCheck, X, Copy, Check, ExternalLink, CreditCard,
} from "lucide-react";
import { useState as useLocalState } from "react";

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
  midtransServerKey: ConfigField;
  midtransClientKey: ConfigField;
  midtransIsProduction: ConfigField;
}

type FieldKey = keyof SiteConfig;

const FIELD_META: Record<FieldKey, { label: string; hint: string; placeholder: string; secret: boolean; group: string }> = {
  siteUrl:              { label: "Site URL",             hint: "URL publik platform, misal: https://wooce-novel.replit.app",              placeholder: "https://wooce-novel.replit.app",     secret: false, group: "general" },
  gmailUser:            { label: "Gmail Address",        hint: "Alamat Gmail pengirim notifikasi email",                                  placeholder: "yourmail@gmail.com",                 secret: false, group: "email" },
  gmailAppPassword:     { label: "Gmail App Password",   hint: "App Password Gmail (bukan password biasa)",                               placeholder: "xxxx xxxx xxxx xxxx",                secret: true,  group: "email" },
  googleClientId:       { label: "Google Client ID",     hint: "Client ID dari Google Cloud Console untuk OAuth",                         placeholder: "xxxxxx.apps.googleusercontent.com",  secret: false, group: "oauth" },
  googleClientSecret:   { label: "Google Client Secret", hint: "Client Secret Google OAuth",                                              placeholder: "GOCSPX-xxxxxxxxxxxx",                secret: true,  group: "oauth" },
  midtransServerKey:    { label: "Midtrans Server Key",  hint: "Server Key dari Midtrans (SB-Mid-server-... untuk sandbox)",              placeholder: "SB-Mid-server-xxxxxxxxxxxx",          secret: true,  group: "payment" },
  midtransClientKey:    { label: "Midtrans Client Key",  hint: "Client Key dari Midtrans (SB-Mid-client-... untuk sandbox)",              placeholder: "SB-Mid-client-xxxxxxxxxxxx",          secret: true,  group: "payment" },
  midtransIsProduction: { label: "Mode Produksi",        hint: "Isi 'true' untuk mode produksi, kosongkan atau isi 'false' untuk sandbox", placeholder: "false",                              secret: false, group: "payment" },
};

const GROUP_META = {
  general: { label: "Umum",         icon: Globe,       desc: "Konfigurasi dasar platform" },
  email:   { label: "Email",        icon: Mail,        desc: "Notifikasi & pengiriman email via Gmail" },
  oauth:   { label: "Google OAuth", icon: Shield,      desc: "Login dengan Google untuk pembaca & penulis" },
  payment: { label: "Midtrans",     icon: CreditCard,  desc: "Payment gateway untuk pembelian koin (GoPay, QRIS, Transfer Bank)" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useLocalState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Salin"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

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

export function CredentialsModal({ onClose }: { onClose: () => void }) {
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
      qc.invalidateQueries({ queryKey: ["/api/admin/config-status"] });
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
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Email terkirim!", description: `Test email berhasil dikirim ke ${testEmailTo}` });
        setTestEmailTo("");
      } else {
        toast({ title: "Gagal kirim email", description: data.message || "Periksa konfigurasi Gmail.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal kirim email", description: "Terjadi kesalahan jaringan.", variant: "destructive" });
    } finally {
      setTestingEmail(false);
    }
  }

  const hasEdits = Object.keys(editing).length > 0;
  const groups = (["general", "email", "oauth", "payment"] as const);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Credentials</h2>
              <p className="text-xs text-muted-foreground">Konfigurasi sistem platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unlocked && hasEdits && (
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                data-testid="button-save-config"
              >
                {saveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Simpan
              </button>
            )}
            {unlocked && (
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ["/api/admin/site-config"] })}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                title="Refresh"
                data-testid="button-refresh-config"
              >
                <RefreshCw size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              data-testid="button-close-credentials"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!unlocked ? (
          <div className="px-8 py-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-inner">
                <Lock size={26} className="text-primary" />
              </div>
              <h3 className="text-base font-bold">Verifikasi Sandi Kredensial</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Masukkan <strong>Sandi Kredensial</strong> — beda dengan sandi login admin
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sandi Kredensial
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                    placeholder="Masukkan sandi kredensial..."
                    className={`w-full px-4 py-3 pr-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-all ${
                      passwordError
                        ? "border-destructive focus:ring-destructive/30"
                        : "border-border focus:ring-primary/30 focus:border-primary"
                    }`}
                    data-testid="input-credentials-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <XCircle size={12} /> {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifying || !password}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                data-testid="button-unlock-credentials"
              >
                {verifying
                  ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
                  : <><ShieldCheck size={16} /> Buka Akses</>
                }
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {groups.map(groupKey => {
                  const group = GROUP_META[groupKey];
                  const GroupIcon = group.icon;
                  const fields = Object.entries(FIELD_META).filter(([, m]) => m.group === groupKey) as [FieldKey, typeof FIELD_META[FieldKey]][];

                  const callbackUrl = typeof window !== "undefined"
                    ? `${window.location.origin}/auth/google/callback`
                    : "/auth/google/callback";

                  return (
                    <div key={groupKey} className="border border-border rounded-xl overflow-hidden bg-background">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <GroupIcon size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{group.label}</p>
                          <p className="text-[11px] text-muted-foreground">{group.desc}</p>
                        </div>
                      </div>

                      {groupKey === "payment" && (
                        <div className="px-4 py-3 border-b border-border bg-amber-50 dark:bg-amber-950/20 space-y-2.5">
                          <div className="flex items-start gap-2">
                            <CreditCard size={13} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                Cara mendapatkan API Key Midtrans
                              </p>
                              <ol className="text-[11px] text-amber-700 dark:text-amber-500 space-y-0.5 list-decimal list-inside">
                                <li>Buka <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">dashboard.midtrans.com <ExternalLink size={10} /></a></li>
                                <li>Pilih environment <strong>Sandbox</strong> (testing) atau <strong>Production</strong></li>
                                <li>Buka menu <strong>Settings → Access Keys</strong></li>
                                <li>Salin <strong>Server Key</strong> dan <strong>Client Key</strong></li>
                                <li>Daftarkan Notification URL di <strong>Settings → Payment → Payment Notification URL</strong></li>
                              </ol>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                              Notification URL (salin & tempel ke Midtrans Dashboard):
                            </p>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                              <code className="flex-1 text-[11px] font-mono text-amber-800 dark:text-amber-300 truncate select-all">
                                {typeof window !== "undefined" ? `${window.location.origin}/api/payment/topup/notification` : "/api/payment/topup/notification"}
                              </code>
                              <CopyButton text={typeof window !== "undefined" ? `${window.location.origin}/api/payment/topup/notification` : "/api/payment/topup/notification"} />
                            </div>
                          </div>
                        </div>
                      )}

                      {groupKey === "oauth" && (
                        <div className="px-4 py-3 border-b border-border bg-blue-50 dark:bg-blue-950/20 space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Shield size={13} className="text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                Cara mengaktifkan Google Login
                              </p>
                              <ol className="text-[11px] text-blue-600 dark:text-blue-500 space-y-0.5 list-decimal list-inside">
                                <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink size={10} /></a></li>
                                <li>Buat project baru atau pilih yang sudah ada</li>
                                <li>Pilih <strong>Create Credentials → OAuth Client ID</strong></li>
                                <li>Pilih tipe <strong>Web Application</strong></li>
                                <li>Tambahkan URL di bawah ke <strong>Authorized redirect URIs</strong></li>
                              </ol>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
                              Callback URL (salin & tempel ke Google Cloud Console):
                            </p>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                              <code className="flex-1 text-[11px] font-mono text-blue-800 dark:text-blue-300 truncate select-all">
                                {callbackUrl}
                              </code>
                              <CopyButton text={callbackUrl} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="divide-y divide-border">
                        {fields.map(([key, meta]) => {
                          const field = config?.[key];
                          const isEditing = key in editing;
                          const isSecret = meta.secret;
                          const showRaw = visibleSecrets.has(key);

                          return (
                            <div key={key} className="px-4 py-3 space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium">{meta.label}</span>
                                    {field && <StatusBadge configured={field.configured} fromDb={field.fromDb} />}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{meta.hint}</p>
                                </div>
                                {!isEditing && (
                                  <button
                                    onClick={() => handleEdit(key, "")}
                                    className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                                    data-testid={`button-edit-${key}`}
                                  >
                                    Edit <ChevronRight size={11} />
                                  </button>
                                )}
                              </div>

                              {!isEditing && field?.configured && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs font-mono text-muted-foreground truncate">
                                    {isSecret && !showRaw ? field.value : field.value || "—"}
                                  </div>
                                  {isSecret && (
                                    <button onClick={() => toggleSecret(key)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                                      {showRaw ? <EyeOff size={13} /> : <Eye size={13} />}
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
                                      className="w-full px-3 py-2 pr-10 rounded-lg border border-primary bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
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
                                        {showRaw ? <EyeOff size={13} /> : <Eye size={13} />}
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setEditing(prev => { const n = { ...prev }; delete n[key]; return n; })}
                                    className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-accent transition-colors"
                                  >
                                    Batal
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Test Notifikasi Email</p>
                      <p className="text-[11px] text-muted-foreground">Verifikasi konfigurasi Gmail dengan kirim email percobaan</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    {!config?.gmailUser?.configured ? (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <XCircle size={13} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Atur <strong>Gmail Address</strong> dan <strong>App Password</strong> terlebih dahulu.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Gmail terkonfigurasi. Kirim test untuk memastikan berjalan.
                        </p>
                      </div>
                    )}
                    <form onSubmit={handleTestEmail} className="flex gap-2">
                      <input
                        type="email"
                        value={testEmailTo}
                        onChange={e => setTestEmailTo(e.target.value)}
                        placeholder="Kirim ke alamat email..."
                        disabled={!config?.gmailUser?.configured}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="input-test-email"
                      />
                      <button
                        type="submit"
                        disabled={testingEmail || !testEmailTo || !config?.gmailUser?.configured}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        data-testid="button-send-test-email"
                      >
                        {testingEmail ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                        {testingEmail ? "Mengirim..." : "Kirim Test"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Catatan penting</p>
                  <ul className="text-[11px] text-amber-600 dark:text-amber-500 space-y-0.5 list-disc list-inside">
                    <li>Nilai di sini <strong>lebih diutamakan</strong> dari environment variables.</li>
                    <li>Perubahan Gmail & Site URL berlaku <strong>langsung</strong> tanpa restart.</li>
                    <li>Perubahan Google OAuth berlaku <strong>langsung</strong> di session berjalan.</li>
                    <li>Semua nilai sensitif disimpan terenkripsi di database.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
