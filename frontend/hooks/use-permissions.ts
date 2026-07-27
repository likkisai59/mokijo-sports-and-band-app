"use client";

import { usePermissionContext } from "@/providers/permission-provider";

export function usePermissions() {
  const { permissions, hasPermission, isLoading } = usePermissionContext();
  return {
    permissions,
    hasPermission,
    isLoading,
  };
}
