import mongoose from "mongoose";

const SOURCE_URI = process.env.MONGODB_URI || "";
const TARGET_URI = process.env.MONGODB_URI_NEW || "";

if (!SOURCE_URI || !TARGET_URI) {
  console.error("❌ MONGODB_URI dan MONGODB_URI_NEW harus di-set!");
  process.exit(1);
}

if (SOURCE_URI === TARGET_URI) {
  console.error("❌ Source dan target URI sama! Batalkan.");
  process.exit(1);
}

const novelStorySchema = new mongoose.Schema({
  title: String, slug: String, coverUrl: String, description: String,
  category: { type: String, default: "novel" },
  status: { type: String, enum: ["ongoing", "completed", "hiatus"], default: "ongoing" },
  tags: [String], published: Boolean, featured: Boolean, viewCount: Number,
}, { timestamps: true });

const novelSeasonSchema = new mongoose.Schema({
  storyId: mongoose.Schema.Types.ObjectId,
  seasonNumber: Number, title: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

const novelChapterSchema = new mongoose.Schema({
  storyId: mongoose.Schema.Types.ObjectId,
  seasonId: mongoose.Schema.Types.ObjectId,
  chapterNumber: Number, title: String, content: String,
  published: Boolean, scheduledAt: Date,
}, { timestamps: true });

async function migrate() {
  console.log("🔗 Menghubungkan ke database sumber...");
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log("✅ Terhubung ke database sumber");

  console.log("🔗 Menghubungkan ke database target...");
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log("✅ Terhubung ke database target");

  const SourceStory   = sourceConn.model("NovelStory",   novelStorySchema);
  const SourceSeason  = sourceConn.model("NovelSeason",  novelSeasonSchema);
  const SourceChapter = sourceConn.model("NovelChapter", novelChapterSchema);

  const TargetStory   = targetConn.model("NovelStory",   novelStorySchema);
  const TargetSeason  = targetConn.model("NovelSeason",  novelSeasonSchema);
  const TargetChapter = targetConn.model("NovelChapter", novelChapterSchema);

  // ── Fetch all data from source ────────────────────────────────────────────
  const stories  = await SourceStory.find({}).lean();
  const seasons  = await SourceSeason.find({}).lean();
  const chapters = await SourceChapter.find({}).lean();

  console.log(`\n📊 Data ditemukan di sumber:`);
  console.log(`   • ${stories.length} novel/cerita`);
  console.log(`   • ${seasons.length} season`);
  console.log(`   • ${chapters.length} chapter`);

  if (stories.length === 0 && seasons.length === 0 && chapters.length === 0) {
    console.log("⚠️  Tidak ada data novel di database sumber. Selesai.");
    await sourceConn.close();
    await targetConn.close();
    return;
  }

  // ── Insert to target (skip duplicates by slug/existing _id) ──────────────
  console.log("\n📤 Memindahkan data ke database target...");

  let storyOk = 0, storySkip = 0;
  for (const doc of stories) {
    const exists = await TargetStory.findOne({ slug: (doc as any).slug });
    if (exists) { storySkip++; continue; }
    await TargetStory.create(doc);
    storyOk++;
  }
  console.log(`   ✅ Novel: ${storyOk} dipindah, ${storySkip} dilewati (sudah ada)`);

  let seasonOk = 0, seasonSkip = 0;
  for (const doc of seasons) {
    const exists = await TargetSeason.findById((doc as any)._id);
    if (exists) { seasonSkip++; continue; }
    await TargetSeason.create(doc);
    seasonOk++;
  }
  console.log(`   ✅ Season: ${seasonOk} dipindah, ${seasonSkip} dilewati (sudah ada)`);

  let chapterOk = 0, chapterSkip = 0;
  for (const doc of chapters) {
    const exists = await TargetChapter.findById((doc as any)._id);
    if (exists) { chapterSkip++; continue; }
    await TargetChapter.create(doc);
    chapterOk++;
  }
  console.log(`   ✅ Chapter: ${chapterOk} dipindah, ${chapterSkip} dilewati (sudah ada)`);

  // ── Verify count in target ────────────────────────────────────────────────
  console.log("\n🔍 Verifikasi di database target...");
  const tStories  = await TargetStory.countDocuments();
  const tSeasons  = await TargetSeason.countDocuments();
  const tChapters = await TargetChapter.countDocuments();
  console.log(`   • ${tStories} novel, ${tSeasons} season, ${tChapters} chapter`);

  // ── Delete from source ────────────────────────────────────────────────────
  console.log("\n🗑️  Menghapus data novel dari database sumber...");
  const delChapters = await SourceChapter.deleteMany({});
  const delSeasons  = await SourceSeason.deleteMany({});
  const delStories  = await SourceStory.deleteMany({});
  console.log(`   🗑️  Dihapus: ${delStories.deletedCount} novel, ${delSeasons.deletedCount} season, ${delChapters.deletedCount} chapter`);

  console.log("\n🎉 Migrasi selesai! Semua data novel sudah pindah ke database baru.");
  await sourceConn.close();
  await targetConn.close();
}

migrate().catch(err => {
  console.error("❌ Error saat migrasi:", err);
  process.exit(1);
});
