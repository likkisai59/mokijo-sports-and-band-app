/**
 * NotificationWebSocket client
 * Manages secure WebSocket lifecycle, heartbeats, automatic reconnects
 */

const wsLogger = {
  log: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

class NotificationWebSocket {
  constructor() {
    this.ws = null;
    this.token = null;
    this.callbacks = new Set();
    this.messagingCallbacks = new Set();
    this.reconnectTimeout = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.isIntentionalDisconnect = false;
    this.connectionStatusCallbacks = new Set();
  }

  getWsUrl(token) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    return `${wsBase}/api/v1/ws/notifications?token=${encodeURIComponent(token)}`;
  }

  connect(token) {
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
        this.reconnectDelay = 1000;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "ping") {
            this.send({ type: "pong" });
          } else if (message.type === "notification" && message.data) {
            this.notifyCallbacks(message.data);
          } else if (message.type === "messaging" && message.data) {
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

  disconnect() {
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

  onNotification(callback) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  onMessagingEvent(callback) {
    this.messagingCallbacks.add(callback);
    return () => {
      this.messagingCallbacks.delete(callback);
    };
  }

  onStatusChange(callback) {
    this.connectionStatusCallbacks.add(callback);
    callback(this.isConnected());
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.token && !this.isIntentionalDisconnect) {
        wsLogger.log(`[WS] Reconnecting... Next attempt in ${this.reconnectDelay}ms`);
        this.connect(this.token);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    }, this.reconnectDelay);
  }

  notifyCallbacks(notification) {
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (err) {
        wsLogger.error("[WS] Error in notification callback:", err);
      }
    });
  }

  notifyMessagingCallbacks(message) {
    this.messagingCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (err) {
        wsLogger.error("[WS] Error in messaging callback:", err);
      }
    });
  }

  notifyStatus(connected) {
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
