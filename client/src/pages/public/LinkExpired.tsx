import { Link, useSearch } from "wouter";
import { LinkIcon, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkExpired() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const slug = params.get("slug");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm w-full space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <LinkIcon className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Tautan Sudah Kedaluwarsa</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Link yang kamu akses sudah tidak aktif atau sudah melewati masa berlakunya.
          </p>
          {slug && (
            <p className="font-mono text-xs text-muted-foreground/70 mt-1 bg-muted/50 rounded-lg px-3 py-1.5 inline-block">
              /{slug}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="gap-2 w-full">
            <Link href="/">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="gap-2 w-full text-muted-foreground"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Halaman Sebelumnya
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Coba hubungi pemilik link jika kamu yakin ini sebuah kesalahan.
        </p>
      </div>
    </div>
  );
}
