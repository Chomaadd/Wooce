import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { Calendar, Eye, Tag, ArrowLeft, Newspaper, BookOpen, Languages, Loader2, RotateCcw } from "lucide-react";
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

function RelatedArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Link href={`/artikel/${article.slug}`}>
        <div
          className="group flex flex-col h-full rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
          data-testid={`card-related-${article.slug}`}
        >
          {article.coverUrl ? (
            <div className="w-full h-36 overflow-hidden bg-muted shrink-0">
              <img
                src={article.coverUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
              <BookOpen size={28} className="text-primary/30" />
            </div>
          )}

          <div className="flex flex-col flex-1 p-4 gap-2">
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                    <Tag size={8} /> {tag}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto pt-2 border-t border-border/60">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {article.publishedAt ? formatDate(article.publishedAt) : "—"}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={10} />
                {article.views.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RelatedArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <Skeleton className="w-full h-36" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function translateHtml(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Walk all text nodes, collect non-empty ones
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    if (t.textContent?.trim()) textNodes.push(t);
  }
  if (textNodes.length === 0) return html;

  const segments = textNodes.map(n => n.textContent ?? "");
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments, from: "id", to: "en" }),
  });
  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json() as { segments: string[] };
  data.segments.forEach((translated, i) => {
    textNodes[i].textContent = translated;
  });
  return doc.body.innerHTML;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [translating, setTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const isTranslated = translatedTitle !== null;

  const { data: article, isLoading, isError } = useQuery<Article>({
    queryKey: ["/api/blog", slug],
    queryFn: () => fetch(`/api/blog/${slug}`).then(r => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const { data: related = [], isLoading: relatedLoading } = useQuery<Article[]>({
    queryKey: ["/api/blog", slug, "related"],
    queryFn: () => fetch(`/api/blog/${slug}/related`).then(r => r.json()),
    enabled: !!slug && !!article,
  });

  useEffect(() => {
    if (slug) {
      fetch(`/api/blog/${slug}/view`, { method: "PATCH" }).catch(() => {});
    }
  }, [slug]);

  const handleTranslate = useCallback(async () => {
    if (isTranslated) {
      setTranslatedTitle(null);
      setTranslatedHtml(null);
      return;
    }
    if (!article) return;
    setTranslating(true);
    try {
      const renderedContent = renderRichContent(article.content || "");
      const [tTitle, tHtml] = await Promise.all([
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segments: [article.title], from: "id", to: "en" }),
        }).then(r => r.json()).then((d: { segments: string[] }) => d.segments[0]),
        translateHtml(renderedContent),
      ]);
      setTranslatedTitle(tTitle);
      setTranslatedHtml(tHtml);
    } catch {
      // silently fallback — keep original
    } finally {
      setTranslating(false);
    }
  }, [article, isTranslated]);

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
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-7">
          <Link href="/blog">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-blog">
              <ArrowLeft size={14} /> Kembali ke Blog
            </button>
          </Link>
        </motion.div>

        {article.coverUrl && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl overflow-hidden mb-8 border border-border">
            <img src={article.coverUrl} alt={article.title} className="w-full max-h-80 object-cover" />
          </motion.div>
        )}

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

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-bold text-foreground leading-snug mb-4">
          {isTranslated && translatedTitle ? translatedTitle : article.title}
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar size={12} />{article.publishedAt ? formatDate(article.publishedAt) : "—"}</span>
            <span className="flex items-center gap-1.5"><Eye size={12} />{article.views.toLocaleString("id-ID")} kali dibaca</span>
            <span className="text-foreground font-medium">Oleh {article.authorName}</span>
          </div>
          <button
            onClick={handleTranslate}
            disabled={translating}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isTranslated
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            data-testid="button-translate-article"
          >
            {translating ? (
              <><Loader2 size={12} className="animate-spin" /> Menerjemahkan…</>
            ) : isTranslated ? (
              <><RotateCcw size={12} /> Tampilkan Original</>
            ) : (
              <><Languages size={12} /> Terjemahkan</>
            )}
          </button>
        </motion.div>

        {isTranslated && translatedTitle && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs text-primary">
            <Languages size={11} />
            <span>Terjemahan otomatis — mungkin tidak sempurna.</span>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="prose prose-sm sm:prose dark:prose-invert max-w-none text-foreground">
          {isTranslated && translatedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: translatedHtml }} />
          ) : article.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderRichContent(article.content) }} />
          ) : (
            <p className="text-muted-foreground italic">Belum ada konten.</p>
          )}
        </motion.div>

        {/* Related Articles */}
        {(relatedLoading || related.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-14"
            data-testid="section-related-articles"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <h2 className="text-base font-bold text-foreground">Artikel Terkait</h2>
            </div>

            {relatedLoading ? (
              <RelatedArticlesSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((rel, i) => (
                  <RelatedArticleCard key={rel._id} article={rel} index={i} />
                ))}
              </div>
            )}
          </motion.section>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-10 pt-6 border-t border-border">
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
