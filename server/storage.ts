import {
  type Admin,
  type Author,
  type InsertAuthor,
  type User,
  type InsertUser,
  type NovelStory,
  type CreateNovelStoryRequest,
  type UpdateNovelStoryRequest,
  type NovelSeason,
  type CreateNovelSeasonRequest,
  type UpdateNovelSeasonRequest,
  type NovelChapter,
  type CreateNovelChapterRequest,
  type UpdateNovelChapterRequest,
  type BannerSlide,
  type CreateBannerSlideRequest,
  type UpdateBannerSlideRequest,
  type Announcement,
  type InsertAnnouncement,
} from "@shared/schema";
import {
  AdminModel,
  UserModel,
  AuthorModel,
  NovelStoryModel,
  NovelSeasonModel,
  NovelChapterModel,
  BannerSlideModel,
  AnnouncementModel,
} from "./db";

export interface IStorage {
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: string): Promise<Admin | undefined>;

  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getUsers(role?: string, status?: string): Promise<User[]>;

  getAuthors(): Promise<Author[]>;
  getAuthorBySlug(slug: string): Promise<Author | undefined>;
  getAuthorById(id: string): Promise<Author | undefined>;
  createAuthor(data: InsertAuthor): Promise<Author>;
  updateAuthor(id: string, updates: Partial<InsertAuthor>): Promise<Author>;
  deleteAuthor(id: string): Promise<void>;

  getNovelStories(published?: boolean): Promise<NovelStory[]>;
  getNovelStoriesByAuthor(authorId: string): Promise<NovelStory[]>;
  getNovelStory(slug: string): Promise<NovelStory | undefined>;
  getNovelStoryById(id: string): Promise<NovelStory | undefined>;
  createNovelStory(data: CreateNovelStoryRequest): Promise<NovelStory>;
  updateNovelStory(id: string, updates: UpdateNovelStoryRequest): Promise<NovelStory>;
  deleteNovelStory(id: string): Promise<void>;
  incrementNovelViewCount(slug: string): Promise<NovelStory>;
  rateNovelStory(slug: string, rating: number): Promise<{ ratingSum: number; ratingCount: number }>;

  getNovelSeasons(storyId: string): Promise<NovelSeason[]>;
  getNovelSeason(id: string): Promise<NovelSeason | undefined>;
  createNovelSeason(data: CreateNovelSeasonRequest): Promise<NovelSeason>;
  updateNovelSeason(id: string, updates: UpdateNovelSeasonRequest): Promise<NovelSeason>;
  deleteNovelSeason(id: string): Promise<void>;

  getNovelChapters(seasonId: string, published?: boolean): Promise<NovelChapter[]>;
  getUpcomingChapters(seasonId: string): Promise<{ id: string; chapterNumber: number; title: string; scheduledAt: string | null }[]>;
  getNovelChapter(id: string): Promise<NovelChapter | undefined>;
  getNovelChapterByNumber(storyId: string, seasonId: string, chapterNumber: number): Promise<NovelChapter | undefined>;
  createNovelChapter(data: CreateNovelChapterRequest): Promise<NovelChapter>;
  updateNovelChapter(id: string, updates: UpdateNovelChapterRequest): Promise<NovelChapter>;
  deleteNovelChapter(id: string): Promise<void>;
  incrementChapterViewCount(chapterId: string): Promise<void>;
  getTopChaptersByViews(limit?: number): Promise<Array<{ id: string; title: string; chapterNumber: number; viewCount: number; storyTitle: string; storySlug: string }>>;

  getBanners(activeOnly?: boolean): Promise<BannerSlide[]>;
  createBanner(data: CreateBannerSlideRequest): Promise<BannerSlide>;
  updateBanner(id: string, updates: UpdateBannerSlideRequest): Promise<BannerSlide>;
  deleteBanner(id: string): Promise<void>;
  reorderBanners(ids: string[]): Promise<void>;

  getAnnouncements(activeOnly?: boolean): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;
}

