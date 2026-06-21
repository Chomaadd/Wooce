import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, FileJson, CheckCircle2, AlertCircle, Loader2, Database, RefreshCw } from "lucide-react";

interface ImportResult {
  ok: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export default function DataManage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/export/blog", { credentials: "include" });
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `blog-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export berhasil", description: "File JSON berhasil diunduh." });
    } catch {
      toast({ title: "Export gagal", description: "Coba lagi beberapa saat.", variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportResult(null);
  }

  async function handleImport() {
    if (!selectedFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mode", importMode);
      const res = await fetch("/api/admin/import/blog", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import gagal");
      setImportResult(data);
      toast({ title: "Import selesai", description: `${data.inserted} artikel baru ditambahkan.` });
    } catch (err: any) {
      toast({ title: "Import gagal", description: err.message || "Periksa format file JSON.", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  }

  function resetImport() {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Database size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("admin.nav.data")}</h1>
            <p className="text-sm text-muted-foreground">Export & import data artikel blog</p>
          </div>
        </div>

        {/* EXPORT CARD */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Download size={16} className="text-primary" />
              <CardTitle className="text-base">Export Data Blog</CardTitle>
            </div>
            <CardDescription>
              Unduh semua artikel blog sebagai file JSON. Bisa digunakan untuk backup atau dipindah ke database lain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              data-testid="button-export-blog"
              onClick={handleExport}
              disabled={exportLoading}
              className="gap-2"
            >
              {exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {exportLoading ? "Memproses..." : "Export Artikel Blog (.json)"}
            </Button>
          </CardContent>
        </Card>

        {/* IMPORT CARD */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-primary" />
              <CardTitle className="text-base">Import Data Blog</CardTitle>
            </div>
            <CardDescription>
              Upload file JSON hasil export untuk memasukkan artikel ke database. Pilih mode <strong>Lewati</strong> agar artikel yang sudah ada tidak tertimpa, atau <strong>Timpa</strong> untuk memperbarui data yang ada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Mode Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mode Import</label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as "skip" | "overwrite")}>
                <SelectTrigger data-testid="select-import-mode" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Lewati jika sudah ada</SelectItem>
                  <SelectItem value="overwrite">Timpa jika sudah ada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Pilih File JSON</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-import"
              >
                <FileJson size={28} className="text-muted-foreground" />
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Klik untuk pilih file <span className="text-primary font-medium">.json</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">Maksimal 10 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-import"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                data-testid="button-import-blog"
                onClick={handleImport}
                disabled={!selectedFile || importLoading}
                className="gap-2"
              >
                {importLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {importLoading ? "Mengimpor..." : "Mulai Import"}
              </Button>
              {(selectedFile || importResult) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetImport}
                  className="gap-1.5 text-muted-foreground"
                  data-testid="button-reset-import"
                >
                  <RefreshCw size={14} />
                  Reset
                </Button>
              )}
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`rounded-xl p-4 space-y-3 border ${importResult.errors > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"}`}
                data-testid="import-result"
              >
                <div className="flex items-center gap-2">
                  {importResult.errors > 0
                    ? <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                    : <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                  }
                  <span className="text-sm font-semibold text-foreground">
                    Import selesai — {importResult.total} artikel diproses
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                    {importResult.inserted} artikel baru
                  </Badge>
                  {importResult.updated > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                      {importResult.updated} diperbarui
                    </Badge>
                  )}
                  {importResult.skipped > 0 && (
                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-0">
                      {importResult.skipped} dilewati
                    </Badge>
                  )}
                  {importResult.errors > 0 && (
                    <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-0">
                      {importResult.errors} error
                    </Badge>
                  )}
                </div>
                {importResult.errors > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Artikel yang error mungkin tidak memiliki field <code className="bg-black/10 dark:bg-white/10 px-1 rounded">slug</code> atau <code className="bg-black/10 dark:bg-white/10 px-1 rounded">title</code>.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardContent className="py-5">
            <div className="flex gap-3">
              <AlertCircle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Catatan penting</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Format file harus JSON berisi array artikel (hasil export dari halaman ini)</li>
                  <li>Mode <strong>Lewati</strong>: artikel yang slug-nya sudah ada tidak akan diubah</li>
                  <li>Mode <strong>Timpa</strong>: artikel yang slug-nya sudah ada akan diperbarui seluruhnya</li>
                  <li>Gambar cover yang di-host di URL eksternal akan tetap berfungsi selama URL-nya valid</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
