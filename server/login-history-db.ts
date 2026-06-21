import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
  loginAt:   { type: Date, default: Date.now },
  ip:        { type: String, default: null },
  userAgent: { type: String, default: null },
  browser:   { type: String, default: "Unknown" },
  os:        { type: String, default: "Unknown" },
  device:    { type: String, default: "Desktop" },
  method:    { type: String, enum: ["google", "email", "other"], default: "google" },
}, { timestamps: false });

loginHistorySchema.index({ userId: 1, loginAt: -1 });

export const LoginHistoryModel =
  mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);

export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Desktop" };

  const device = /mobile|android|iphone|ipad|tablet/i.test(ua)
    ? (/tablet|ipad/i.test(ua) ? "Tablet" : "Mobile")
    : "Desktop";

  let browser = "Unknown";
  if (/edg\//i.test(ua))              browser = "Edge";
  else if (/opr\/|opera/i.test(ua))   browser = "Opera";
  else if (/chrome\/|crios\//i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/firefox\/|fxios\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/msie|trident/i.test(ua))  browser = "Internet Explorer";

  let os = "Unknown";
  if (/windows nt/i.test(ua))         os = "Windows";
  else if (/mac os x/i.test(ua) && !/iphone|ipad/i.test(ua)) os = "macOS";
  else if (/iphone/i.test(ua))        os = "iPhone";
  else if (/ipad/i.test(ua))          os = "iPad";
  else if (/android/i.test(ua))       os = "Android";
  else if (/linux/i.test(ua))         os = "Linux";

  return { browser, os, device };
}
