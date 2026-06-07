import type { Express } from "express";
import type { Server } from "http";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { log } from "./logger";
import { getSiteConfig, updateSiteConfig, getEffectiveConfig, invalidateConfigCache } from "./site-config";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import {
  sendWriterPendingEmail,
  sendWriterApprovedEmail,
  sendWriterRejectedEmail,
  sendWriterSuspendedEmail,
  sendContactNotification,
  sendOtpEmail,
  sendAccountDeletedByAdminEmail,
  sendWriterAccountDeletedByAdminEmail,
  sendSelfDeleteConfirmedEmail,
  sendWriterSelfDeleteConfirmedEmail,
  sendStoryDeletedByWriterEmail,
  sendStoryRemovedByReportEmail,
} from "./email";
import { UserModel, NovelStoryModel, NovelSeasonModel, NovelChapterModel, VerificationRequestModel, AuthorModel } from "./db";
import { CharacterModel } from "./characterModel";
import { ReportModel } from "./reportModel";
import { generateOtp, verifyOtp, checkRateLimit } from "./otp";
import { generateWriterBackupPdf, generateStoryBackupPdf } from "./pdf";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    userId?: string;
    userRole?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ── Session store ─────────────────────────────────────────────────────────
  let store: session.Store;
  try {
    store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio",
      touchAfter: 24 * 3600,
    });
    log("Using MongoDB session store", "express");
  } catch {
    store = new session.MemoryStore();
    log("Falling back to MemoryStore", "express");
  }

  app.set("trust proxy", 1);

  app.use(session({
    store,
    secret: process.env.SESSION_SECRET || "wooce-novel-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireUser = (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Login diperlukan" });
    next();
  };

  // ── Passport / Google OAuth (dynamic — reads credentials from DB on each request) ──
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user ?? false);
    } catch (err) { done(err); }
  });

  async function registerGoogleStrategy(req?: any): Promise<string | null> {
    const config = await getEffectiveConfig();
    if (!config.googleClientId || !config.googleClientSecret) return null;

    let callbackURL: string;
    if (process.env.GOOGLE_CALLBACK_URL) {
      callbackURL = process.env.GOOGLE_CALLBACK_URL;
    } else if (config.siteUrl) {
      try {
        callbackURL = `${new URL(config.siteUrl).origin}/auth/google/callback`;
      } catch {
        callbackURL = `${config.siteUrl.replace(/\/+$/, "")}/auth/google/callback`;
      }
    } else if (req) {
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
      callbackURL = `${proto}://${host}/auth/google/callback`;
    } else {
      callbackURL = `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}/auth/google/callback`;
    }

    passport.use("google", new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL,
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"));

          const latestPhotoUrl = profile.photos?.[0]?.value ?? null;
          const latestName = profile.displayName || email.split("@")[0];

          let user = await storage.getUserByGoogleId(profile.id);
          if (!user) {
            user = await storage.getUserByEmail(email);
            if (user) {
              user = await storage.updateUser(user.id, {
                googleId: profile.id,
                photoUrl: latestPhotoUrl,
                name: latestName,
              });
            } else {
              user = await storage.createUser({
                googleId: profile.id,
                email,
                name: latestName,
                photoUrl: latestPhotoUrl,
                role: "reader",
                status: "active",
              });
            }
          } else {
            if (latestPhotoUrl && user.photoUrl !== latestPhotoUrl) {
              user = await storage.updateUser(user.id, { photoUrl: latestPhotoUrl, name: latestName });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    ));

    return callbackURL;
  }

  app.get("/auth/google", async (req: any, res: any, next: any) => {
    try {
      const callbackURL = await registerGoogleStrategy(req);
      if (!callbackURL) {
        return res.status(503).json({ message: "Google OAuth belum dikonfigurasi. Atur Client ID & Secret di admin panel." });
      }
      log(`Google OAuth callback URL: ${callbackURL}`, "express");
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    } catch (err) {
      next(err);
    }
  });

  app.get("/auth/google/callback", async (req: any, res: any, next: any) => {
    try {
      await registerGoogleStrategy(req);
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("[OAuth] Error:", err?.message || err);
          return res.redirect("/?auth=error");
        }
        if (!user) {
          console.error("[OAuth] No user returned. Info:", JSON.stringify(info));
          return res.redirect("/?auth=error");
        }
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.save((saveErr: any) => {
          if (saveErr) console.error("[OAuth] Session save error:", saveErr);
          if (user.role === "writer" && user.status === "pending") {
            return res.redirect("/?auth=pending");
          }
          res.redirect("/?auth=success");
        });
      })(req, res, next);
    } catch (err) {
      next(err);
    }
  });

  // ── File Upload (GridFS) ──────────────────────────────────────────────────
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  function getGridFSBucket() {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB not connected");
    return new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
  }

  const requireWriter = async (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Login diperlukan" });
    try {
      let user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(401).json({ message: "Login diperlukan" });
      // Auto-unsuspend: jika sudah >= 30 hari sejak suspend, otomatis aktifkan kembali
      if (user.status === "suspended") {
        const suspendedAt = (user as any).suspendedAt;
        if (suspendedAt) {
          const daysSince = (Date.now() - new Date(suspendedAt).getTime()) / 86400000;
          if (daysSince >= 30) {
            await storage.updateUser(user.id, { status: "active" });
            await UserModel.updateOne({ _id: user.id }, { $unset: { suspendedAt: 1 } });
            const refreshed = await storage.getUserById(user.id);
            if (refreshed) user = refreshed;
            log(`[Auto-unsuspend] Penulis ${user.email} aktif kembali setelah 30 hari`, "express");
          }
        }
      }
      if (user.role !== "writer" || user.status !== "active") {
        return res.status(403).json({ message: "Akses ditolak. Hanya penulis aktif yang dapat mengakses." });
      }
      req.writerUser = user;
      next();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  };

  const requireAuthOrWriter = (req: any, res: any, next: any) => {
    if (req.session.adminId || req.session.userId) return next();
    return res.status(401).json({ message: "Unauthorized" });
  };

  app.post("/api/upload", requireAuthOrWriter, upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const bucket = getGridFSBucket();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = `file-${uniqueSuffix}${ext}`;
      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
        uploadStream.end(req.file.buffer);
      });
      return res.json({ url: `/uploads/${filename}` });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Upload failed" });
    }
  });

  app.delete("/api/upload", requireAuthOrWriter, async (req: any, res: any) => {
    const url = ((req.query.url as string) || "").trim();
    if (!url.startsWith("/uploads/"))
      return res.status(400).json({ message: "Invalid URL" });
    const filename = url.slice("/uploads/".length);
    try {
      const bucket = getGridFSBucket();
      const files = await bucket.find({ filename }).toArray();
      if (files.length > 0) await bucket.delete(files[0]._id);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete upload error:", err);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  app.get("/uploads/:filename", async (req, res) => {
    const filename = req.params.filename;
    try {
      const bucket = getGridFSBucket();
      const files = await bucket.find({ filename }).toArray();
      if (files && files.length > 0) {
        const file = files[0];
        if (file.contentType) res.set("Content-Type", file.contentType);
        res.set("Cache-Control", "public, max-age=31536000");
        const downloadStream = bucket.openDownloadStreamByName(filename);
        downloadStream.on("error", (err) => {
          console.error("GridFS stream error:", err);
          if (!res.headersSent) res.status(500).json({ message: "Error streaming file" });
        });
        downloadStream.pipe(res);
        return;
      }
    } catch (err) {
      console.error("GridFS lookup error:", err);
    }
    const localPath = path.join(process.cwd(), "uploads", filename);
    if (fs.existsSync(localPath)) return res.sendFile(localPath);
    return res.status(404).json({ message: "File not found" });
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({ username: z.string(), password: z.string() }).parse(req.body);
      const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim();
      const adminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();
      if (username.trim().toLowerCase() !== adminUsername.toLowerCase() || password.trim() !== adminPassword) {
        log(`Login failed — username: ${username.trim()}`, "express");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.adminId = "1";
      await new Promise<void>((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
      res.json({ success: true, admin: { id: "1", username: adminUsername, name: "Admin", email: "" } });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ success: false });
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/admin/verify-password", requireAuth, async (req, res) => {
    try {
      const { password } = z.object({ password: z.string() }).parse(req.body);
      const credentialsSecret = process.env.CREDENTIALS_SECRET?.trim();
      if (!credentialsSecret) {
        return res.status(503).json({ message: "CREDENTIALS_SECRET belum diatur di environment. Hubungi administrator." });
      }
      if (password.trim() !== credentialsSecret) {
        return res.status(401).json({ message: "Sandi Kredensial salah" });
      }
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/config-status", requireAuth, async (_req, res) => {
    try {
      const effective = await getEffectiveConfig();
      res.json({
        oauthConfigured: !!(effective.googleClientId && effective.googleClientSecret),
        gmailConfigured: !!(effective.gmailUser && effective.gmailAppPassword),
      });
    } catch {
      res.status(500).json({ oauthConfigured: false, gmailConfigured: false });
    }
  });

  app.get("/api/admin/site-config", requireAuth, async (_req, res) => {
    try {
      const effective = await getEffectiveConfig();
      const db = await getSiteConfig();
      res.json({
        googleClientId:     { value: effective.googleClientId ? "***" + effective.googleClientId.slice(-4) : "", configured: !!effective.googleClientId, fromDb: !!(db as any).googleClientId },
        googleClientSecret: { value: effective.googleClientSecret ? "***" + effective.googleClientSecret.slice(-4) : "", configured: !!effective.googleClientSecret, fromDb: !!(db as any).googleClientSecret },
        gmailUser:          { value: effective.gmailUser, configured: !!effective.gmailUser, fromDb: !!(db as any).gmailUser },
        gmailAppPassword:   { value: effective.gmailAppPassword ? "***" + effective.gmailAppPassword.slice(-4) : "", configured: !!effective.gmailAppPassword, fromDb: !!(db as any).gmailAppPassword },
        siteUrl:            { value: effective.siteUrl, configured: !!effective.siteUrl, fromDb: !!(db as any).siteUrl },
      });
    } catch (err) {
      console.error("site-config GET error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/site-config", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        googleClientId:     z.string().optional(),
        googleClientSecret: z.string().optional(),
        gmailUser:          z.string().optional(),
        gmailAppPassword:   z.string().optional(),
        siteUrl:            z.string().optional(),
      });
      const data = schema.parse(req.body);
      await updateSiteConfig(data);
      invalidateConfigCache();

      const effective = await getEffectiveConfig();
      if (effective.googleClientId && effective.googleClientSecret) {
        try {
          const rawSiteUrl = effective.siteUrl ||
            (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
          let baseUrl: string;
          try { const parsed = new URL(rawSiteUrl); baseUrl = parsed.origin; } catch { baseUrl = rawSiteUrl.replace(/\/+$/, ""); }
          const callbackUrl = `${baseUrl}/auth/google/callback`;
          passport.use(new GoogleStrategy(
            { clientID: effective.googleClientId, clientSecret: effective.googleClientSecret, callbackURL: callbackUrl, proxy: true },
            async (_at, _rt, profile, done) => {
              try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("No email from Google"));
                const latestPhotoUrl = profile.photos?.[0]?.value ?? null;
                const latestName = profile.displayName || email.split("@")[0];
                let user = await storage.getUserByGoogleId(profile.id);
                if (!user) {
                  user = await storage.getUserByEmail(email);
                  if (user) { user = await storage.updateUser(user.id, { googleId: profile.id, photoUrl: latestPhotoUrl, name: latestName }); }
                  else { user = await storage.createUser({ googleId: profile.id, email, name: latestName, photoUrl: latestPhotoUrl, role: "reader", status: "active" }); }
                } else if (latestPhotoUrl && user.photoUrl !== latestPhotoUrl) {
                  user = await storage.updateUser(user.id, { photoUrl: latestPhotoUrl, name: latestName });
                }
                return done(null, user);
              } catch (err) { return done(err as Error); }
            }
          ));
          log("Google OAuth strategy refreshed with new credentials", "express");
        } catch (e) {
          console.error("Failed to refresh Google OAuth strategy:", e);
        }
      }

      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("site-config PUT error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/test-email", requireAuth, async (req, res) => {
    try {
      const { to } = z.object({ to: z.string().email() }).parse(req.body);
      const { sendTestEmail } = await import("./email");
      await sendTestEmail(to);
      res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("test-email error:", err);
      res.status(500).json({ message: err?.message || "Gagal kirim email. Periksa kembali konfigurasi Gmail." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (req.session.adminId) {
      const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim();
      return res.json({ id: "1", name: "Admin", username: adminUsername, isAdmin: true, role: "admin" });
    }
    if (req.session.userId) {
      try {
        const user = await storage.getUserById(req.session.userId);
        if (user) return res.json({ ...user, isAdmin: false });
      } catch {}
    }
    res.json(null);
  });

  app.get("/api/auth/admin-verify", (req, res) => {
    if (req.session.adminId) {
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      return res.json({ ok: true, name: "Admin", username: adminUsername, isAdmin: true });
    }
    res.status(401).json({ ok: false });
  });

  app.post("/api/auth/admin-logout", (req, res) => {
    delete req.session.adminId;
    req.session.save((err) => {
      if (err) console.error("Session save error (admin-logout):", err);
      res.json({ success: true });
    });
  });

  // ── User (self) ────────────────────────────────────────────────────────────
  app.patch("/api/auth/me", requireUser, async (req: any, res) => {
    try {
      const user = await storage.updateUser(req.session.userId, req.body);
      res.json(user);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/auth/request-writer", requireUser, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.role === "admin") return res.json({ message: "Anda adalah admin", user });

      if (user.status === "suspended") {
        const suspendedAt = (user as any).suspendedAt;
        if (suspendedAt) {
          const daysSince = (Date.now() - new Date(suspendedAt).getTime()) / 86400000;
          if (daysSince >= 30) {
            // Auto-unsuspend setelah 30 hari
            await storage.updateUser(user.id, { status: "active" });
            await UserModel.updateOne({ _id: user.id }, { $unset: { suspendedAt: 1 } });
            const refreshed = await storage.getUserById(user.id);
            if (refreshed) Object.assign(user, refreshed);
          } else {
            const daysLeft = Math.ceil(30 - daysSince);
            return res.status(403).json({ message: `Akunmu disuspend. Bisa daftar lagi dalam ${daysLeft} hari.`, cooldown: true, daysLeft, cooldownType: "suspended" });
          }
        }
      }

      const rejectedAt = (user as any).rejectedAt;
      if (rejectedAt) {
        const daysLeft = Math.ceil(7 - (Date.now() - new Date(rejectedAt).getTime()) / 86400000);
        if (daysLeft > 0) return res.status(403).json({ message: `Pengajuan ditolak. Bisa daftar lagi dalam ${daysLeft} hari.`, cooldown: true, daysLeft, cooldownType: "rejected" });
      }

      if (user.role === "writer" && user.status === "pending") return res.json({ message: "Sudah mengajukan", user });
      if (user.role === "writer" && user.status === "active") return res.json({ message: "Sudah menjadi penulis", user });

      const updated = await storage.updateUser(user.id, { role: "writer", status: "pending" });
      req.session.userRole = "writer";
      req.session.save((err: any) => { if (err) console.error("Session save error (request-writer):", err); });

      sendWriterPendingEmail(user.email, user.name).catch(console.error);
      storage.createNotification({ userId: user.id, type: "pending", title: "Pengajuan Sedang Ditinjau", message: "Permohonanmu untuk menjadi penulis sedang ditinjau oleh admin. Kami akan segera memberitahumu." }).catch(console.error);

      res.json({ success: true, user: updated });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Admin — User management ────────────────────────────────────────────────
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const { role, status } = req.query as { role?: string; status?: string };
      const users = await storage.getUsers(role, status);
      res.json(users);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const updated = await storage.updateUser(req.params.id, { status: "active" });
      sendWriterApprovedEmail(user.email, user.name).catch(console.error);
      storage.createNotification({ userId: user.id, type: "approved", title: "Pengajuan Diterima!", message: "Selamat! Permohonanmu untuk menjadi penulis telah disetujui. Sekarang kamu bisa mulai menulis di WOOCE Novel." }).catch(console.error);
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/reject", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await UserModel.updateOne({ _id: req.params.id }, { $set: { rejectedAt: new Date() } }, { strict: false });
      const updated = await storage.updateUser(req.params.id, { role: "reader", status: "active" });
      sendWriterRejectedEmail(user.email, user.name).catch(console.error);
      storage.createNotification({ userId: user.id, type: "rejected", title: "Pengajuan Tidak Disetujui", message: "Permohonanmu untuk menjadi penulis belum disetujui saat ini. Kamu bisa mencoba lagi dalam 7 hari." }).catch(console.error);
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/suspend", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      // Konten (story, author) TIDAK dihapus — hanya mark akun sebagai suspended
      await UserModel.updateOne({ _id: req.params.id }, { $set: { suspendedAt: new Date() } }, { strict: false });
      const updated = await storage.updateUser(req.params.id, { status: "suspended" });
      sendWriterSuspendedEmail(user.email, user.name).catch(console.error);
      storage.createNotification({ userId: user.id, type: "suspended", title: "Akun Disuspend", message: "Akunmu telah disuspend oleh admin. Cerita-ceritamu masih ada namun profilmu ditandai suspended." }).catch(console.error);
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/admin/users/pending-verification", requireAuth, async (_req, res) => {
    try {
      const users = await UserModel.find({ verificationStatus: "pending", role: "writer" }).lean();
      const requests = await VerificationRequestModel.find({
        userId: { $in: users.map((u: any) => u._id) },
        status: "pending",
      }).lean();
      const reqMap: Record<string, any> = {};
      for (const r of requests) reqMap[(r as any).userId.toString()] = r;
      const authorIds = users.map((u: any) => u.authorId).filter(Boolean);
      const authors = await AuthorModel.find({ _id: { $in: authorIds } }).lean();
      const authorMap: Record<string, any> = {};
      for (const a of authors) authorMap[(a as any)._id.toString()] = a;
      res.json(users.map((u: any) => ({
        ...u,
        id: u._id.toString(),
        authorId: u.authorId?.toString() ?? null,
        verificationRequest: reqMap[u._id.toString()] ?? null,
        authorProfile: u.authorId ? (authorMap[u.authorId.toString()] ?? null) : null,
      })));
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/verify", requireAuth, async (req, res) => {
    try {
      await UserModel.updateOne({ _id: req.params.id }, { $set: { verificationStatus: "verified" } });
      await VerificationRequestModel.updateOne({ userId: req.params.id, status: "pending" }, { $set: { status: "approved" } });
      storage.createNotification({
        userId: req.params.id,
        type: "approved",
        title: "Verifikasi Penulis Diterima!",
        message: "Selamat! Pengajuan verifikasi penulismu telah disetujui. Centang biru kini tampil di profilmu.",
      }).catch(console.error);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/reject-verification", requireAuth, async (req, res) => {
    try {
      await UserModel.updateOne(
        { _id: req.params.id },
        { $set: { verificationStatus: "none", verificationRejectedAt: new Date() } }
      );
      await VerificationRequestModel.updateOne({ userId: req.params.id, status: "pending" }, { $set: { status: "rejected" } });
      storage.createNotification({
        userId: req.params.id,
        type: "rejected",
        title: "Pengajuan Verifikasi Ditolak",
        message: "Pengajuan verifikasi penulismu belum memenuhi syarat saat ini. Kamu bisa mengajukan kembali setelah 30 hari.",
      }).catch(console.error);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/admin/users/:id/delete", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isWriter = user.role === "writer" && !!user.authorId;

      if (isWriter && user.authorId) {
        // Buat PDF backup semua cerita penulis sebelum hapus
        try {
          const stories = await storage.getNovelStoriesByAuthor(user.authorId);
          const storyDataList = await Promise.all(stories.map(async (story) => {
            const seasons = await storage.getNovelSeasons(story.id);
            const seasonDataList = await Promise.all(seasons.map(async (season) => {
              const chapters = await storage.getNovelChapters(season.id);
              return {
                seasonNumber: season.seasonNumber,
                title: season.title,
                chapters: chapters.map(ch => ({
                  chapterNumber: ch.chapterNumber,
                  title: ch.title,
                  content: ch.content ?? "",
                })),
              };
            }));
            return {
              title: story.title,
              category: story.category,
              status: story.status,
              synopsis: (story as any).synopsis ?? "",
              seasons: seasonDataList,
            };
          }));

          const pdfBuffer = await generateWriterBackupPdf({
            name: user.name,
            email: user.email,
            exportedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
            stories: storyDataList,
          });

          await sendWriterAccountDeletedByAdminEmail(user.email, user.name, pdfBuffer);

          // Hapus semua cerita beserta kontennya
          for (const story of stories) await storage.deleteNovelStory(story.id);
          await storage.deleteAuthor(user.authorId);
        } catch (e) { console.error("Writer delete error:", e); }
      } else {
        await sendAccountDeletedByAdminEmail(user.email, user.name);
      }

      await storage.deleteUser(user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("Admin delete user error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  app.get("/api/notifications", requireUser, async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId);
      res.json(notifications);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/notifications/read-all", requireUser, async (req: any, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Follow ────────────────────────────────────────────────────────────────
  app.post("/api/novel/stories/:id/follow", requireUser, async (req: any, res) => {
    try {
      await storage.followStory(req.session.userId, req.params.id);
      res.json({ following: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/novel/stories/:id/follow", requireUser, async (req: any, res) => {
    try {
      await storage.unfollowStory(req.session.userId, req.params.id);
      res.json({ following: false });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/:id/follow", requireUser, async (req: any, res) => {
    try {
      const following = await storage.isFollowing(req.session.userId, req.params.id);
      res.json({ following });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Followed Stories (current user) ──────────────────────────────────────
  app.get("/api/novel/me/followed", requireUser, async (req: any, res) => {
    try {
      const storyIds = await storage.getUserFollowedStoryIds(req.session.userId);
      if (!storyIds.length) return res.json([]);
      const stories = await Promise.all(
        storyIds.map(id => NovelStoryModel.findById(id).lean().catch(() => null))
      );
      const valid = stories.filter(Boolean).map((s: any) => ({
        id: s._id.toString(),
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl ?? null,
        category: s.category,
        status: s.status,
        tags: s.tags ?? [],
        published: s.published,
        viewCount: s.viewCount ?? 0,
      }));
      res.json(valid);
    } catch (err) {
      console.error("[followed] GET /api/novel/me/followed error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/novel/me/followed/all", requireUser, async (req: any, res) => {
    try {
      const count = await storage.unfollowAllStories(req.session.userId);
      res.json({ unfollowed: count });
    } catch (err) {
      console.error("[followed] DELETE /api/novel/me/followed/all error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Characters ────────────────────────────────────────────────────────────
  app.get("/api/novel/stories/:storyId/characters", async (req, res) => {
    try {
      const chars = await storage.getCharacters(req.params.storyId);
      res.json(chars);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/writer/stories/:storyId/characters", requireWriter, async (req: any, res) => {
    try {
      const { name, role, description, imageUrl, relations, order } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Nama karakter wajib diisi" });
      const story = await storage.getNovelStory(req.params.storyId);
      if (!story) return res.status(404).json({ message: "Story not found" });
      const char = await storage.createCharacter({ storyId: req.params.storyId, name: name.trim(), role, description, imageUrl, relations, order: order ?? 0 });
      res.json(char);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/writer/characters/:id", requireWriter, async (req: any, res) => {
    try {
      const updated = await storage.updateCharacter(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Character not found" });
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/characters/:id", requireWriter, async (req: any, res) => {
    try {
      await storage.deleteCharacter(req.params.id);
      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Admin Broadcast Notification ──────────────────────────────────────────
  app.post("/api/admin/broadcast-notification", requireAuth, async (_req, res) => {
    try {
      const { title, message, target } = _req.body as { title: string; message: string; target?: string };
      if (!title || !message) return res.status(400).json({ message: "title and message required" });
      let users;
      if (target === "writers") users = await storage.getUsers("writer");
      else if (target === "readers") users = await storage.getUsers("reader");
      else users = await storage.getUsers();
      await Promise.all(users.map((u: any) =>
        storage.createNotification({ userId: u.id, type: "announcement", title, message })
      ));
      res.json({ sent: users.length });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Settings (minimal — for SeoHead/frontend) ─────────────────────────────
  app.get("/api/settings", (_req, res) => {
    res.json({
      siteTitle: "WOOCE Novel",
      siteOwnerName: "WOOCE Novel",
      metaDescription: "Platform baca novel, komik, dan cerita pendek terbaik — WOOCE Novel.",
      metaKeywords: "WOOCE Novel, novel online, baca novel, komik, cerita pendek",
    });
  });

  // ── Sitemap ───────────────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req, res) => {
    const SITE_URL = "https://wooce.novel";
    const today = new Date().toISOString().split("T")[0];
    const makeUrl = (loc: string, lastmod: string, changefreq: string, priority: string) =>
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

    const staticEntries = [
      makeUrl(`${SITE_URL}/`, today, "weekly", "1.0"),
    ].join("\n");

    let novelEntries = "";
    try {
      const stories = await storage.getNovelStories(true);
      const lines: string[] = [];
      for (const story of stories) {
        lines.push(makeUrl(`${SITE_URL}/${story.slug}`, today, "weekly", "0.8"));
        const seasons = await storage.getNovelSeasons(story.id);
        for (const season of seasons) {
          const chapters = await storage.getNovelChapters(season.id, true);
          for (const chapter of chapters) {
            lines.push(makeUrl(`${SITE_URL}/${story.slug}/season-${season.seasonNumber}/bab-${chapter.chapterNumber}`, today, "monthly", "0.6"));
          }
        }
      }
      novelEntries = lines.join("\n");
    } catch { novelEntries = ""; }

    res.setHeader("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}\n${novelEntries}\n</urlset>`);
  });

  app.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(`User-agent: *\nAllow: /\n\nSitemap: https://wooce.novel/sitemap.xml\n`);
  });

  // ── Novel Stories ─────────────────────────────────────────────────────────
  app.get("/api/novel/stories", async (req, res) => {
    try {
      const stories = await storage.getNovelStories(true);
      const authorIds = Array.from(new Set(stories.map(s => s.authorId).filter(Boolean))) as string[];
      const authorsMap: Record<string, { name: string; slug: string }> = {};
      for (const aId of authorIds) {
        try { const a = await storage.getAuthorById(aId); if (a) authorsMap[a.id] = { name: a.name, slug: a.slug }; } catch {}
      }
      // Build verificationMap: authorId → verified boolean
      const verificationMap: Record<string, boolean> = {};
      if (authorIds.length) {
        const userDocs = await UserModel.find({ authorId: { $in: authorIds } }).lean() as any[];
        for (const u of userDocs) {
          if (u.authorId) verificationMap[u.authorId.toString()] = (u.verificationStatus === "verified");
        }
      }
      const storiesWithStats = await Promise.all(
        stories.map(async (story) => {
          const seasons = await storage.getNovelSeasons(story.id);
          let totalChapters = 0;
          let lastChapterAt: string | null = null;
          for (const season of seasons) {
            const chapters = await storage.getNovelChapters(season.id, true);
            totalChapters += chapters.length;
            for (const ch of chapters) {
              const chDate = ch.updatedAt ?? ch.createdAt;
              if (chDate) {
                const d = typeof chDate === "string" ? chDate : (chDate as Date).toISOString();
                if (!lastChapterAt || d > lastChapterAt) lastChapterAt = d;
              }
            }
          }
          const authorInfo = story.authorId ? (authorsMap[story.authorId] ?? null) : null;
          const authorVerified = story.authorId ? (verificationMap[story.authorId] ?? false) : false;
          return { ...story, totalChapters, lastChapterAt, authorName: authorInfo?.name ?? null, authorSlug: authorInfo?.slug ?? null, authorVerified };
        })
      );
      res.json(storiesWithStats);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/all", async (req, res) => {
    if (!req.session?.adminId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const stories = await storage.getNovelStories();
      const authorIds = Array.from(new Set(stories.map(s => s.authorId).filter(Boolean)));
      const authorMap: Record<string, string> = {};
      await Promise.all(authorIds.map(async id => {
        try {
          const a = await storage.getAuthorById(id!);
          if (a) authorMap[id!] = a.name;
        } catch {}
      }));
      const result = stories.map(s => ({
        ...s,
        authorName: s.authorId ? (authorMap[s.authorId] ?? null) : null,
      }));
      res.json(result);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/:slug", async (req, res) => {
    try {
      const story = await storage.getNovelStory(req.params.slug);
      if (!story) return res.status(404).json({ message: "Story not found" });
      let author = null;
      if (story.authorId) {
        try {
          const a = await storage.getAuthorById(story.authorId);
          if (a) {
            const userDoc = await UserModel.findOne({ authorId: story.authorId }).lean() as any;
            author = {
              ...a,
              verificationStatus: userDoc?.verificationStatus ?? "none",
              userStatus: userDoc?.status ?? "active",
            };
          }
        } catch {}
      }
      res.json({ ...story, author });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/novel/stories/:slug/view", async (req, res) => {
    try {
      const story = await storage.incrementNovelViewCount(req.params.slug);
      res.json({ viewCount: story.viewCount });
    } catch { res.status(404).json({ message: "Story not found" }); }
  });

  app.post("/api/novel/stories/:slug/rate", async (req, res) => {
    try {
      const { rating } = req.body;
      const r = Number(rating);
      if (!r || r < 1 || r > 5) return res.status(400).json({ message: "Rating harus 1-5" });
      const result = await storage.rateNovelStory(req.params.slug, r);
      res.json(result);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/novel/chapters/:id/view", async (req, res) => {
    try {
      await storage.incrementChapterViewCount(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/:storyId/seasons", async (req, res) => {
    try {
      const seasons = await storage.getNovelSeasons(req.params.storyId);
      res.json(seasons);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/:storyId/stats", async (req, res) => {
    try {
      const seasons = await storage.getNovelSeasons(req.params.storyId);
      let totalChapters = 0;
      for (const season of seasons) {
        const chapters = await storage.getNovelChapters(season.id, true);
        totalChapters += chapters.length;
      }
      res.json({ totalSeasons: seasons.length, totalChapters });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/novel/stories", requireAuth, async (req, res) => {
    try {
      const story = await storage.createNovelStory(req.body);
      res.status(201).json(story);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/novel/stories/:id", requireAuth, async (req, res) => {
    try {
      const story = await storage.updateNovelStory(req.params.id, req.body);
      res.json(story);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/novel/stories/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNovelStory(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Content Reports ────────────────────────────────────────────────────────
  app.post("/api/reports", async (req, res) => {
    try {
      const { storySlug, reason, details } = req.body;
      if (!storySlug || !reason) return res.status(400).json({ message: "storySlug and reason required" });
      const story = await NovelStoryModel.findOne({ slug: storySlug }).lean() as any;
      if (!story) return res.status(404).json({ message: "Story not found" });
      const userId = req.session.userId ?? null;
      if (userId) {
        const existing = await ReportModel.findOne({ storyId: story._id.toString(), reporterId: userId, status: "pending" });
        if (existing) return res.status(409).json({ message: "Already reported" });
      }
      let reporterName = "Anonim";
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user) reporterName = user.name;
      }
      const report = await ReportModel.create({
        storyId: story._id.toString(),
        storyTitle: story.title,
        storySlug: story.slug,
        storyAuthorId: story.authorId?.toString() ?? "",
        reporterId: userId,
        reporterName,
        reason,
        details: details ?? "",
      });
      res.status(201).json({ ...report.toObject(), id: report._id.toString() });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/admin/reports", requireAuth, async (_req, res) => {
    try {
      const reports = await ReportModel.find().sort({ createdAt: -1 }).lean();
      res.json(reports.map((r: any) => ({ ...r, id: r._id.toString() })));
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/reports/:id/approve", requireAuth, async (req, res) => {
    try {
      const report = await ReportModel.findById(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      if (report.status !== "pending") return res.status(400).json({ message: "Report already reviewed" });

      const story = await NovelStoryModel.findById(report.storyId).lean() as any;

      let writerEmail: string | null = null;
      let writerName = "Penulis";
      let writerId: string | null = null;
      if (story?.authorId) {
        const author = await AuthorModel.findById(story.authorId).lean() as any;
        if (author?.userId) {
          writerId = author.userId.toString();
          const user = await storage.getUserById(author.userId.toString());
          if (user) { writerEmail = user.email; writerName = user.name; }
        }
      }

      const reasonLabels: Record<string, string> = {
        plagiarism:   "Plagiarisme",
        adult_content:"Konten Dewasa Tanpa Label",
        hate_speech:  "Ujaran Kebencian / Diskriminasi",
        violence:     "Kekerasan Ekstrem",
        spam:         "Spam / Konten Tidak Relevan",
        other:        "Lainnya",
      };
      const reasonLabel = reasonLabels[report.reason] ?? report.reason;

      let pdfBuffer: Buffer | null = null;
      if (story) {
        try {
          const seasons = await NovelSeasonModel.find({ storyId: report.storyId }).sort({ seasonNumber: 1 }).lean() as any[];
          const seasonsData = await Promise.all(seasons.map(async (s: any) => {
            const chapters = await NovelChapterModel.find({ seasonId: s._id.toString() }).sort({ chapterNumber: 1 }).lean() as any[];
            return {
              seasonNumber: s.seasonNumber,
              title: s.title,
              chapters: chapters.map((c: any) => ({ chapterNumber: c.chapterNumber, title: c.title, content: c.content ?? "" })),
            };
          }));
          pdfBuffer = await generateStoryBackupPdf({
            storyTitle: story.title,
            category: story.category ?? "",
            status: story.status ?? "",
            synopsis: story.synopsis ?? "",
            writerName,
            writerEmail: writerEmail ?? "",
            exportedAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
            seasons: seasonsData,
          });
        } catch (e) { console.error("PDF generation failed:", e); }
      }

      if (story) await storage.deleteNovelStory(report.storyId);

      if (writerEmail && pdfBuffer) {
        sendStoryRemovedByReportEmail(writerEmail, writerName, report.storyTitle, reasonLabel, pdfBuffer).catch(console.error);
      }
      if (writerId) {
        storage.createNotification({
          userId: writerId,
          type: "story_removed" as any,
          title: "Ceritamu Dihapus",
          message: `Ceritamu "${report.storyTitle}" dihapus dari platform karena: ${reasonLabel}. File backup dikirim ke emailmu.`,
        }).catch(console.error);
      }

      await ReportModel.updateMany({ storyId: report.storyId, status: "pending" }, { $set: { status: "approved" } });
      res.json({ message: "Approved, story deleted" });
    } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/reports/:id/reject", requireAuth, async (req, res) => {
    try {
      const report = await ReportModel.findByIdAndUpdate(req.params.id, { $set: { status: "rejected" } }, { new: true });
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json({ ...report.toObject(), id: report._id.toString() });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Novel Seasons ─────────────────────────────────────────────────────────
  app.post("/api/novel/seasons", requireAuth, async (req, res) => {
    try {
      const season = await storage.createNovelSeason(req.body);
      res.status(201).json(season);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/novel/seasons/:id", requireAuth, async (req, res) => {
    try {
      const season = await storage.updateNovelSeason(req.params.id, req.body);
      res.json(season);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/novel/seasons/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNovelSeason(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Novel Chapters ────────────────────────────────────────────────────────
  app.get("/api/novel/seasons/:seasonId/chapters", async (req, res) => {
    try {
      const chapters = await storage.getNovelChapters(req.params.seasonId, true);
      res.json(chapters);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/seasons/:seasonId/upcoming", async (req, res) => {
    try {
      const chapters = await storage.getUpcomingChapters(req.params.seasonId);
      res.json(chapters);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/seasons/:seasonId/chapters/all", requireAuth, async (req, res) => {
    try {
      const chapters = await storage.getNovelChapters(req.params.seasonId);
      res.json(chapters);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/chapters/:id", async (req, res) => {
    try {
      const chapter = await storage.getNovelChapter(req.params.id);
      if (!chapter || !chapter.published) return res.status(404).json({ message: "Chapter not found" });
      res.json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/read/:slug/season-:seasonNum/bab-:chapterNum", async (req, res) => {
    try {
      const { slug, seasonNum, chapterNum } = req.params;
      const chapter = await storage.getNovelChapterByNumber(slug, seasonNum, Number(chapterNum));
      if (!chapter) return res.status(404).json({ message: "Chapter not found" });
      res.json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/novel/chapters", requireAuth, async (req, res) => {
    try {
      const chapter = await storage.createNovelChapter(req.body);
      res.status(201).json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/novel/chapters/:id", requireAuth, async (req, res) => {
    try {
      const chapter = await storage.updateNovelChapter(req.params.id, req.body);
      res.json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/novel/chapters/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNovelChapter(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Banner Slides ─────────────────────────────────────────────────────────
  app.get("/api/banners", async (_req, res) => {
    try {
      const banners = await storage.getBanners(true);
      res.json(banners);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/banners/all", requireAuth, async (_req, res) => {
    try {
      const banners = await storage.getBanners();
      res.json(banners);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/banners", requireAuth, async (req, res) => {
    try {
      const banner = await storage.createBanner(req.body);
      res.status(201).json(banner);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/banners/:id", requireAuth, async (req, res) => {
    try {
      const banner = await storage.updateBanner(req.params.id, req.body);
      res.json(banner);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/banners/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBanner(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/banners/reorder", requireAuth, async (req, res) => {
    try {
      const { ids } = req.body as { ids: string[] };
      if (!Array.isArray(ids)) return res.status(400).json({ message: "ids must be an array" });
      await storage.reorderBanners(ids);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Announcements ─────────────────────────────────────────────────────────
  app.get("/api/announcements", async (_req, res) => {
    try { res.json(await storage.getAnnouncements(true)); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.get("/api/announcements/all", requireAuth, async (_req, res) => {
    try { res.json(await storage.getAnnouncements()); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.post("/api/announcements", requireAuth, async (req, res) => {
    try { res.status(201).json(await storage.createAnnouncement(req.body)); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.put("/api/announcements/:id", requireAuth, async (req, res) => {
    try { res.json(await storage.updateAnnouncement(req.params.id, req.body)); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    try { await storage.deleteAnnouncement(req.params.id); res.status(204).send(); } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Authors ───────────────────────────────────────────────────────────────
  app.get("/api/authors", async (_req, res) => {
    try { res.json(await storage.getAuthors()); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.get("/api/authors/:slug", async (req, res) => {
    try {
      const author = await storage.getAuthorBySlug(req.params.slug);
      if (!author) return res.status(404).json({ message: "Author not found" });
      const allStories = await storage.getNovelStories(true);
      const stories = allStories.filter(s => s.authorId === author.id);
      // Cari user terkait untuk expose userStatus (suspended, active, dst.)
      const userDoc = await UserModel.findOne({ authorId: author.id }).lean() as any;
      const userStatus = userDoc?.status ?? "active";
      const verificationStatus = userDoc?.verificationStatus ?? "none";
      res.json({ ...author, stories, userStatus, verificationStatus });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.post("/api/authors", requireAuth, async (req, res) => {
    try { res.status(201).json(await storage.createAuthor(req.body)); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.put("/api/authors/:id", requireAuth, async (req, res) => {
    try { res.json(await storage.updateAuthor(req.params.id, req.body)); } catch { res.status(500).json({ message: "Internal server error" }); }
  });
  app.delete("/api/authors/:id", requireAuth, async (req, res) => {
    try { await storage.deleteAuthor(req.params.id); res.status(204).send(); } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Writer API ────────────────────────────────────────────────────────────
  async function ensureAuthorId(user: any): Promise<string | null> {
    if (!user.authorId) return null;
    const existing = await storage.getAuthorById(user.authorId);
    if (!existing) {
      await storage.updateUser(user.id, { authorId: null });
      return null;
    }
    return user.authorId;
  }

  app.post("/api/writer/setup-username", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      if (user.authorId) {
        const existing = await storage.getAuthorById(user.authorId);
        if (existing) return res.status(400).json({ message: "Username sudah diset sebelumnya" });
      }
      const { username } = z.object({ username: z.string().min(3).max(30) }).parse(req.body);
      const slug = username.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
      if (slug.length < 3) return res.status(400).json({ message: "Username minimal 3 karakter" });
      const taken = await storage.getAuthorBySlug(slug);
      if (taken) return res.status(409).json({ message: "Username sudah dipakai, coba yang lain" });
      const author = await storage.createAuthor({
        name: user.name || "Penulis", slug, bio: "", photoUrl: user.photoUrl ?? null,
        tiktok: null, instagram: null, facebook: null, twitter: null,
        website: null, saweria: null, trakteer: null, email: user.email,
      });
      await storage.updateUser(user.id, { authorId: author.id });
      res.json({ author });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Username tidak valid" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/writer/me", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      let author = null;
      if (authorId) {
        try { author = await storage.getAuthorById(authorId); } catch {}
      }
      res.json({ ...user, authorId, author });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/writer/stories", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.json([]);
      const stories = await storage.getNovelStoriesByAuthor(authorId);
      const storiesWithStats = await Promise.all(stories.map(async (story) => {
        const seasons = await storage.getNovelSeasons(story.id);
        let totalChapters = 0;
        for (const s of seasons) {
          const chs = await storage.getNovelChapters(s.id);
          totalChapters += chs.length;
        }
        return { ...story, totalChapters };
      }));
      res.json(storiesWithStats);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/writer/check-slug", requireWriter, async (req: any, res) => {
    try {
      const slug = String(req.query.slug || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
      if (!slug || slug.length < 3) return res.json({ available: false, reason: "Minimal 3 karakter" });
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      const existing = await storage.getAuthorBySlug(slug);
      const available = !existing || (authorId ? existing.id === authorId : false);
      res.json({ available, slug });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/writer/profile", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.status(400).json({ message: "Silakan set username terlebih dahulu", needsUsername: true });
      const allowed = ["name", "bio", "photoUrl", "tiktok", "instagram", "facebook", "twitter", "website", "saweria", "trakteer"];
      const updateData: Record<string, any> = {};
      for (const key of allowed) {
        if (key in req.body) updateData[key] = req.body[key] ?? null;
      }
      if (req.body.slug) {
        const newSlug = String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
        if (newSlug.length >= 3) {
          const existing = await storage.getAuthorBySlug(newSlug);
          if (existing && existing.id !== authorId) {
            return res.status(409).json({ message: "Username sudah dipakai" });
          }
          updateData.slug = newSlug;
        }
      }
      const updated = await storage.updateAuthor(authorId, updateData);
      if (updateData.name && typeof updateData.name === "string" && updateData.name.trim()) {
        try { await storage.updateUser(user.id, { name: updateData.name.trim() }); } catch (e) { console.error("updateUser name failed:", e); }
      }
      res.json(updated);
    } catch (err) {
      console.error("PATCH /api/writer/profile error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/writer/stories", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.status(400).json({ message: "Silakan set username terlebih dahulu", needsUsername: true });
      const story = await storage.createNovelStory({ ...req.body, authorId });
      res.status(201).json(story);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/writer/stories/:id", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.status(400).json({ message: "Silakan set username terlebih dahulu", needsUsername: true });
      const story = await storage.getNovelStoryById(req.params.id);
      if (!story) return res.status(404).json({ message: "Cerita tidak ditemukan" });
      if (story.authorId !== authorId) return res.status(403).json({ message: "Bukan cerita kamu" });
      const updated = await storage.updateNovelStory(req.params.id, req.body);
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/stories/:id", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.status(400).json({ message: "Silakan set username terlebih dahulu", needsUsername: true });
      const story = await storage.getNovelStoryById(req.params.id);
      if (!story) return res.status(404).json({ message: "Cerita tidak ditemukan" });
      if (story.authorId !== authorId) return res.status(403).json({ message: "Bukan cerita kamu" });

      // Kumpulkan data sebelum dihapus untuk backup PDF
      try {
        log(`[Backup] Mulai backup story "${story.title}" untuk ${user.email}`, "express");

        const seasons = await storage.getNovelSeasons(story.id);
        log(`[Backup] Ditemukan ${seasons.length} season`, "express");

        const seasonsWithChapters = await Promise.all(
          seasons.map(async (season) => {
            const chapters = await storage.getNovelChapters(season.id);
            return {
              seasonNumber: season.seasonNumber,
              title: season.title,
              chapters: chapters.map(ch => ({
                chapterNumber: ch.chapterNumber,
                title: ch.title,
                content: ch.content ?? "",
              })),
            };
          })
        );

        const totalChapters = seasonsWithChapters.reduce((a, s) => a + s.chapters.length, 0);
        log(`[Backup] Total chapter: ${totalChapters} — generating PDF...`, "express");

        const pdfBuffer = await generateStoryBackupPdf({
          storyTitle: story.title,
          category: story.category,
          status: story.status,
          synopsis: story.description ?? "",
          writerName: user.name || "Penulis",
          writerEmail: user.email || "",
          exportedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
          seasons: seasonsWithChapters,
        });

        log(`[Backup] PDF generated (${(pdfBuffer.length / 1024).toFixed(1)} KB) — mengirim email ke ${user.email}...`, "express");

        await sendStoryDeletedByWriterEmail(user.email, user.name || "Penulis", story.title, pdfBuffer);

        log(`[Backup] Email backup berhasil dikirim ke ${user.email}`, "express");
      } catch (backupErr: any) {
        log(`[Backup] GAGAL: ${backupErr?.message || backupErr}`, "express");
        console.error("[Backup] Stack:", backupErr);
      }

      await storage.deleteNovelStory(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/writer/seasons", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const story = await storage.getNovelStoryById(req.body.storyId);
      if (!story || story.authorId !== user.authorId) return res.status(403).json({ message: "Akses ditolak" });
      const season = await storage.createNovelSeason(req.body);
      res.status(201).json(season);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/writer/seasons/:id", requireWriter, async (req: any, res) => {
    try {
      const season = await storage.updateNovelSeason(req.params.id, req.body);
      res.json(season);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/seasons/:id", requireWriter, async (req: any, res) => {
    try {
      await storage.deleteNovelSeason(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/writer/seasons/:seasonId/chapters", requireWriter, async (req, res) => {
    try {
      const chapters = await storage.getNovelChapters(req.params.seasonId);
      res.json(chapters);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/writer/chapters", requireWriter, async (req: any, res) => {
    try {
      const chapter = await storage.createNovelChapter(req.body);
      res.status(201).json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/writer/chapters/:id", requireWriter, async (req: any, res) => {
    try {
      const existing = await storage.getNovelChapter(req.params.id);
      const chapter = await storage.updateNovelChapter(req.params.id, req.body);
      if (req.body.published === true && existing && !existing.published) {
        try {
          const storyId = (chapter as any).storyId?.toString?.() ?? String((chapter as any).storyId);
          const [followerIds, story] = await Promise.all([
            storage.getStoryFollowerIds(storyId),
            storage.getNovelStoryById(storyId),
          ]);
          if (story && followerIds.length > 0) {
            await Promise.all(followerIds.map((uid: string) =>
              storage.createNotification({
                userId: uid,
                type: "chapter_new",
                title: `Chapter baru — ${story.title}`,
                message: `Bab ${(chapter as any).chapterNumber}: ${(chapter as any).title} sudah tersedia!`,
              })
            ));
          }
        } catch (e) { console.error("Chapter notification error:", e); }
      }
      res.json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/chapters/:id", requireWriter, async (req: any, res) => {
    try {
      await storage.deleteNovelChapter(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/writer/stats", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      if (!authorId) return res.json({ totalViews: 0, totalStories: 0, totalChapters: 0, totalPublished: 0, topStories: [], topChapters: [] });
      const stories = await storage.getNovelStoriesByAuthor(authorId);
      const storyStats = await Promise.all(stories.map(async (story) => {
        const seasons = await storage.getNovelSeasons(story.id);
        let totalChapters = 0;
        let publishedChapters = 0;
        const chapterList: any[] = [];
        for (const season of seasons) {
          const chapters = await storage.getNovelChapters(season.id);
          totalChapters += chapters.length;
          publishedChapters += chapters.filter((c: any) => c.published).length;
          for (const ch of chapters) {
            chapterList.push({ ...ch, storyTitle: story.title, storySlug: story.slug });
          }
        }
        return { story: { ...story, totalChapters, publishedChapters }, chapters: chapterList };
      }));
      const totalViews = storyStats.reduce((acc, s) => acc + (s.story.viewCount || 0), 0);
      const totalChapters = storyStats.reduce((acc, s) => acc + s.story.totalChapters, 0);
      const totalPublished = storyStats.reduce((acc, s) => acc + s.story.publishedChapters, 0);
      const topStories = [...storyStats.map(s => s.story)].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
      const allChapters = storyStats.flatMap(s => s.chapters);
      const topChapters = [...allChapters].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);
      res.json({ totalViews, totalStories: stories.length, totalChapters, totalPublished, topStories, topChapters });
    } catch (err) {
      console.error("Writer stats error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Writer PDF Backup & Verification ─────────────────────────────────────
  app.get("/api/writer/stories/:id/backup-pdf", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const story = await storage.getNovelStoryById(req.params.id);
      if (!story) return res.status(404).json({ message: "Cerita tidak ditemukan" });
      const authorId = await ensureAuthorId(user);
      if (!authorId || story.authorId !== authorId) return res.status(403).json({ message: "Bukan cerita kamu" });
      const seasons = await storage.getNovelSeasons(story.id);
      const seasonsWithChapters = await Promise.all(
        seasons.map(async (season) => {
          const chapters = await storage.getNovelChapters(season.id);
          return {
            seasonNumber: season.seasonNumber,
            title: season.title,
            chapters: chapters.map(ch => ({ chapterNumber: ch.chapterNumber, title: ch.title, content: ch.content ?? "" })),
          };
        })
      );
      const pdfBuffer = await generateStoryBackupPdf({
        storyTitle: story.title,
        category: story.category,
        status: story.status,
        synopsis: story.description ?? "",
        writerName: user.name || "Penulis",
        writerEmail: user.email || "",
        exportedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        seasons: seasonsWithChapters,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${story.slug}-backup.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      log(`[PDF Download] Error: ${err?.message}`, "express");
      res.status(500).json({ message: "Gagal generate PDF" });
    }
  });

  app.post("/api/writer/request-verification", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const userDoc = await UserModel.findById(user.id).lean() as any;
      const currentStatus = userDoc?.verificationStatus ?? "none";

      if (currentStatus === "verified") return res.status(400).json({ message: "Kamu sudah terverifikasi" });
      if (currentStatus === "pending") return res.status(400).json({ message: "Permintaan verifikasi sedang diproses" });

      const verificationRejectedAt = userDoc?.verificationRejectedAt;
      if (verificationRejectedAt) {
        const daysSince = (Date.now() - new Date(verificationRejectedAt).getTime()) / 86400000;
        if (daysSince < 30) {
          const daysLeft = Math.ceil(30 - daysSince);
          return res.status(403).json({ message: `Pengajuan verifikasi ditolak. Bisa mengajukan lagi dalam ${daysLeft} hari.`, cooldown: true, daysLeft });
        }
      }

      const schema = z.object({
        novelTitle:    z.string().min(2, "Judul novel wajib diisi"),
        novelGenre:    z.string().min(1, "Genre wajib dipilih"),
        novelLink:     z.string().url("Link novel harus berupa URL yang valid"),
        totalChapters: z.coerce.number().min(1, "Jumlah chapter minimal 1"),
        synopsis:      z.string().min(50, "Sinopsis minimal 50 karakter"),
        reason:        z.string().min(30, "Alasan minimal 30 karakter"),
      });

      const body = schema.parse(req.body);

      await VerificationRequestModel.deleteMany({ userId: user.id });

      await VerificationRequestModel.create({
        userId: user.id,
        name: user.name,
        email: user.email,
        ...body,
        status: "pending",
      });

      await UserModel.updateOne({ _id: user.id }, { $set: { verificationStatus: "pending" } });
      res.json({ success: true, message: "Permintaan verifikasi telah dikirim. Admin akan meninjau pengajuanmu." });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Translation API ───────────────────────────────────────────────────────
  const LINGVA_INSTANCES = [
    "https://lingva.ml",
    "https://translate.plausibility.cloud",
    "https://lingva.tiekoetter.com",
  ];

  function splitSentences(text: string, maxLen = 450): string[] {
    if (text.length <= maxLen) return [text];
    const parts: string[] = [];
    let cur = "";
    for (const char of text) {
      cur += char;
      if (/[.!?。！？\n]/.test(char) && cur.length >= 80) {
        parts.push(cur.trim());
        cur = "";
      }
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts.filter(p => p.length > 0);
  }

  // MyMemory uses different language codes for some languages
  const MM_LANG: Record<string, string> = { zh: "zh-CN", "zh-CN": "zh-CN" };
  const mmLang = (l: string) => MM_LANG[l] ?? l;

  async function translateSegment(text: string, from: string, to: string): Promise<string> {
    if (!text.trim()) return text;

    // Split long texts into sentences to avoid URL/API length limits
    if (text.length > 450) {
      const sentences = splitSentences(text);
      const parts = await Promise.all(sentences.map(s => translateSegment(s, from, to)));
      return parts.join(" ");
    }

    const srcLang = !from || from === "auto" ? "id" : from;
    const mmSrc = mmLang(srcLang);
    const mmTo = mmLang(to);

    // ── Primary: MyMemory (fast, reliable for Indonesian) ──────────────────
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${mmSrc}|${mmTo}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (r.ok) {
        const d = await r.json() as any;
        if (d.responseStatus === 200) {
          const t: string = d.responseData?.translatedText ?? "";
          if (t && t !== "NO QUERY SPECIFIED" && t.toLowerCase() !== "quota exceeded") return t;
        }
      }
    } catch {}

    // ── Fallback: Lingva instances ─────────────────────────────────────────
    const lingvaSrc = !from || from === "auto" ? "auto" : from;
    for (const instance of LINGVA_INSTANCES) {
      try {
        const url = `${instance}/api/v1/${lingvaSrc}/${to}/${encodeURIComponent(text)}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!r.ok) continue;
        const d = await r.json() as any;
        if (d.translation) return d.translation;
      } catch {}
    }

    return text; // Return original only when all APIs fail
  }

  app.post("/api/translate", async (req, res) => {
    try {
      const { segments, from = "auto", to } = req.body as { segments: string[]; from?: string; to: string };
      if (!Array.isArray(segments) || !to) return res.status(400).json({ error: "Invalid request" });

      // Concurrency pool — max 10 simultaneous API calls to avoid rate limiting
      const results: string[] = new Array(segments.length);
      let cursor = 0;
      const worker = async () => {
        while (cursor < segments.length) {
          const i = cursor++;
          const seg = segments[i];
          results[i] = seg.trim() ? await translateSegment(seg.trim(), from, to) : seg;
        }
      };
      await Promise.all(Array.from({ length: Math.min(10, segments.length) }, () => worker()));

      res.json({ segments: results });
    } catch (err) {
      console.error("Translation error:", err);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // ── Admin Stats ───────────────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAuth, async (_req, res) => {
    try {
      const stories = await storage.getNovelStories();
      const storyStats = await Promise.all(stories.map(async (story) => {
        const seasons = await storage.getNovelSeasons(story.id);
        let totalChapters = 0;
        let lastChapterAt: string | null = null;
        for (const season of seasons) {
          const chapters = await storage.getNovelChapters(season.id);
          totalChapters += chapters.length;
          for (const ch of chapters) {
            const chDate = ch.updatedAt ?? ch.createdAt;
            if (chDate) {
              const d = typeof chDate === "string" ? chDate : (chDate as Date).toISOString();
              if (!lastChapterAt || d > lastChapterAt) lastChapterAt = d;
            }
          }
        }
        return { ...story, totalChapters, lastChapterAt };
      }));
      const totalViews = storyStats.reduce((acc, s) => acc + (s.viewCount || 0), 0);
      const totalChapters = storyStats.reduce((acc, s) => acc + s.totalChapters, 0);
      const totalFeatured = storyStats.filter(s => s.featured).length;
      const topStories = [...storyStats].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
      const topChapters = await storage.getTopChaptersByViews(10);
      const totalRatings = storyStats.reduce((acc, s) => acc + (s.ratingCount || 0), 0);
      const avgRating = totalRatings > 0
        ? storyStats.reduce((acc, s) => acc + (s.ratingSum || 0), 0) / totalRatings
        : 0;
      res.json({ totalViews, totalStories: stories.length, totalChapters, totalFeatured, topStories, topChapters, totalRatings, avgRating });
    } catch (err) {
      console.error("Stats error:", err);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ── Account Self-Delete (OTP Flow) ────────────────────────────────────────
  app.post("/api/auth/request-delete-otp", requireUser, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const rlKey = `otp:${user.id}`;
      const rl = checkRateLimit(rlKey, 3, 60 * 60 * 1000); // 3 per jam
      if (!rl.allowed) {
        return res.status(429).json({ message: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs });
      }

      const otp = generateOtp(user.email);
      await sendOtpEmail(user.email, user.name, otp);
      res.json({ ok: true });
    } catch (err) {
      console.error("OTP request error:", err);
      res.status(500).json({ message: "Gagal mengirim OTP" });
    }
  });

  app.post("/api/auth/confirm-delete", requireUser, async (req: any, res) => {
    try {
      const { otp } = req.body;
      if (!otp) return res.status(400).json({ message: "OTP diperlukan" });

      const user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = verifyOtp(user.email, otp);
      if (!valid) return res.status(400).json({ message: "Kode OTP tidak valid atau sudah kedaluwarsa" });

      const isWriter = user.role === "writer" && !!user.authorId;

      if (isWriter && user.authorId) {
        try {
          const stories = await storage.getNovelStoriesByAuthor(user.authorId);
          const storyDataList = await Promise.all(stories.map(async (story) => {
            const seasons = await storage.getNovelSeasons(story.id);
            const seasonDataList = await Promise.all(seasons.map(async (season) => {
              const chapters = await storage.getNovelChapters(season.id);
              return {
                seasonNumber: season.seasonNumber,
                title: season.title,
                chapters: chapters.map(ch => ({
                  chapterNumber: ch.chapterNumber,
                  title: ch.title,
                  content: ch.content ?? "",
                })),
              };
            }));
            return {
              title: story.title,
              category: story.category,
              status: story.status,
              synopsis: (story as any).synopsis ?? "",
              seasons: seasonDataList,
            };
          }));

          const pdfBuffer = await generateWriterBackupPdf({
            name: user.name,
            email: user.email,
            exportedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
            stories: storyDataList,
          });

          await sendWriterSelfDeleteConfirmedEmail(user.email, user.name, pdfBuffer);
          for (const story of stories) await storage.deleteNovelStory(story.id);
          await storage.deleteAuthor(user.authorId);
        } catch (e) { console.error("Self-delete writer cleanup error:", e); }
      } else {
        await sendSelfDeleteConfirmedEmail(user.email, user.name);
      }

      req.session.destroy(() => {});
      await storage.deleteUser(user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("Confirm delete error:", err);
      res.status(500).json({ message: "Gagal menghapus akun" });
    }
  });

  // ── Contact Form ─────────────────────────────────────────────────────────
  app.post("/api/contact", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const rl = checkRateLimit(`contact:${ip}`, 2, 60 * 60 * 1000); // 2 per jam per IP
      if (!rl.allowed) {
        return res.status(429).json({ message: "Terlalu banyak pesan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs });
      }

      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      await sendContactNotification({ name, email, subject, message });
      res.json({ ok: true });
    } catch (err) {
      console.error("Contact error:", err);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ── Social Bot OG Middleware ──────────────────────────────────────────────
  const SITE_NAME = "WOOCE Novel";
  const SITE_DESC = "Platform baca novel, komik, dan cerita pendek terbaik — WOOCE Novel.";
  const DEFAULT_OG_IMAGE_PATH = "/image/icon-navbar.png";

  const SOCIAL_BOTS = [
    "Discordbot", "WhatsApp", "TelegramBot", "facebookexternalhit",
    "Twitterbot", "LinkedInBot", "Slackbot", "Googlebot", "bingbot",
    "Applebot", "iframely", "Embedly",
  ];

  // Derive the real base URL from the incoming request (works in dev & prod)
  function getBotBaseUrl(req: any): string {
    if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const host  = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
    return `${proto}://${host}`;
  }

  // Make any URL absolute; relative paths get the base URL prepended
  function toAbsoluteUrl(base: string, url: string | null | undefined): string {
    if (!url) return `${base}${DEFAULT_OG_IMAGE_PATH}`;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Strip HTML tags and truncate for meta content
  function plainText(html: string | null | undefined, maxLen = 200): string {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, maxLen);
  }

  // Escape characters that would break HTML attribute values
  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const NON_STORY_SLUGS = new Set([
    "login", "admin", "writer", "register", "verify",
    "forgot-password", "reset-password", "profile", "notifications",
    "sitemap.xml", "robots.txt", "manifest.json", "sw.js",
  ]);

  app.use(async (req: any, res: any, next: any) => {
    // Only intercept GET requests for HTML pages
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    // Skip requests that have a file extension (images, scripts, fonts, etc.)
    if (/\.[a-z0-9]{1,10}$/i.test(req.path)) return next();

    const ua = req.headers["user-agent"] || "";
    const isSocialBot = SOCIAL_BOTS.some(bot => ua.toLowerCase().includes(bot.toLowerCase()));
    if (!isSocialBot) return next();

    const baseUrl = getBotBaseUrl(req);
    let title = SITE_NAME;
    let description = SITE_DESC;
    let ogImage = toAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH);
    let ogType = "website";

    try {
      const slugParts = req.path.replace(/^\//, "").split("/").filter(Boolean);
      const firstSlug = slugParts[0];
      if (firstSlug && !NON_STORY_SLUGS.has(firstSlug)) {
        const story = await storage.getNovelStory(firstSlug);
        if (story) {
          title = `${story.title} | ${SITE_NAME}`;
          const rawDesc = plainText(story.description);
          description = rawDesc || SITE_DESC;
          ogImage = toAbsoluteUrl(baseUrl, story.coverUrl || null);
          ogType = "article";
        }
      }
    } catch (_) {}

    const canonicalUrl = `${baseUrl}${req.path}`;
    const html = `<!DOCTYPE html><html lang="id"><head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:site_name" content="${esc(SITE_NAME)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(title)}">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:type" content="${ogType}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <link rel="canonical" href="${esc(canonicalUrl)}">
</head><body></body></html>`;

    return res.status(200).set("Content-Type", "text/html").end(html);
  });

  log("Database and routes initialized successfully", "express");

  return httpServer;
}
