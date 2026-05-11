import {
  type Admin,
  type NovelStory,
  type CreateNovelStoryRequest,
  type UpdateNovelStoryRequest,
  type NovelSeason,
  type CreateNovelSeasonRequest,
  type UpdateNovelSeasonRequest,
  type NovelChapter,
  type CreateNovelChapterRequest,
  type UpdateNovelChapterRequest,
} from "@shared/schema";
import {
  AdminModel,
  NovelStoryModel,
  NovelSeasonModel,
  NovelChapterModel,
} from "./db";

export interface IStorage {
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: string): Promise<Admin | undefined>;

  getNovelStories(published?: boolean): Promise<NovelStory[]>;
  getNovelStory(slug: string): Promise<NovelStory | undefined>;
  getNovelStoryById(id: string): Promise<NovelStory | undefined>;
  createNovelStory(data: CreateNovelStoryRequest): Promise<NovelStory>;
  updateNovelStory(id: string, updates: UpdateNovelStoryRequest): Promise<NovelStory>;
  deleteNovelStory(id: string): Promise<void>;
  incrementNovelViewCount(slug: string): Promise<NovelStory>;

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
}

function mapId<T>(doc: any): T {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  return obj as T;
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

  // ── Novel Stories ──────────────────────────────────────────────────────────
  async getNovelStories(published?: boolean): Promise<NovelStory[]> {
    const query = published !== undefined ? { published } : {};
    const docs = await NovelStoryModel.find(query).sort({ createdAt: -1 });
    return docs.map((d: any) => mapId<NovelStory>(d));
  }

  async getNovelStory(slug: string): Promise<NovelStory | undefined> {
    const doc = await NovelStoryModel.findOne({ slug });
    return doc ? mapId<NovelStory>(doc) : undefined;
  }

  async getNovelStoryById(id: string): Promise<NovelStory | undefined> {
    const doc = await NovelStoryModel.findById(id);
    return doc ? mapId<NovelStory>(doc) : undefined;
  }

  async createNovelStory(data: CreateNovelStoryRequest): Promise<NovelStory> {
    const doc = await NovelStoryModel.create(data);
    return mapId<NovelStory>(doc);
  }

  async updateNovelStory(id: string, updates: UpdateNovelStoryRequest): Promise<NovelStory> {
    const doc = await NovelStoryModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    if (!doc) throw new Error('Story not found');
    return mapId<NovelStory>(doc);
  }

  async incrementNovelViewCount(slug: string): Promise<NovelStory> {
    const doc = await NovelStoryModel.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!doc) throw new Error('Story not found');
    return mapId<NovelStory>(doc);
  }

  async deleteNovelStory(id: string): Promise<void> {
    await NovelStoryModel.findByIdAndDelete(id);
    const seasons = await NovelSeasonModel.find({ storyId: id });
    for (const season of seasons) {
      await NovelChapterModel.deleteMany({ seasonId: season._id });
    }
    await NovelSeasonModel.deleteMany({ storyId: id });
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
    await NovelChapterModel.updateMany(
      { scheduledAt: { $lte: new Date() }, published: false },
      { $set: { published: true } }
    );
    const query: any = { seasonId };
    if (published !== undefined) query.published = published;
    const docs = await NovelChapterModel.find(query).sort({ chapterNumber: 1 });
    return docs.map((d: any) => ({
      ...mapId<NovelChapter>(d),
      storyId: d.storyId?.toString(),
      seasonId: d.seasonId?.toString(),
      scheduledAt: d.scheduledAt ?? null,
    }));
  }

  async getUpcomingChapters(seasonId: string) {
    const docs = await NovelChapterModel.find({
      seasonId,
      published: false,
      scheduledAt: { $gt: new Date() },
    }).sort({ chapterNumber: 1 }).select("chapterNumber title scheduledAt");
    return docs.map((d: any) => ({
      id: d._id.toString(),
      chapterNumber: d.chapterNumber,
      title: d.title,
      scheduledAt: d.scheduledAt ? (d.scheduledAt as Date).toISOString() : null,
    }));
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
    const doc = await NovelChapterModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    if (!doc) throw new Error('Chapter not found');
    return { ...mapId<NovelChapter>(doc), storyId: doc.storyId?.toString(), seasonId: doc.seasonId?.toString() };
  }

  async deleteNovelChapter(id: string): Promise<void> {
    await NovelChapterModel.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();
