import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type AdminWsEvent =
  | { type: "connected" }
  | { type: "pong" }
  | { type: "payment_received"; orderId: string; coins: number; amount: number; userName: string }
  | { type: "payment_failed";   orderId: string; coins: number; reason: string }
  | { type: "writer_application"; userId: string; userName: string; novelTitle: string }
  | { type: "report_submitted"; storyTitle: string; reportType: string }
  | { type: "contact_message";  name: string; subject?: string };

export function useAdminWs(enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/admin`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25000);
    };

    ws.onmessage = (e) => {
      try {
        const event: AdminWsEvent = JSON.parse(e.data);
        handleEvent(event);
      } catch {}
    };

    ws.onclose = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(connect, 4000);
    };

    ws.onerror = () => ws.close();
  }, [enabled]);

  function handleEvent(event: AdminWsEvent) {
    switch (event.type) {
      case "payment_received":
        toast({
          title: "💰 Pembayaran Masuk!",
          description: `${event.userName} membeli ${event.coins} koin — ${formatRupiah(event.amount)}`,
        });
        break;
      case "payment_failed":
        toast({
          title: "❌ Pembayaran Gagal",
          description: `Order ${event.orderId.slice(-8)} gagal — ${event.coins} koin`,
          variant: "destructive",
        });
        break;
      case "writer_application":
        toast({
          title: "✍️ Pengajuan Penulis Baru",
          description: `${event.userName} mengajukan "${event.novelTitle}"`,
        });
        break;
      case "report_submitted":
        toast({
          title: "🚨 Laporan Konten Baru",
          description: `Laporan "${event.reportType}" pada "${event.storyTitle}"`,
          variant: "destructive",
        });
        break;
      case "contact_message":
        toast({
          title: "💬 Pesan Kontak Masuk",
          description: `Dari ${event.name}${event.subject ? `: ${event.subject}` : ""}`,
        });
        break;
    }
  }

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [enabled, connect]);
}
