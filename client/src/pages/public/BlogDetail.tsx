import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { Calendar, Eye, Tag, ArrowLeft, Newspaper } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";
import { renderRichContent } from "@/components/ui/rich-text-editor";

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverUrl?: string | null;
  tags: string[];
  publishedAt: string;
  views: number;
  authorName: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading, isError } = useQuery<Article>({
    queryKey: ["/api/blog", slug],
    queryFn: () => fetch(`/api/blog/${slug}`).then(r => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  // Increment view count once
  useEffect(() => {
    if (slug) {
      fetch(`/api/blog/${slug}/view`, { method: "PATCH" }).catch(() => {});
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SeoHead title="WOOCE Novel — Blog" />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-background">
        <SeoHead title="Artikel Tidak Ditemukan — WOOCE Novel" />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Newspaper size={28} className="text-muted-foreground/40" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Artikel tidak ditemukan</h1>
          <p className="text-muted-foreground text-sm mb-6">Artikel ini mungkin sudah dihapus atau URL salah.</p>
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              <ArrowLeft size={14} /> Kembali ke Blog
            </button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`${article.title} — WOOCE Novel`}
        description={article.excerpt || `Baca artikel "${article.title}" di WOOCE Novel Blog.`}
        image={article.coverUrl || undefined}
        type="article"
        article={{ publishedTime: article.publishedAt, tags: article.tags }}
      />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-7">
          <Link href="/blog">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-blog">
              <ArrowLeft size={14} /> Kembali ke Blog
            </button>
          </Link>
        </motion.div>

        {/* Cover image */}
        {article.coverUrl && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl overflow-hidden mb-8 border border-border">
            <img src={article.coverUrl} alt={article.title} className="w-full max-h-80 object-cover" />
          </motion.div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                <Tag size={9} /> {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-bold text-foreground leading-snug mb-4">
          {article.title}
        </motion.h1>

        {/* Meta */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-8 pb-6 border-b border-border">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {article.publishedAt ? formatDate(article.publishedAt) : "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            {article.views.toLocaleString("id-ID")} kali dibaca
          </span>
          <span className="text-foreground font-medium">Oleh {article.authorName}</span>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="prose prose-sm sm:prose dark:prose-invert max-w-none text-foreground">
          {article.content
            ? <div dangerouslySetInnerHTML={{ __html: renderRichContent(article.content) }} />
            : <p className="text-muted-foreground italic">Belum ada konten.</p>
          }
        </motion.div>

        {/* Footer nav */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mt-12 pt-6 border-t border-border">
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <ArrowLeft size={14} /> Lihat Semua Artikel
            </button>
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
