import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calendar, Eye, Tag, ArrowRight, Newspaper } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/seometa/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";

interface Article {
  _id: string;
  title: string;
  slug: string;
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

export default function Blog() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/blog"],
    queryFn: () => fetch("/api/blog").then(r => r.json()),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="WOOCE Novel — Blog"
        description="Tips menulis, update platform, dan artikel seputar dunia novel di WOOCE Novel."
      />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Newspaper size={15} className="text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Blog</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Artikel & Update</h1>
          <p className="text-muted-foreground text-sm">Tips menulis, update platform, dan cerita di balik WOOCE Novel.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Newspaper size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold mb-1">Belum ada artikel</p>
            <p className="text-muted-foreground text-sm">Artikel akan muncul di sini setelah dipublikasikan.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article, i) => (
              <motion.div key={article._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/artikel/${article.slug}`}>
                  <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
                    data-testid={`card-article-${article._id}`}>
                    <div className="h-44 bg-muted/50 overflow-hidden flex-shrink-0">
                      {article.coverUrl ? (
                        <img src={article.coverUrl} alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={32} className="text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1 gap-2.5">
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {article.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                              <Tag size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 mt-auto">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={11} />{article.publishedAt ? formatDate(article.publishedAt) : "—"}</span>
                          <span className="flex items-center gap-1"><Eye size={11} />{article.views.toLocaleString("id-ID")}</span>
                        </div>
                        <span className="text-primary text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Baca <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
