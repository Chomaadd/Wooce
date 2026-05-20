import mongoose from 'mongoose';
import { log } from './logger';

const authorMongoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  bio: { type: String, default: '' },
  photoUrl: { type: String, default: null },
  tiktok: { type: String, default: null },
  instagram: { type: String, default: null },
  facebook: { type: String, default: null },
  twitter: { type: String, default: null },
  website: { type: String, default: null },
  saweria: { type: String, default: null },
  trakteer: { type: String, default: null },
  email: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

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
  ratingSum: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  donationUrl: { type: String, default: null },
  authorId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Author' },
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
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

const bannerSlideMongoSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  link: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const announcementMongoSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  link: { type: String, default: null },
  linkText: { type: String, default: null },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

const userMongoSchema = new mongoose.Schema({
  googleId: { type: String, default: null, sparse: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photoUrl: { type: String, default: null },
  role: { type: String, enum: ['reader', 'writer', 'admin'], default: 'reader' },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  authorId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Author' },
  suspendedAt: { type: Date, default: null },
  verificationStatus: { type: String, enum: ['none', 'pending', 'verified'], default: 'none' },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AdminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const UserModel = mongoose.models.User || mongoose.model('User', userMongoSchema);
export const AuthorModel = mongoose.models.Author || mongoose.model('Author', authorMongoSchema);
export const NovelStoryModel = mongoose.models.NovelStory || mongoose.model('NovelStory', novelStorySchema);
export const NovelSeasonModel = mongoose.models.NovelSeason || mongoose.model('NovelSeason', novelSeasonSchema);
export const NovelChapterModel = mongoose.models.NovelChapter || mongoose.model('NovelChapter', novelChapterSchema);
export const BannerSlideModel = mongoose.models.BannerSlide || mongoose.model('BannerSlide', bannerSlideMongoSchema);
export const AnnouncementModel = mongoose.models.Announcement || mongoose.model('Announcement', announcementMongoSchema);
