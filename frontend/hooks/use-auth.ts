"use client";

/**
 * useAuth — unified hook for authentication state.
 *
 * User data and the access token come from the Zustand store (persists across
 * renders without subscribing to the React Context re-render cycle).
 *
 * isLoading and logout come from AuthContext (AuthProvider manages the
 * session hydration lifecycle).
 */

import { useAuthContext } from "@/providers/auth-provider";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const context = useAuthContext();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    accessToken,
    isLoading: context.isLoading,
    logout: context.logout,
    setAuth,
    clearAuth,
  };
}
