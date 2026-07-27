"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { useAuthContext } from "@/providers/auth-provider";

interface PermissionContextType {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const PermissionContext = React.createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  // Use stable selectors from Zustand store to prevent triggers on unrelated store edits
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { isLoading: authLoading } = useAuthContext();

  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Derive stable primitive values for the effect dependency array to avoid object reference changes
  const userId = user?.id;
  const userRolesStr = React.useMemo(() => {
    return JSON.stringify(user?.roles || []);
  }, [user?.roles]);

  React.useEffect(() => {
    if (authLoading) return;

    if (!accessToken || !userId) {
      setPermissions((prev) => (prev.length > 0 ? [] : prev));
      setRoles((prev) => (prev.length > 0 ? [] : prev));
      setIsLoading((prev) => (prev ? false : prev));
      return;
    }

    try {
      // Decode JWT access token claims client-side to read permissions payload list
      const base64Url = accessToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      
      const payload = JSON.parse(jsonPayload);
      const decodedPermissions = payload.permissions || [];
      const decodedRoles = user?.roles?.map((r: any) => r.name) || [payload.role].filter(Boolean);

      // Only perform React state updates if values are different to guarantee idempotency
      setPermissions((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(decodedPermissions)) return prev;
        return decodedPermissions;
      });
      setRoles((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(decodedRoles)) return prev;
        return decodedRoles;
      });
    } catch (error) {
      console.error("Failed to decode token permissions claim:", error);
      setPermissions((prev) => (prev.length > 0 ? [] : prev));
      setRoles((prev) => (prev.length > 0 ? [] : prev));
    } finally {
      setIsLoading((prev) => (prev ? false : prev));
    }
  }, [accessToken, userId, userRolesStr, authLoading]);

  const hasPermission = React.useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasRole = React.useCallback(
    (role: string) => {
      return roles.includes(role);
    },
    [roles]
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roles,
        hasPermission,
        hasRole,
        isLoading: authLoading || isLoading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = React.useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return context;
}
