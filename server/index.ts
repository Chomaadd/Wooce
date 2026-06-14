import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { connectToDatabase } from "./db";
import { serveStatic } from "./static";
import { createServer } from "http";
import { log, colorMethod, colorStatus, clr } from "./logger";
import { NotificationModel } from "./notificationModel";
import { ContactMessageModel } from "./contactMessageModel";

export { log };

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Routes too noisy to log every hit
const SKIP_LOG_PATHS = new Set([
  "/api/analytics/pageview",
]);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    // Skip non-API paths, silenced routes, and 304 (not-modified — nothing changed)
    if (!path.startsWith("/api")) return;
    if (SKIP_LOG_PATHS.has(path)) return;
    if (res.statusCode === 304) return;

    const duration = Date.now() - start;
    const status   = colorStatus(res.statusCode);
    const method   = colorMethod(req.method);
    const durationStr = `${clr.dim}${duration}ms${clr.reset}`;
    log(`${method} ${path} ${status} ${durationStr}`);
  });

  next();
});

// Temporary healthcheck handler that responds 200 while app initializes
let appReady = false;
const healthcheckMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  if (!appReady && _req.path === "/") {
    return res.status(200).send("OK");
  }
  next();
};
app.use(healthcheckMiddleware);

// Start the server immediately so healthchecks work
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  },
);

// Initialize database and routes asynchronously after server starts
(async () => {
  try {
    await connectToDatabase();

    // Delete notifications older than 3 days on startup
    try {
      const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const { deletedCount } = await NotificationModel.deleteMany({ createdAt: { $lt: cutoff } });
      if (deletedCount > 0) log(`Cleaned up ${deletedCount} expired notifications`, "mongodb");
    } catch (e) {
      log(`Notification cleanup error: ${e}`, "mongodb");
    }

    // Delete contact messages older than 30 days on startup
    try {
      const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { deletedCount } = await ContactMessageModel.deleteMany({ createdAt: { $lt: cutoff30 } });
      if (deletedCount > 0) log(`Cleaned up ${deletedCount} old contact messages`, "mongodb");
    } catch (e) {
      log(`Contact message cleanup error: ${e}`, "mongodb");
    }

    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    appReady = true;
    log("Database and routes initialized successfully");
  } catch (error) {
    log(`Initialization error: ${error}`, "express");
    console.error("Failed to initialize application:", error);
  }
})();
