import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    storyId:       { type: String, required: true },
    storyTitle:    { type: String, required: true },
    storySlug:     { type: String, required: true },
    storyAuthorId: { type: String, required: true },
    reporterId:    { type: String, default: null },
    reporterName:  { type: String, default: "Anonim" },
    reason: {
      type: String,
      enum: ["plagiarism", "adult_content", "hate_speech", "violence", "spam", "other"],
      required: true,
    },
    details: { type: String, default: "" },
    status:  { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const ReportModel = mongoose.model("ContentReport", reportSchema);
