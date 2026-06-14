import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  ipAddress: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const ContactMessageModel =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);
