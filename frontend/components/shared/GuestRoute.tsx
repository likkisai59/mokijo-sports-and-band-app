"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { getRoleDashboard } from "@/utils/role-routes";

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * GuestRoute — prevents authenticated users from accessing auth pages (login, register).
 *
 * When an authenticated user visits an auth page, they are redirected to their
 * correct role overview dashboard using the centralized getRoleDashboard() resolver.
 *
 * IMPORTANT: Must redirect to the role dashboard (not "/") to avoid racing with
 * the login page's own router.replace() call. Previously redirecting to "/" caused
 * GuestRoute to override the login page's destination redirect on successful login.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user) {
      // Redirect to the user's correct role dashboard — not just "/"
      // This avoids overriding the login page's own redirect on successful login.
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
