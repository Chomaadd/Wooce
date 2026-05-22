import mongoose from "mongoose";

const characterSchema = new mongoose.Schema(
  {
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: "NovelStory", required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["protagonist", "antagonis", "pendukung", "lainnya"],
      default: "pendukung",
    },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    relations: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

characterSchema.index({ storyId: 1, order: 1 });

export const CharacterModel =
  mongoose.models.Character ||
  mongoose.model("Character", characterSchema);
