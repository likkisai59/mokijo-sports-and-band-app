/**
 * Zustand authentication state store.
 *
 * Token storage strategy (per MASTER.md section 9.7):
 *   - Access token: localStorage (readable by JS, works across tabs)
 *   - Access token cookie: document.cookie without Secure flag (so it works
 *     on http://localhost) — read by Next.js middleware to gate dashboard routes
 *   - Refresh token: handled server-side via httpOnly cookie set by backend
 */

import { removeCookie, setCookie } from "@/utils/storage";
import { create } from "zustand";

/**
 * Normalise the User object so that user.role is always a string.
 */
function normaliseUserRole(user) {
  if (!user) return null;
  if (user.role) {
    return user;
  }
  if (user.roles && user.roles.length > 0) {
    return { ...user, role: user.roles[0].name };
  }
  return user;
}

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, token) => {
    const normalisedUser = normaliseUserRole(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
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