function mapId<T>(doc: any): T {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) { obj.id = obj._id.toString(); delete obj._id; }
  delete obj.__v;
  return obj as T;
}

function mapStory(doc: any): NovelStory {
  const obj = mapId<NovelStory>(doc);
  if (obj.authorId) (obj as any).authorId = obj.authorId.toString();
  return obj;
}

function mapUser(doc: any): User {
  const obj = mapId<User>(doc);
  if (obj.authorId) (obj as any).authorId = obj.authorId.toString();
  return obj;
}

export class DatabaseStorage implements IStorage {
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const admin = await AdminModel.findOne({ username });
    return admin ? mapId(admin) : undefined;
  }
  async getAdminById(id: string): Promise<Admin | undefined> {
    const admin = await AdminModel.findById(id);
    return admin ? mapId(admin) : undefined;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUserById(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id);
    return doc ? mapUser(doc) : undefined;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ email });
    return doc ? mapUser(doc) : undefined;
  }
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ googleId });
    return doc ? mapUser(doc) : undefined;
  }
  async createUser(data: InsertUser): Promise<User> {
    const doc = await UserModel.create(data);
    return mapUser(doc);
  }
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) throw new Error('User not found');
    return mapUser(doc);
  }
  async getUsers(role?: string, status?: string): Promise<User[]> {
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;
    const docs = await UserModel.find(query).sort({ createdAt: -1 });
    return docs.map((d: any) => mapUser(d));
  }

  // ── Authors ────────────────────────────────────────────────────────────────
  async getAuthors(): Promise<Author[]> {
    const docs = await AuthorModel.find().sort({ name: 1 });
    return docs.map((d: any) => mapId<Author>(d));
  }
  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    const doc = await AuthorModel.findOne({ slug });
    return doc ? mapId<Author>(doc) : undefined;
  }
  async getAuthorById(id: string): Promise<Author | undefined> {
    const doc = await AuthorModel.findById(id);
    return doc ? mapId<Author>(doc) : undefined;
  }
  async createAuthor(data: InsertAuthor): Promise<Author> {
    const doc = await AuthorModel.create(data);
    return mapId<Author>(doc);
  }
  async updateAuthor(id: string, updates: Partial<InsertAuthor>): Promise<Author> {
    const doc = await AuthorModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) throw new Error('Author not found');
    return mapId<Author>(doc);
  }
  async deleteAuthor(id: string): Promise<void> {
    await AuthorModel.findByIdAndDelete(id);
  }

  // ── Novel Stories ──────────────────────────────────────────────────────────
  async getNovelStories(published?: boolean): Promise<NovelStory[]> {
    const query = published !== undefined ? { published } : {};
    const docs = await NovelStoryModel.find(query).sort({ createdAt: -1 });
    return docs.map((d: any) => mapStory(d));
  }
  async getNovelStoriesByAuthor(authorId: string): Promise<NovelStory[]> {
    const docs = await NovelStoryModel.find({ authorId }).sort({ createdAt: -1 });
    return docs.map((d: any) => mapStory(d));
  }
  async getNovelStory(slug: string): Promise<NovelStory | undefined> {
    const doc = await NovelStoryModel.findOne({ slug });
    return doc ? mapStory(doc) : undefined;
  }
  async getNovelStoryById(id: string): Promise<NovelStory | undefined> {
    const doc = await NovelStoryModel.findById(id);
    return doc ? mapStory(doc) : undefined;
  }
  async createNovelStory(data: CreateNovelStoryRequest): Promise<NovelStory> {
    const doc = await NovelStoryModel.create(data);
    return mapStory(doc);
  }
  async updateNovelStory(id: string, updates: UpdateNovelStoryRequest): Promise<NovelStory> {
    const doc = await NovelStoryModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    if (!doc) throw new Error('Story not found');
    return mapStory(doc);
  }
  async incrementNovelViewCount(slug: string): Promise<NovelStory> {
    const doc = await NovelStoryModel.findOneAndUpdate({ slug }, { $inc: { viewCount: 1 } }, { new: true });
    if (!doc) throw new Error('Story not found');
    return mapStory(doc);
  }
  async deleteNovelStory(id: string): Promise<void> {
    await NovelStoryModel.findByIdAndDelete(id);
    const seasons = await NovelSeasonModel.find({ storyId: id });
    for (const season of seasons) await NovelChapterModel.deleteMany({ seasonId: season._id });
    await NovelSeasonModel.deleteMany({ storyId: id });
  }
  async rateNovelStory(slug: string, rating: number): Promise<{ ratingSum: number; ratingCount: number }> {
    const doc = await NovelStoryModel.findOneAndUpdate({ slug }, { $inc: { ratingSum: rating, ratingCount: 1 } }, { new: true });
    if (!doc) throw new Error('Story not found');
    return { ratingSum: doc.ratingSum || 0, ratingCount: doc.ratingCount || 0 };
  }

  // ── Novel Seasons ──────────────────────────────────────────────────────────
  async getNovelSeasons(storyId: string): Promise<NovelSeason[]> {
    const docs = await NovelSeasonModel.find({ storyId }).sort({ seasonNumber: 1 });
    return docs.map((d: any) => ({ ...mapId<NovelSeason>(d), storyId: d.storyId?.toString() }));
  }
  async getNovelSeason(id: string): Promise<NovelSeason | undefined> {
    const doc = await NovelSeasonModel.findById(id);
    return doc ? { ...mapId<NovelSeason>(doc), storyId: doc.storyId?.toString() } : undefined;
  }
  async createNovelSeason(data: CreateNovelSeasonRequest): Promise<NovelSeason> {
    const doc = await NovelSeasonModel.create(data);
    return { ...mapId<NovelSeason>(doc), storyId: doc.storyId?.toString() };
  }
  async updateNovelSeason(id: string, updates: UpdateNovelSeasonRequest): Promise<NovelSeason> {
    const doc = await NovelSeasonModel.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) throw new Error('Season not found');
    return { ...mapId<NovelSeason>(doc), storyId: doc.storyId?.toString() };
  }
  async deleteNovelSeason(id: string): Promise<void> {
    await NovelSeasonModel.findByIdAndDelete(id);
    await NovelChapterModel.deleteMany({ seasonId: id });
  }

  // ── Novel Chapters ─────────────────────────────────────────────────────────
  async getNovelChapters(seasonId: string, published?: boolean): Promise<NovelChapter[]> {
    const now = new Date();
    await NovelChapterModel.updateMany(
      { scheduledAt: { $lte: now }, published: false },
      { $set: { published: true, scheduledAt: null, updatedAt: now } }
    );
    const query: any = { seasonId };
    if (published !== undefined) query.published = published;
    const docs = await NovelChapterModel.find(query).sort({ chapterNumber: 1 });
    return docs.map((d: any) => ({ ...mapId<NovelChapter>(d), storyId: d.storyId?.toString(), seasonId: d.seasonId?.toString(), scheduledAt: d.scheduledAt ?? null }));
  }
  async getUpcomingChapters(seasonId: string) {
    const docs = await NovelChapterModel.find({ seasonId, published: false, scheduledAt: { $gt: new Date() } }).sort({ chapterNumber: 1 }).select("chapterNumber title scheduledAt");
    return docs.map((d: any) => ({ id: d._id.toString(), chapterNumber: d.chapterNumber, title: d.title, scheduledAt: d.scheduledAt ? (d.scheduledAt as Date).toISOString() : null }));
  }
  async getNovelChapter(id: string): Promise<NovelChapter | undefined> {
    const doc = await NovelChapterModel.findById(id);
    return doc ? { ...mapId<NovelChapter>(doc), storyId: doc.storyId?.toString(), seasonId: doc.seasonId?.toString() } : undefined;
  }
  async getNovelChapterByNumber(storyId: string, seasonId: string, chapterNumber: number): Promise<NovelChapter | undefined> {
    const story = await NovelStoryModel.findOne({ slug: storyId });
    const stId = story ? story._id : storyId;
    const season = await NovelSeasonModel.findOne({ storyId: stId, seasonNumber: Number(seasonId) });
    if (!season) return undefined;
    const doc = await NovelChapterModel.findOne({ seasonId: season._id, chapterNumber, published: true });
    return doc ? { ...mapId<NovelChapter>(doc), storyId: doc.storyId?.toString(), seasonId: doc.seasonId?.toString() } : undefined;
  }
  async createNovelChapter(data: CreateNovelChapterRequest): Promise<NovelChapter> {
    const doc = await NovelChapterModel.create(data);
    return { ...mapId<NovelChapter>(doc), storyId: doc.storyId?.toString(), seasonId: doc.seasonId?.toString() };
  }
  async updateNovelChapter(id: string, updates: UpdateNovelChapterRequest): Promise<NovelChapter> {
    const now = new Date();
    const patch: any = { ...updates, updatedAt: now };
    if (updates.published === true) patch.scheduledAt = null;
    const doc = await NovelChapterModel.findByIdAndUpdate(id, { $set: patch }, { new: true, timestamps: false });
    if (!doc) throw new Error('Chapter not found');
    return { ...mapId<NovelChapter>(doc), storyId: doc.storyId?.toString(), seasonId: doc.seasonId?.toString() };
  }
  async deleteNovelChapter(id: string): Promise<void> {
    await NovelChapterModel.findByIdAndDelete(id);
  }
  async incrementChapterViewCount(chapterId: string): Promise<void> {
    await NovelChapterModel.findByIdAndUpdate(chapterId, { $inc: { viewCount: 1 } });
  }
  async getTopChaptersByViews(limit = 10): Promise<Array<{ id: string; title: string; chapterNumber: number; viewCount: number; storyTitle: string; storySlug: string }>> {
    const chapters = await NovelChapterModel.find({ published: true }).sort({ viewCount: -1 }).limit(limit);
    const results = [];
    for (const ch of chapters) {
      const story = await NovelStoryModel.findById(ch.storyId);
      results.push({ id: ch._id.toString(), title: ch.title, chapterNumber: ch.chapterNumber, viewCount: ch.viewCount || 0, storyTitle: story?.title ?? "Unknown", storySlug: story?.slug ?? "" });
    }
    return results;
  }

  // ── Banner Slides ──────────────────────────────────────────────────────────
  async getBanners(activeOnly?: boolean): Promise<BannerSlide[]> {
    const query = activeOnly ? { active: true } : {};
    const docs = await BannerSlideModel.find(query).sort({ order: 1, createdAt: 1 });
    return docs.map((d: any) => mapId<BannerSlide>(d));
  }
  async createBanner(data: CreateBannerSlideRequest): Promise<BannerSlide> {
    const count = await BannerSlideModel.countDocuments();
    const doc = await BannerSlideModel.create({ ...data, order: count });
    return mapId<BannerSlide>(doc);
  }
  async updateBanner(id: string, updates: UpdateBannerSlideRequest): Promise<BannerSlide> {
    const doc = await BannerSlideModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) throw new Error('Banner not found');
    return mapId<BannerSlide>(doc);
  }
  async deleteBanner(id: string): Promise<void> {
    await BannerSlideModel.findByIdAndDelete(id);
  }
  async reorderBanners(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id, idx) => BannerSlideModel.findByIdAndUpdate(id, { $set: { order: idx } })));
  }

  // ── Announcements ──────────────────────────────────────────────────────────
  async getAnnouncements(activeOnly?: boolean): Promise<Announcement[]> {
    const now = new Date();
    const query: any = activeOnly
      ? { active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
      : {};
    const docs = await AnnouncementModel.find(query).sort({ createdAt: -1 });
    return docs.map((d: any) => mapId<Announcement>(d));
  }
  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const doc = await AnnouncementModel.create(data);
    return mapId<Announcement>(doc);
  }
  async updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    const doc = await AnnouncementModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) throw new Error('Announcement not found');
    return mapId<Announcement>(doc);
  }
  async deleteAnnouncement(id: string): Promise<void> {
    await AnnouncementModel.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();
