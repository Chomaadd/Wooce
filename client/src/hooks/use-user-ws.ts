import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AppNotification } from "@shared/schema";

export function useUserWs(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const wsRef   = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!userId || !mountedRef.current) return;

    try {
      const res = await fetch("/api/ws-token", { credentials: "include" });
      if (!res.ok) return;
      const { token } = await res.json();

      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const host  = window.location.host;
      const ws    = new WebSocket(`${proto}://${host}/ws/user?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "new_notification" && msg.notification) {
            queryClient.setQueryData<AppNotification[]>(
              ["/api/notifications"],
              (prev = []) => [msg.notification, ...prev],
            );
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        retryRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (mountedRef.current) {
        retryRef.current = setTimeout(connect, 10_000);
      }
    }
  }, [userId, queryClient]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
}
