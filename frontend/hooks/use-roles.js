"use client";

import { usePermissionContext } from "@/providers/permission-provider";

export function useRoles() {
  const { roles, hasRole, isLoading } = usePermissionContext();
  return {
    roles,
    hasRole,
    isLoading,
  };
}
