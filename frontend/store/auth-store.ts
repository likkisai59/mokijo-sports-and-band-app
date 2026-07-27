/**
 * Zustand authentication state store.
 *
 * Token storage strategy (per MASTER.md section 9.7):
 *   - Access token: localStorage (readable by JS, works across tabs)
 *   - Access token cookie: document.cookie without Secure flag (so it works
 *     on http://localhost) — read by Next.js middleware to gate dashboard routes
 *   - Refresh token: handled server-side via httpOnly cookie set by backend
 */

import { User } from "@/types/auth";
import { removeCookie, setCookie } from "@/utils/storage";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

/**
 * Normalise the User object so that user.role is always a string.
 *
 * The backend /auth/me endpoint returns:
 *   { roles: [{ id, name, description, permissions }] }
 * with NO top-level `role` field.
 *
 * ProtectedRoute and Header check `user.role` (string).  Without this
 * normalisation, `user.role` is always `undefined`, causing ProtectedRoute to
 * treat every authenticated user as unauthorised and redirect to /login.
 */
function normaliseUserRole(user: User): User {
  if (user.role) {
    // Already has a flat role string (e.g. set directly by dev mode)
    return user;
  }
  if (user.roles && user.roles.length > 0) {
    // Derive from the roles array returned by the real backend
    return { ...user, role: user.roles[0].name };
  }
  return user;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, token) => {
    const normalisedUser = normaliseUserRole(user);
    if (typeof window !== "undefined") {
      // 1. Store in localStorage so the Axios request interceptor attaches the
      //    Bearer header automatically.
      localStorage.setItem("access_token", token);
      // 2. Mirror in a client-readable cookie (no Secure flag) so the Next.js
      //    edge middleware can read it and allow dashboard routes through.
      setCookie("access_token", token);
    }
    set({ user: normalisedUser, accessToken: token });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      removeCookie("access_token");
    }
    set({ user: null, accessToken: null });
  },
}));
