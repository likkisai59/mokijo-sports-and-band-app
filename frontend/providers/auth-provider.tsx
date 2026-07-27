"use client";

/**
 * AuthProvider — session hydration and auth context.
 *
 * On every page load this component:
 *   1. Reads the stored access_token from localStorage
 *   2. If none found → sets isLoading=false; ProtectedRoute redirects
 *   3. If token is a dev-mode fake token → skips /auth/me call (fake tokens
 *      are not real JWTs; the backend returns 401 for them)
 *   4. If token is a real JWT → calls /auth/me to restore the user session
 *   5. Sets isLoading=false so ProtectedRoute can make a redirect decision
 *
 * IMPORTANT: isLoading must be false before ProtectedRoute evaluates auth.
 * The redirect-to-/login in ProtectedRoute fires inside a useEffect that is
 * gated on `!isLoading`. This prevents premature redirects during hydration.
 */

import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationsStore } from "@/features/notifications/store";
import { notificationWs } from "@/features/notifications/websocket";
import toast from "react-hot-toast";
import * as React from "react";

interface AuthContextType {
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

/**
 * Developer-mode tokens are in the format "dev-<role>-<uuid>".
 * Real JWTs have exactly two dots (three base64url segments).
 * We detect dev tokens by the absence of dots to avoid sending them to the
 * backend, which would always return 401 and wipe the dev session.
 */
function isDevModeToken(token: string): boolean {
  return token.startsWith("dev-") && token.split(".").length !== 3;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
        // No stored token — user is not authenticated
        clearAuth();
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (isDevModeToken(token)) {
        // Developer mode fake token — do NOT call /auth/me
        // The dev session is set in-memory by the developer page for the
        // current tab. On a page refresh the Zustand store resets to null,
        // so there is no user to restore and we must clear the stale token.
        clearAuth();
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Real JWT — validate against backend and restore the user session
      try {
        const response = await api.get("/auth/me");
        const { success, data: userData } = response.data;
        if (success && userData) {
          setAuth(userData, token);
        } else {
          clearAuth();
        }
      } catch {
        // Token expired or invalid — clear silently.
        // ProtectedRoute will redirect after isLoading becomes false.
        clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
    // Stable store references — intentionally omitted from deps to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = React.useCallback(() => {
    clearAuth();
    window.location.href = "/";
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
