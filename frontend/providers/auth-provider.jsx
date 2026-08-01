"use client";

import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationsStore } from "@/features/notifications/store";
import { notificationWs } from "@/features/notifications/websocket";
import toast from "react-hot-toast";
import * as React from "react";

const AuthContext = React.createContext(null);

function isDevModeToken(token) {
  return token.startsWith("dev-") && token.split(".").length !== 3;
}

export function AuthProvider({ children }) {
  const { clearAuth, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      if (!token) {
        clearAuth();
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (isDevModeToken(token)) {
        clearAuth();
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const { success, data: userData } = response.data;
        if (success && userData) {
          setAuth(userData, token);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = React.useCallback(() => {
    clearAuth();
    window.location.href = "/";
  }, []);

  const { user, accessToken } = useAuthStore();
  const { addRealtimeNotification, setWsConnected } = useNotificationsStore();

  React.useEffect(() => {
    if (user && accessToken) {
      notificationWs.connect(accessToken);

      const unsubscribeStatus = notificationWs.onStatusChange((connected) => {
        setWsConnected(connected);
      });

      const unsubscribeNotif = notificationWs.onNotification((notification) => {
        addRealtimeNotification(notification);
        toast(
          (t) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[11px] text-text-primary">{notification.title}</span>
              <span className="text-[10px] text-text-secondary line-clamp-2">{notification.message}</span>
            </div>
          ),
          {
            icon: "🔔",
            duration: 5000,
          }
        );
      });

      return () => {
        unsubscribeStatus();
        unsubscribeNotif();
        notificationWs.disconnect();
      };
    } else {
      notificationWs.disconnect();
      setWsConnected(false);
    }
  }, [user, accessToken, addRealtimeNotification, setWsConnected]);

  return (
    <AuthContext.Provider value={{ isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
