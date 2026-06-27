import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";
import { log } from "./logger";

// Short-lived tokens: token → userId, expires in 60s
const wsTokens = new Map<string, { userId: string; expiresAt: number }>();

export function createUserWsToken(userId: string): string {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  wsTokens.set(token, { userId, expiresAt: Date.now() + 60_000 });
  setTimeout(() => wsTokens.delete(token), 65_000);
  return token;
}

// Active connections: userId → Set of WebSocket clients
const userClients = new Map<string, Set<WebSocket>>();

export function initUserWs(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, userId: string) => {
    if (!userClients.has(userId)) userClients.set(userId, new Set());
    userClients.get(userId)!.add(ws);
    log(`User WS connected: ${userId} (total connections: ${Array.from(userClients.values()).reduce((a, s) => a + s.size, 0)})`, "ws");

    ws.on("close", () => {
      userClients.get(userId)?.delete(ws);
      if (userClients.get(userId)?.size === 0) userClients.delete(userId);
    });

    ws.on("error", () => {
      userClients.get(userId)?.delete(ws);
    });

    ws.send(JSON.stringify({ type: "connected" }));
  });

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? "", "http://localhost");
    if (url.pathname !== "/ws/user") return;

    const token = url.searchParams.get("token") ?? "";
    const entry = wsTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wsTokens.delete(token);
    const userId = entry.userId;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, userId);
    });
  });

  log("User WebSocket server initialized at /ws/user", "ws");
}

export function pushNotificationToUser(userId: string, notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}) {
  const clients = userClients.get(userId);
  if (!clients || clients.size === 0) return;
  const payload = JSON.stringify({ type: "new_notification", notification });
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(payload); } catch {}
    }
  });
}
