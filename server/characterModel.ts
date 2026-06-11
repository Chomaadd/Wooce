import mongoose from "mongoose";

const characterSchema = new mongoose.Schema(
  {
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: "NovelStory", required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["utama", "kedua", "pengantar", "antagonis", "pendukung", "figuran", "lainnya"],
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

export const CHARACTER_ROLE_LABELS: Record<string, string> = {
  utama:     "Tokoh Utama",
  kedua:     "Tokoh Kedua",
  pengantar: "Tokoh Pengantar",
  antagonis: "Antagonis",
  pendukung: "Pendukung",
  figuran:   "Figuran",
  lainnya:   "Lainnya",
};
