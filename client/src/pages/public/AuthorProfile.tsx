import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Globe, Mail, ArrowLeft, Heart, ShieldOff } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { SiTiktok, SiFacebook, SiInstagram, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/use-language";
import type { Author, NovelStory } from "@shared/schema";

type AuthorWithStories = Author & { stories: NovelStory[] };

const STATUS_CONFIG: Record<string, { badge: string; dot: string }> = {
  ongoing:   { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  completed: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  hiatus:    { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",        dot: "bg-amber-400" },
};

export default function AuthorProfile() {
  const [, params] = useRoute("/penulis/:slug");
  const slug = params?.slug ?? "";
  const { t } = useLanguage();

  const { data: author, isLoading } = useQuery<AuthorWithStories>({
    queryKey: ["/api/authors", slug],
    queryFn: () => fetch(`/api/authors/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-5 lg:px-8 py-12">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!author || (author as any).message) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <BookOpen size={48} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t("author.notFound")}</p>
          <Link href="/"><button className="mt-4 text-sm text-primary hover:underline">{t("author.backToHome")}</button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const socialLinks = [
    { key: "tiktok",    href: author.tiktok ? `https://tiktok.com/@${author.tiktok.replace(/^@/, "")}` : null, icon: <SiTiktok size={16} />, label: "TikTok" },
    { key: "instagram", href: author.instagram ? `https://instagram.com/${author.instagram.replace(/^@/, "")}` : null, icon: <SiInstagram size={16} />, label: "Instagram" },
    { key: "facebook",  href: author.facebook ? (author.facebook.startsWith("http") ? author.facebook : `https://facebook.com/${author.facebook}`) : null, icon: <SiFacebook size={16} />, label: "Facebook" },
    { key: "twitter",   href: author.twitter ? `https://twitter.com/${author.twitter.replace(/^@/, "")}` : null, icon: <SiX size={14} />, label: "Twitter / X" },
    { key: "website",   href: author.website ?? null, icon: <Globe size={16} />, label: "Website" },
    { key: "email",     href: author.email ? `mailto:${author.email}` : null, icon: <Mail size={16} />, label: "Email" },
  ].filter(l => !!l.href);

  const donationLinks = [
    { key: "saweria",  href: author.saweria ? `https://saweria.co/${author.saweria}` : null, label: "Saweria", color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30" },
    { key: "trakteer", href: author.trakteer ? `https://trakteer.id/${author.trakteer}` : null, label: "Trakteer", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30" },
  ].filter(l => !!l.href);

  const isSuspended = (author as any).userStatus === "suspended";
  const isVerified = (author as any).verificationStatus === "verified";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={14} /> {t("author.backToHome")}
          </button>
        </Link>

        {isSuspended && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-destructive/8 border border-destructive/20"
            data-testid="banner-author-suspended"
          >
            <ShieldOff size={16} className="text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">{t("author.suspendedTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("author.suspendedDesc")}</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0 shadow-md">
            {author.photoUrl ? (
              <img src={author.photoUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-3xl font-bold text-primary/40">{author.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{author.name}</h1>
              {isVerified && <VerifiedBadge size="lg" showLabel={true} />}
              {isSuspended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  <ShieldOff size={9} /> {t("author.suspended")}
                </span>
              )}
            </div>
            {author.bio && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-xl">{author.bio}</p>
            )}

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {socialLinks.map(({ key, href, icon, label }) => (
                  <a
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50 transition-all duration-200"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            )}

            {donationLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {donationLinks.map(({ key, href, label, color }) => (
                  <a
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${color}`}
                  >
                    <Heart size={14} fill="currentColor" />
                    {t("author.support")} {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {author.stories && author.stories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-foreground">{t("author.works")}</h2>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground">{author.stories.length} {t("author.stories")}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {author.stories.map((story, i) => {
                const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.ongoing;
                return (
                  <motion.div key={story.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/${story.slug}`} data-testid={`link-author-story-${story.id}`}>
                      <div className="group cursor-pointer">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-muted relative shadow-sm">
                          {story.coverUrl ? (
                            <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <BookOpen size={18} className="text-primary/40" />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${cfg.badge}`}>
                              <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                              {t(`novel.status.${story.status}`)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{story.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{story.category}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
