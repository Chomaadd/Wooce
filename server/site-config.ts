import mongoose from 'mongoose';

const siteConfigSchema = new mongoose.Schema({
  googleClientId:     { type: String, default: '' },
  googleClientSecret: { type: String, default: '' },
  gmailUser:          { type: String, default: '' },
  gmailAppPassword:   { type: String, default: '' },
  siteUrl:            { type: String, default: '' },
  midtransServerKey:  { type: String, default: '' },
  midtransClientKey:  { type: String, default: '' },
  midtransIsProduction: { type: String, default: '' },
}, { timestamps: true });

export const SiteConfigModel =
  mongoose.models.SiteConfig ||
  mongoose.model('SiteConfig', siteConfigSchema);

let _cache: Record<string, string> | null = null;

export async function getSiteConfig(): Promise<Record<string, string>> {
  if (_cache) return _cache;
  let doc = await SiteConfigModel.findOne().lean<Record<string, string>>();
  if (!doc) {
    const created = await SiteConfigModel.create({});
    doc = created.toObject();
  }
  _cache = doc as Record<string, string>;
  return _cache;
}

export function invalidateConfigCache() {
  _cache = null;
}

export async function updateSiteConfig(data: {
  googleClientId?: string;
  googleClientSecret?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  siteUrl?: string;
  midtransServerKey?: string;
  midtransClientKey?: string;
  midtransIsProduction?: string;
}) {
  let doc = await SiteConfigModel.findOne();
  if (!doc) {
    doc = await SiteConfigModel.create(data);
  } else {
    Object.assign(doc, data);
    await doc.save();
  }
  _cache = null;
  return doc.toObject();
}

export async function getEffectiveConfig() {
  const db = await getSiteConfig();
  return {
    googleClientId:       (db.googleClientId     || process.env.GOOGLE_CLIENT_ID     || '').trim(),
    googleClientSecret:   (db.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    gmailUser:            (db.gmailUser          || process.env.GMAIL_USER          || '').trim(),
    gmailAppPassword:     (db.gmailAppPassword   || process.env.GMAIL_APP_PASSWORD  || '').trim(),
    siteUrl:              (db.siteUrl            || process.env.SITE_URL            || '').trim(),
    midtransServerKey:    (db.midtransServerKey  || process.env.MIDTRANS_SERVER_KEY || '').trim(),
    midtransClientKey:    (db.midtransClientKey  || process.env.MIDTRANS_CLIENT_KEY || '').trim(),
    midtransIsProduction: (db.midtransIsProduction || process.env.MIDTRANS_IS_PRODUCTION || '').trim(),
  };
}
