"use client";

import * as React from "react";
import { useRoles } from "@/hooks/use-roles";

interface RoleGuardProps {
  allowedRoles: ("client" | "artist" | "venue_owner" | "admin")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
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
