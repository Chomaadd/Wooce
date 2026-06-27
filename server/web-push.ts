import webpush from "web-push";
import mongoose from "mongoose";
import { PushSubscriptionModel } from "./pushSubscriptionModel";
import { log } from "./logger";

const vapidConfigSchema = new mongoose.Schema({
  publicKey:  { type: String, required: true },
  privateKey: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const VapidConfigModel =
  mongoose.models.VapidConfig ||
  mongoose.model("VapidConfig", vapidConfigSchema);

let _vapidPublic = "";
let _vapidPrivate = "";

export async function initWebPush() {
  try {
    let doc = await VapidConfigModel.findOne().lean<{ publicKey: string; privateKey: string }>();
    if (!doc) {
      const keys = webpush.generateVAPIDKeys();
      const created = await VapidConfigModel.create({ publicKey: keys.publicKey, privateKey: keys.privateKey });
      doc = created.toObject() as { publicKey: string; privateKey: string };
      log("Generated new VAPID keys", "push");
    }
    _vapidPublic  = doc.publicKey;
    _vapidPrivate = doc.privateKey;

    webpush.setVapidDetails(
      "mailto:support@woocenovel.my.id",
      _vapidPublic,
      _vapidPrivate,
    );
    log("Web Push initialized", "push");
  } catch (e) {
    log(`Web Push init error: ${e}`, "push");
  }
}

export function getVapidPublicKey() {
  return _vapidPublic;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!_vapidPublic || !_vapidPrivate) return;
  try {
    const subs = await PushSubscriptionModel.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    if (subs.length === 0) return;

    const data = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      url:   payload.url  ?? "/",
      icon:  payload.icon ?? "/image/icon-navbar.png",
      badge: payload.badge ?? "/image/favicon.png",
    });

    const stale: string[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
            data,
          );
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint);
          }
        }
      }),
    );

    if (stale.length > 0) {
      await PushSubscriptionModel.deleteMany({ endpoint: { $in: stale } });
    }
  } catch (e) {
    log(`sendPushToUser error: ${e}`, "push");
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  await Promise.all(userIds.map((uid) => sendPushToUser(uid, payload)));
}
