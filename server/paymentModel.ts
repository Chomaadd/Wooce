import mongoose from "mongoose";

const topupOrderSchema = new mongoose.Schema(
  {
    orderId:    { type: String, required: true, unique: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coins:      { type: Number, required: true },
    amount:     { type: Number, required: true },
    status:     { type: String, enum: ["pending", "paid", "failed", "expired"], default: "pending" },
    snapToken:  { type: String, default: null },
    packageId:  { type: String, default: null },
  },
  { timestamps: true },
);
topupOrderSchema.index({ userId: 1, createdAt: -1 });

export const TopupOrderModel =
  mongoose.models.TopupOrder || mongoose.model("TopupOrder", topupOrderSchema);

export const COIN_PACKAGES: Record<string, { coins: number; price: number; label: string }> = {
  pkg_10:  { coins: 10,  price: 5000,  label: "10 Koin" },
  pkg_30:  { coins: 30,  price: 12000, label: "30 Koin" },
  pkg_50:  { coins: 50,  price: 18000, label: "50 Koin" },
  pkg_100: { coins: 100, price: 30000, label: "100 Koin" },
};
