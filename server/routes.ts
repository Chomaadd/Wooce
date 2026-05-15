import type { Express } from "express";
import type { Server } from "http";
import session from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { log } from "./logger";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

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
  if (process.env.NODE_ENV === "production") {
    try {
      const connectMongo = require("connect-mongo");
      const MongoStore = connectMongo.default || connectMongo;
      store = new MongoStore({
        mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio",
        touchAfter: 24 * 3600,
      });
      log("Using MongoDB session store", "express");
    } catch {
      store = new session.MemoryStore();
    }
  } else {
    store = new session.MemoryStore();
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

  // ── Passport / Google OAuth ───────────────────────────────────────────────
  const CALLBACK_URL = process.env.NODE_ENV === "production"
    ? `https://${process.env.REPLIT_DEV_DOMAIN || ""}/auth/google/callback`
    : `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}/auth/google/callback`;

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: CALLBACK_URL,
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

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user ?? false);
    } catch (err) { done(err); }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?auth=error" }),
    (req: any, res) => {
      const user = req.user;
      if (user) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      if (user?.role === "writer" && user?.status === "pending") {
        return res.redirect("/?auth=pending");
      }
      res.redirect("/?auth=success");
    }
  );

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
      const user = await storage.getUserById(req.session.userId);
      if (!user || user.role !== "writer" || user.status !== "active") {
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
      if (username.trim() !== adminUsername || password.trim() !== adminPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.adminId = "1";
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

  app.get("/api/auth/me", async (req, res) => {
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
    res.json({ success: true });
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
      if (user.role === "writer") return res.json({ message: "Sudah menjadi penulis", user });
      if (user.role === "admin") return res.json({ message: "Anda adalah admin", user });
      const updated = await storage.updateUser(user.id, { role: "writer", status: "pending" });
      req.session.userRole = "writer";
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
      let authorId = user.authorId;
      if (!authorId) {
        const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        const author = await storage.createAuthor({
          name: user.name, slug, bio: "", photoUrl: user.photoUrl ?? null,
          tiktok: null, instagram: null, facebook: null, twitter: null,
          website: null, saweria: null, trakteer: null, email: user.email,
        });
        authorId = author.id;
      }
      const updated = await storage.updateUser(req.params.id, { status: "active", authorId });
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/reject", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { role: "reader", status: "active" });
      res.json(user);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.patch("/api/admin/users/:id/suspend", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { status: "suspended" });
      res.json(user);
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
          return { ...story, totalChapters, lastChapterAt };
        })
      );
      res.json(storiesWithStats);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/all", async (req, res) => {
    if (!req.session?.adminId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const stories = await storage.getNovelStories();
      res.json(stories);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/novel/stories/:slug", async (req, res) => {
    try {
      const story = await storage.getNovelStory(req.params.slug);
      if (!story) return res.status(404).json({ message: "Story not found" });
      let author = null;
      if (story.authorId) {
        try { author = await storage.getAuthorById(story.authorId); } catch {}
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
      res.json({ seasonCount: seasons.length, chapterCount: totalChapters });
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
      res.json({ ...author, stories });
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
  async function ensureAuthorId(user: any): Promise<string> {
    if (user.authorId) return user.authorId;
    const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const author = await storage.createAuthor({
      name: user.name, slug, bio: "", photoUrl: user.photoUrl ?? null,
      tiktok: null, instagram: null, facebook: null, twitter: null,
      website: null, saweria: null, trakteer: null, email: user.email,
    });
    await storage.updateUser(user.id, { authorId: author.id });
    return author.id;
  }

  app.get("/api/writer/me", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      let author = null;
      try { author = await storage.getAuthorById(authorId); } catch {}
      res.json({ ...user, authorId, author });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get("/api/writer/stories", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
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

  app.patch("/api/writer/profile", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      const allowed = ["name", "bio", "photoUrl", "tiktok", "instagram", "facebook", "twitter", "website", "saweria", "trakteer"];
      const updateData: Record<string, any> = {};
      for (const key of allowed) {
        if (key in req.body) updateData[key] = req.body[key] ?? null;
      }
      const updated = await storage.updateAuthor(authorId, updateData);
      if (updateData.name) await storage.updateUser(user.id, { name: updateData.name });
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/writer/stories", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const authorId = await ensureAuthorId(user);
      const story = await storage.createNovelStory({ ...req.body, authorId });
      res.status(201).json(story);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.put("/api/writer/stories/:id", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const story = await storage.getNovelStoryById(req.params.id);
      if (!story) return res.status(404).json({ message: "Cerita tidak ditemukan" });
      if (story.authorId !== user.authorId) return res.status(403).json({ message: "Bukan cerita kamu" });
      const updated = await storage.updateNovelStory(req.params.id, req.body);
      res.json(updated);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/stories/:id", requireWriter, async (req: any, res) => {
    try {
      const user = req.writerUser;
      const story = await storage.getNovelStoryById(req.params.id);
      if (!story) return res.status(404).json({ message: "Cerita tidak ditemukan" });
      if (story.authorId !== user.authorId) return res.status(403).json({ message: "Bukan cerita kamu" });
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
      const chapter = await storage.updateNovelChapter(req.params.id, req.body);
      res.json(chapter);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/writer/chapters/:id", requireWriter, async (req: any, res) => {
    try {
      await storage.deleteNovelChapter(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // ── Translation API ───────────────────────────────────────────────────────
  const LINGVA_INSTANCES = [
    "https://lingva.ml",
    "https://translate.plausibility.cloud",
    "https://lingva.tiekoetter.com",
  ];

  async function lingvaTranslate(text: string, from: string, to: string): Promise<string> {
    const srcLang = !from || from === "auto" ? "auto" : from;
    for (const instance of LINGVA_INSTANCES) {
      try {
        const url = `${instance}/api/v1/${srcLang}/${to}/${encodeURIComponent(text)}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const d = await r.json() as any;
        if (d.translation && d.translation !== text) return d.translation;
      } catch {}
    }
    return text;
  }

  app.post("/api/translate", async (req, res) => {
    try {
      const { segments, from = "auto", to } = req.body as { segments: string[]; from?: string; to: string };
      if (!Array.isArray(segments) || !to) return res.status(400).json({ error: "Invalid request" });
      const translated = await Promise.all(
        segments.map(seg => seg.trim() ? lingvaTranslate(seg.trim(), from, to) : Promise.resolve(seg))
      );
      res.json({ segments: translated });
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

  // ── Social Bot OG Middleware ──────────────────────────────────────────────
  const SITE_URL = "https://wooce.novel";
  const SITE_NAME = "WOOCE Novel";
  const SITE_DESC = "Platform baca novel, komik, dan cerita pendek terbaik — WOOCE Novel.";

  const SOCIAL_BOTS = ["WhatsApp", "TelegramBot", "facebookexternalhit", "Twitterbot", "LinkedInBot", "Slackbot", "Discordbot", "google", "bingbot"];

  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    const ua = req.headers["user-agent"] || "";
    const isBot = SOCIAL_BOTS.some(bot => ua.toLowerCase().includes(bot.toLowerCase()));
    if (!isBot) return next();

    let title = SITE_NAME;
    let description = SITE_DESC;

    try {
      const slugParts = req.path.replace(/^\//, "").split("/");
      if (slugParts.length === 1 && slugParts[0]) {
        const story = await storage.getNovelStory(slugParts[0]);
        if (story) {
          title = `${story.title} | ${SITE_NAME}`;
          description = story.description || SITE_DESC;
        }
      }
    } catch {}

    const canonicalUrl = `${SITE_URL}${req.path}`;
    const html = `<!DOCTYPE html><html lang="id"><head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
</head><body></body></html>`;

    return res.status(200).set("Content-Type", "text/html").end(html);
  });

  log("Database and routes initialized successfully", "express");

  return httpServer;
}
