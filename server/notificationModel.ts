import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:    { type: String, enum: ["pending", "approved", "rejected", "suspended", "announcement", "chapter_new", "story_removed", "report_rejected", "topup_success", "topup_failed"], required: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    read:    { type: Boolean, default: false },
    link:    { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 259200 });

export const NotificationModel = mongoose.model("Notification", notificationSchema);
