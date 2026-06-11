import mongoose from "mongoose";

const loginBonusSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    lastClaimDate: { type: String, default: null }, // "YYYY-MM-DD"
    currentDay:    { type: Number, default: 0 },    // 1-7 (within cycle), 0 = never claimed
    totalStreak:   { type: Number, default: 0 },    // total consecutive days
    questsGranted: { type: [Number], default: [] }, // milestones already rewarded: [7, 14, 30]
  },
  { timestamps: true },
);

export const LoginBonusModel =
  mongoose.models.LoginBonus ||
  mongoose.model("LoginBonus", loginBonusSchema);

export const DAY_REWARDS = [1, 2, 3, 5, 7, 10, 20]; // index 0 = day 1

export const QUEST_MILESTONES = [
  { days: 7,  bonus: 10 },
  { days: 14, bonus: 25 },
  { days: 30, bonus: 50 },
];

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
