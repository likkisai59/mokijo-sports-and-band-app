"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { getRoleDashboard } from "@/utils/role-routes";

/**
 * GuestRoute — prevents authenticated users from accessing auth pages (login, register).
 *
 * When an authenticated user visits an auth page, they are redirected to their
 * correct role overview dashboard using the centralized getRoleDashboard() resolver.
 */
export function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace(getRoleDashboard(user.role));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
