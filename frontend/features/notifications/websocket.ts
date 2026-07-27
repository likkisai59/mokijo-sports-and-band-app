/**
 * NotificationWebSocket client
 * Manages secure WebSocket lifecycle, heartbeats, automatic reconnects
 */

import { NotificationItem } from "./types";

type NotificationCallback = (notification: NotificationItem) => void;

const wsLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  }
};

class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private callbacks: Set<NotificationCallback> = new Set();
  private messagingCallbacks: Set<(message: any) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;
  private connectionStatusCallbacks: Set<(connected: boolean) => void> = new Set();

  constructor() {
    // Client-side singleton setup
  }

  private getWsUrl(token: string): string {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    // Replace http/https with ws/wss protocol
    const wsBase = apiBase.replace(/^http/, "ws");
    return `${wsBase}/api/v1/ws/notifications?token=${encodeURIComponent(token)}`;
  }

  public connect(token: string): void {
    if (typeof window === "undefined") return;

    this.token = token;
    this.isIntentionalDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      const url = this.getWsUrl(token);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        wsLogger.log("[WS] Connection established successfully.");
        this.reconnectDelay = 1000; // Reset reconnect delay on successful connection
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "ping") {
            // Heartbeat: Respond to server ping with pong keepalive
            this.send({ type: "pong" });
          } else if (message.type === "notification" && message.data) {
            // Realtime notification arrived!
            this.notifyCallbacks(message.data);
          } else if (message.type === "messaging" && message.data) {
            // Realtime messaging event arrived!
            this.notifyMessagingCallbacks(message);
          } else if (message.type === "connected") {
            wsLogger.log("[WS] Logged in user:", message.user_id);
          }
        } catch (err) {
          wsLogger.error("[WS] Failed to parse message:", err);
        }
      };

      this.ws.onerror = (error) => {
        wsLogger.error("[WS] Socket error:", error);
      };

      this.ws.onclose = (event) => {
        this.notifyStatus(false);
        if (!this.isIntentionalDisconnect) {
          wsLogger.warn(`[WS] Connection closed (code: ${event.code}). Attempting reconnect...`);
          this.scheduleReconnect();
        } else {
          wsLogger.log("[WS] Connection closed intentionally.");
        }
      };
    } catch (err) {
      wsLogger.error("[WS] Connection setup failed:", err);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.token = null;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }

  public onNotification(callback: NotificationCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public onMessagingEvent(callback: (message: any) => void): () => void {
    this.messagingCallbacks.add(callback);
    return () => {
      this.messagingCallbacks.delete(callback);
    };
  }

  public onStatusChange(callback: (connected: boolean) => void): () => void {
    this.connectionStatusCallbacks.add(callback);
    // Call immediately with current status
    callback(this.isConnected());
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.token && !this.isIntentionalDisconnect) {
        wsLogger.log(`[WS] Reconnecting... Next attempt in ${this.reconnectDelay}ms`);
        this.connect(this.token);
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    }, this.reconnectDelay);
  }

  private notifyCallbacks(notification: NotificationItem): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (err) {
        wsLogger.error("[WS] Error in notification callback:", err);
      }
    });
  }

  private notifyMessagingCallbacks(message: any): void {
    this.messagingCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (err) {
        wsLogger.error("[WS] Error in messaging callback:", err);
      }
    });
  }

  private notifyStatus(connected: boolean): void {
    this.connectionStatusCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (err) {
        wsLogger.error("[WS] Error in connection status callback:", err);
      }
    });
  }
}

export const notificationWs = new NotificationWebSocket();
