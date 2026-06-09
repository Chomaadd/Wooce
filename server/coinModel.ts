import mongoose from "mongoose";

const chapterPremiumSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "NovelChapter", required: true, unique: true },
    storyId:   { type: mongoose.Schema.Types.ObjectId, ref: "NovelStory",   required: true },
    coinPrice: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

const coinTransactionSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount:      { type: Number, required: true },
    type:        { type: String, enum: ["topup", "unlock", "refund", "bonus"], required: true },
    description: { type: String, default: "" },
    chapterId:   { type: mongoose.Schema.Types.ObjectId, ref: "NovelChapter", default: null },
  },
  { timestamps: true },
);
coinTransactionSchema.index({ userId: 1, createdAt: -1 });

const unlockedChapterSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",         required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "NovelChapter", required: true },
    storyId:   { type: mongoose.Schema.Types.ObjectId, ref: "NovelStory",   required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
unlockedChapterSchema.index({ userId: 1, chapterId: 1 }, { unique: true });
unlockedChapterSchema.index({ userId: 1, storyId: 1 });

export const ChapterPremiumModel =
  mongoose.models.ChapterPremium || mongoose.model("ChapterPremium", chapterPremiumSchema);

export const CoinTransactionModel =
  mongoose.models.CoinTransaction || mongoose.model("CoinTransaction", coinTransactionSchema);

export const UnlockedChapterModel =
  mongoose.models.UnlockedChapter || mongoose.model("UnlockedChapter", unlockedChapterSchema);
