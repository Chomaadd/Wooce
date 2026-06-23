import { useState, useEffect } from "react";
import { X, Loader2, Mail, RefreshCw } from "lucide-react";

const EMAIL_TYPES = [
  { value: "test",                 label: "✉️  Test Email" },
  { value: "otp",                  label: "🔐  OTP Verifikasi Hapus Akun" },
  { value: "writer-pending",       label: "⏳  Pengajuan Penulis Ditinjau" },
  { value: "writer-approved",      label: "✅  Pengajuan Penulis Diterima" },
  { value: "writer-rejected",      label: "❌  Pengajuan Penulis Ditolak" },
  { value: "writer-suspended",     label: "🚫  Akun Penulis Disuspend" },
  { value: "account-deleted",      label: "🗑️  Akun Dihapus Admin" },
  { value: "story-backup",         label: "📄  Backup Novel Dihapus" },
  { value: "contact",              label: "💬  Pesan Kontak Masuk" },
  { value: "story-report-removed", label: "⚠️  Cerita Dihapus (Laporan)" },
];

interface EmailPreviewModalProps {
  onClose: () => void;
}

export function EmailPreviewModal({ onClose }: EmailPreviewModalProps) {
  const [selectedType, setSelectedType] = useState("test");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchPreview(type: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/email-preview?type=${type}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setHtml(data.html);
      } else {
        setError(data.message || "Gagal memuat preview.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPreview(selectedType);
  }, [selectedType]);

  const selectedLabel = EMAIL_TYPES.find(t => t.value === selectedType)?.label ?? "";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Preview Template Email</h2>
              <p className="text-[11px] text-muted-foreground">Tampilan email yang akan diterima user</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPreview(selectedType)}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              title="Refresh preview"
              data-testid="button-refresh-email-preview"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              data-testid="button-close-email-preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Type selector */}
        <div className="px-5 py-3 border-b border-border shrink-0 bg-muted/20">
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Jenis Email
          </label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            data-testid="select-email-type-preview"
          >
            {EMAIL_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Memuat preview...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-3 p-8">
              <p className="text-sm text-destructive text-center">{error}</p>
              <button
                onClick={() => fetchPreview(selectedType)}
                className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {html && !loading && !error && (
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title={`Preview: ${selectedLabel}`}
              sandbox="allow-same-origin"
              style={{ minHeight: "500px" }}
            />
          )}
        </div>

        {/* Footer bar */}
        <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Preview menggunakan data dummy — tampilan nyata sama persis
          </p>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-all"
            data-testid="button-close-email-preview-footer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
