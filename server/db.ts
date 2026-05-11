import mongoose from 'mongoose';
  import * as schema from '@shared/schema';
  import { log } from './logger';

  if (!process.env.MONGODB_URI && !process.env.MONGODB_URI_NEW) {
    console.warn("MONGODB_URI must be set in production.");
  }

  export async function connectToDatabase() {
    try {
      const uri = process.env.MONGODB_URI_NEW || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';
      await mongoose.connect(uri);
      log('Connected to MongoDB', 'mongodb');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  });

  const pageViewSchema = new mongoose.Schema({
    page: { type: String, required: true },
    userAgent: { type: String },
    referrer: { type: String },
  }, { timestamps: { createdAt: true, updatedAt: false } });

  const novelStorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    coverUrl: { type: String },
    description: { type: String },
    category: { type: String, default: 'novel' },
    status: { type: String, enum: ['ongoing', 'completed', 'hiatus'], default: 'ongoing' },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  }, { timestamps: true });

  const novelSeasonSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'NovelStory' },
    seasonNumber: { type: Number, required: true },
    title: { type: String, required: true },
  }, { timestamps: { createdAt: true, updatedAt: false } });

  const novelChapterSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'NovelStory' },
    seasonId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'NovelSeason' },
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    published: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
  }, { timestamps: true });

  export const AdminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
  export const PageViewModel = mongoose.models.PageView || mongoose.model('PageView', pageViewSchema);
  export const NovelStoryModel = mongoose.models.NovelStory || mongoose.model('NovelStory', novelStorySchema);
  export const NovelSeasonModel = mongoose.models.NovelSeason || mongoose.model('NovelSeason', novelSeasonSchema);
  export const NovelChapterModel = mongoose.models.NovelChapter || mongoose.model('NovelChapter', novelChapterSchema);

  const shortUrlSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    targetUrl: { type: String, required: true },
    title: { type: String },
    clicks: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
  }, { timestamps: { createdAt: true, updatedAt: false } });

  export const ShortUrlModel = mongoose.models.ShortUrl || mongoose.model('ShortUrl', shortUrlSchema);
  