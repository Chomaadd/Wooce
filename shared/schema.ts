import { z } from "zod";

export const adminSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  name: z.string(),
  email: z.string(),
});
export const insertAdminSchema = adminSchema.omit({ id: true });

export const blogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
  imageUrl: z.string().nullable().optional(),
  published: z.boolean().default(false),
  scheduledAt: z.union([z.date(), z.string()]).nullable().optional(),
  tags: z.array(z.string()).default([]),
  viewCount: z.number().default(0),
  reactions: z.object({
    thumbsUp: z.number().default(0),
    heart: z.number().default(0),
  }).default({ thumbsUp: 0, heart: 0 }),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertBlogPostSchema = blogPostSchema.omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, reactions: true });

export const contactMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string(),
  message: z.string(),
  read: z.boolean().default(false).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertContactMessageSchema = contactMessageSchema.omit({ id: true, createdAt: true, read: true });

export const musicTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  albumArt: z.string().nullable().optional(),
  audioUrl: z.string(),
  duration: z.string().nullable().optional(),
  isAutoPlay: z.boolean().default(false).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertMusicTrackSchema = musicTrackSchema.omit({ id: true, createdAt: true });

export const brandItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  featured: z.boolean().default(false).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertBrandItemSchema = brandItemSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Admin = z.infer<typeof adminSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type BlogPost = z.infer<typeof blogPostSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type CreateBlogPostRequest = InsertBlogPost;
export type UpdateBlogPostRequest = Partial<InsertBlogPost>;
export type BlogPostResponse = BlogPost;

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type CreateContactMessageRequest = InsertContactMessage;
export type ContactMessageResponse = ContactMessage;

export type MusicTrack = z.infer<typeof musicTrackSchema>;
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;
export type CreateMusicTrackRequest = InsertMusicTrack;
export type UpdateMusicTrackRequest = Partial<InsertMusicTrack>;
export type MusicTrackResponse = MusicTrack;

export type BrandItem = z.infer<typeof brandItemSchema>;
export type InsertBrandItem = z.infer<typeof insertBrandItemSchema>;
export type CreateBrandItemRequest = InsertBrandItem;
export type UpdateBrandItemRequest = Partial<InsertBrandItem>;
export type BrandItemResponse = BrandItem;

export const resumeItemSchema = z.object({
  id: z.string(),
  type: z.enum(["experience", "education", "skill"]),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  order: z.number().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertResumeItemSchema = resumeItemSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type ResumeItem = z.infer<typeof resumeItemSchema>;
export type InsertResumeItem = z.infer<typeof insertResumeItemSchema>;
export type CreateResumeItemRequest = InsertResumeItem;
export type UpdateResumeItemRequest = Partial<InsertResumeItem>;
export type ResumeItemResponse = ResumeItem;

export const linkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  borderColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
});
export const insertLinkItemSchema = linkItemSchema.omit({ id: true });

export type LinkItem = z.infer<typeof linkItemSchema>;
export type InsertLinkItem = z.infer<typeof insertLinkItemSchema>;
export type CreateLinkItemRequest = InsertLinkItem;
export type UpdateLinkItemRequest = Partial<InsertLinkItem>;
export type LinkItemResponse = LinkItem;

