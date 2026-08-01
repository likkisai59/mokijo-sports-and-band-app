"use client";

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
