"use client";

import * as React from "react";
import { useRoles } from "@/hooks/use-roles";

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}) {
  const { hasRole, isLoading } = useRoles();

  if (isLoading) {
    return null;
  }

  const isAllowed = allowedRoles.some((role) => hasRole(role));

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