export const pageViewSchema = z.object({
  id: z.string(),
  page: z.string(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export type PageView = z.infer<typeof pageViewSchema>;

export const analyticsSchema = z.object({
  totalViews: z.number(),
  todayViews: z.number(),
  weekViews: z.number(),
  monthViews: z.number(),
  dailyViews: z.array(z.object({ date: z.string(), views: z.number() })),
  topPages: z.array(z.object({ page: z.string(), views: z.number() })),
  deviceBreakdown: z.array(z.object({ device: z.string(), views: z.number() })),
});
export type Analytics = z.infer<typeof analyticsSchema>;

export const availabilityStatusSchema = z.enum(["open", "busy", "unavailable"]);
export const siteSettingsSchema = z.object({
  id: z.string(),
  siteTitle: z.string().nullable().optional(),
  adminAvatarUrl: z.string().nullable().optional(),
  aboutImageUrl: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
  ogImageUrl: z.string().nullable().optional(),
  availabilityStatus: availabilityStatusSchema.default("open"),
  availabilityLabel: z.string().default("Open to Work"),
  linksAvatarUrl: z.string().nullable().optional(),
  linksName: z.string().nullable().optional(),
  linksBio: z.string().nullable().optional(),
  linksBackgroundUrl: z.string().nullable().optional(),
  linksBorderStyle: z.string().nullable().optional(),
  lanyardDiscordId: z.string().nullable().optional(),
  nowListening: z.string().nullable().optional(),
  nowReading: z.string().nullable().optional(),
  nowWorking: z.string().nullable().optional(),
  nowLocation: z.string().nullable().optional(),
  resumeFullName: z.string().nullable().optional(),
  resumeTitle: z.string().nullable().optional(),
  resumeAbout: z.string().nullable().optional(),
  resumePhotoUrl: z.string().nullable().optional(),
  resumeBirthDate: z.string().nullable().optional(),
  resumeBirthPlace: z.string().nullable().optional(),
  resumeReligion: z.string().nullable().optional(),
  resumeGender: z.string().nullable().optional(),
  resumeMarriagestatus: z.string().nullable().optional(),
  resumeNationality: z.string().nullable().optional(),
  resumePhone: z.string().nullable().optional(),
  resumeAddress: z.string().nullable().optional(),
  resumeEmail: z.string().nullable().optional(),
  resumeWebsite: z.string().nullable().optional(),
});
export const updateSiteSettingsSchema = siteSettingsSchema.omit({ id: true }).partial();

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

// ── Novel / Story System ──────────────────────────────────────────────────
export const novelStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  coverUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().default("novel"),
  status: z.enum(["ongoing", "completed", "hiatus"]).default("ongoing"),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  viewCount: z.number().default(0),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertNovelStorySchema = novelStorySchema.omit({ id: true, createdAt: true, updatedAt: true });
export type NovelStory = z.infer<typeof novelStorySchema>;
export type InsertNovelStory = z.infer<typeof insertNovelStorySchema>;
export type CreateNovelStoryRequest = InsertNovelStory;
export type UpdateNovelStoryRequest = Partial<InsertNovelStory>;

export const novelSeasonSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  seasonNumber: z.number(),
  title: z.string(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertNovelSeasonSchema = novelSeasonSchema.omit({ id: true, createdAt: true });
export type NovelSeason = z.infer<typeof novelSeasonSchema>;
export type InsertNovelSeason = z.infer<typeof insertNovelSeasonSchema>;
export type CreateNovelSeasonRequest = InsertNovelSeason;
export type UpdateNovelSeasonRequest = Partial<Pick<InsertNovelSeason, "title">>;

export const novelChapterSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  seasonId: z.string(),
  chapterNumber: z.number(),
  title: z.string(),
  content: z.string().default(""),
  published: z.boolean().default(false),
  scheduledAt: z.union([z.date(), z.string()]).nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertNovelChapterSchema = novelChapterSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type NovelChapter = z.infer<typeof novelChapterSchema>;
export type InsertNovelChapter = z.infer<typeof insertNovelChapterSchema>;
export type CreateNovelChapterRequest = InsertNovelChapter;
export type UpdateNovelChapterRequest = Partial<Omit<InsertNovelChapter, "storyId" | "seasonId">>;
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Short URLs
// ─────────────────────────────────────────────────────────────────────────
export const shortUrlSchema = z.object({
  id: z.string(),
  slug: z.string(),
  targetUrl: z.string().url(),
  title: z.string().optional(),
  clicks: z.number().default(0),
  expiresAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});
export const insertShortUrlSchema = shortUrlSchema.omit({ id: true, clicks: true, createdAt: true });
export type ShortUrl = z.infer<typeof shortUrlSchema>;
export type InsertShortUrl = z.infer<typeof insertShortUrlSchema>;
export type CreateShortUrlRequest = InsertShortUrl;

// ─────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin?: {
    id: string;
    username: string;
    name: string;
    email: string;
  };
  message?: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  name: string;
  email: string;
}
