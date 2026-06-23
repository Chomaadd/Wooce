import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { log } from "./logger";

export type AdminWsEvent =
  | { type: "payment_received";   orderId: string; coins: number; amount: number; userName: string }
  | { type: "payment_failed";     orderId: string; coins: number; reason: string }
  | { type: "writer_application"; userId: string;  userName: string; novelTitle: string }
  | { type: "report_submitted";   storyTitle: string; reportType: string }
  | { type: "contact_message";    name: string; subject?: string }
  | { type: "ping" };

const adminClients = new Set<WebSocket>();

export function initAdminWs(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/admin" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    adminClients.add(ws);
    log(`Admin WS client connected (total: ${adminClients.size})`, "ws");

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {}
    });

    ws.on("close", () => {
      adminClients.delete(ws);
      log(`Admin WS client disconnected (total: ${adminClients.size})`, "ws");
    });

    ws.on("error", () => {
      adminClients.delete(ws);
    });

    ws.send(JSON.stringify({ type: "connected" }));
  });

  log("Admin WebSocket server initialized at /ws/admin", "ws");
}

export function broadcastToAdmins(event: AdminWsEvent) {
  if (adminClients.size === 0) return;
  const payload = JSON.stringify(event);
  adminClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(payload); } catch {}
    }
  });
}
