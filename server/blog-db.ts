import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true },
    slug:       { type: String, required: true, unique: true },
    content:    { type: String, default: "" },
    excerpt:    { type: String, default: "" },
    coverUrl:   { type: String, default: null },
    tags:       [{ type: String }],
    status:     { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt:{ type: Date, default: null },
    views:      { type: Number, default: 0 },
    authorName: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });

export const ArticleModel =
  mongoose.models.Article || mongoose.model("Article", articleSchema);
