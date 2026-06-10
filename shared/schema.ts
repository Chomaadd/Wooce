import { z } from "zod";

// ── Author ────────────────────────────────────────────────────────────────────
export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  saweria: z.string().nullable().optional(),
  trakteer: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertAuthorSchema = authorSchema.omit({ id: true, createdAt: true });
export type Author = z.infer<typeof authorSchema>;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export const adminSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  name: z.string(),
  email: z.string(),
});
export const insertAdminSchema = adminSchema.omit({ id: true });
export type Admin = z.infer<typeof adminSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

// ── Novel / Story System ──────────────────────────────────────────────────────
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
  ratingSum: z.number().default(0),
  ratingCount: z.number().default(0),
  donationUrl: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
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
  viewCount: z.number().default(0),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export const insertNovelChapterSchema = novelChapterSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type NovelChapter = z.infer<typeof novelChapterSchema>;
export type InsertNovelChapter = z.infer<typeof insertNovelChapterSchema>;
export type CreateNovelChapterRequest = InsertNovelChapter;
export type UpdateNovelChapterRequest = Partial<Omit<InsertNovelChapter, "storyId" | "seasonId">>;

// ── Banner Slides ─────────────────────────────────────────────────────────────
export const bannerSlideSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  link: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export type BannerSlide = z.infer<typeof bannerSlideSchema>;
export type CreateBannerSlideRequest = Omit<BannerSlide, "id" | "createdAt" | "updatedAt">;
export type UpdateBannerSlideRequest = Partial<CreateBannerSlideRequest>;

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementSchema = z.object({
  id: z.string(),
  message: z.string(),
  type: z.enum(["info", "warning", "success"]).default("info"),
  link: z.string().nullable().optional(),
  linkText: z.string().nullable().optional(),
  active: z.boolean().default(true),
  expiresAt: z.union([z.date(), z.string()]).nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertAnnouncementSchema = announcementSchema.omit({ id: true, createdAt: true });
export type Announcement = z.infer<typeof announcementSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// ── User (OAuth + role-based) ─────────────────────────────────────────────────
export const userSchema = z.object({
  id: z.string(),
  googleId: z.string().nullable().optional(),
  email: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable().optional(),
  role: z.enum(["reader", "writer", "admin"]).default("reader"),
  status: z.enum(["active", "pending", "suspended"]).default("active"),
  authorId: z.string().nullable().optional(),
  rejectedAt: z.union([z.date(), z.string()]).nullable().optional(),
  suspendedAt: z.union([z.date(), z.string()]).nullable().optional(),
  verificationStatus: z.enum(["none", "pending", "verified"]).default("none").optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true, rejectedAt: true, suspendedAt: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["pending", "approved", "rejected", "suspended", "announcement", "chapter_new", "story_removed", "report_rejected", "topup_success", "topup_failed"]),
  link: z.string().nullable().optional(),
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export type AppNotification = z.infer<typeof notificationSchema>;
export type InsertNotification = Omit<AppNotification, "id" | "createdAt" | "read">;

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  success: boolean;
  admin?: { id: string; username: string; name: string; email: string; };
  message?: string;
}
export interface CurrentUserResponse {
  id: string;
  username: string;
  name: string;
  email: string;
}
