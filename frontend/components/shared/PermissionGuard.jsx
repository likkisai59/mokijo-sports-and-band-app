"use client";

import * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
