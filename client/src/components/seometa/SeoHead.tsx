import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/use-settings";

const SITE_URL = "https://wooce.novel";
const FALLBACK_NAME = "WOOCE Novel";
const FALLBACK_DESCRIPTION = "Platform baca novel, komik, dan cerita pendek terbaik — WOOCE Novel.";
const FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  cardType?: "summary" | "summary_large_image";
  article?: {
    publishedTime?: string;
    tags?: string[];
  };
}

export function SeoHead({
  title,
  description,
  image,
  url,
  type = "website",
  cardType,
  article,
}: SeoHeadProps) {
  const { data: settings } = useSiteSettings();

  const siteName = settings?.siteTitle || FALLBACK_NAME;
  const defaultDesc = settings?.metaDescription || FALLBACK_DESCRIPTION;
  const defaultImage = settings?.ogImageUrl || FALLBACK_IMAGE;

  const resolvedDescription = description ?? defaultDesc;
  const resolvedImage = image
    ? (image.startsWith("http") ? image : `${SITE_URL}${image}`)
    : defaultImage;
  const resolvedCardType = cardType ?? (image ? "summary_large_image" : "summary");
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={`${siteName} logo`} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />

      {type === "article" && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === "article" && article?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      <meta name="twitter:card" content={resolvedCardType} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />
    </Helmet>
  );
}
