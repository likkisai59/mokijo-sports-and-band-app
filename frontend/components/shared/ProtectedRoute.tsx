"use client";

/**
 * ProtectedRoute — client-side authentication and RBAC guard.
 *
 * Waits for AuthProvider to finish hydrating (isLoading=false) and DeveloperPreviewProvider
 * to finish hydrating (isHydrated=true) before making any redirect decision.
 * This prevents hydration mismatches and premature redirects during SSR.
 */

// Cache-busting comment to force compilation refresh.
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { Spinner } from "@/components/ui/spinner";

import { getRoleDashboard } from "@/utils/role-routes";

type Role = "client" | "artist" | "venue_owner" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isPreviewMode, previewRole, isHydrated: previewHydrated } = useDeveloperPreview();
  const router = useRouter();

  // Combine loading states from both auth hydration and developer preview hydration
  const isPending = authLoading || !previewHydrated;

  React.useEffect(() => {
    if (isPending) return;

    // 1. If Developer Preview mode is enabled (isolated inspection)
    if (isPreviewMode && previewRole) {
      if (allowedRoles && allowedRoles.includes(previewRole as Role)) {
        return; // Authorized preview role
      }
      // Redirect mismatched preview roles to their resolved preview dashboard path
      router.replace(getRoleDashboard(previewRole));
      return;
    }

    // 2. If real authenticated session exists
    if (user) {
      if (allowedRoles && user.role && !allowedRoles.includes(user.role as Role)) {
        router.replace("/");
      }
      return;
    }

    // 3. Unauthenticated fallback
    router.replace("/login");
  }, [user, isPending, isPreviewMode, previewRole, allowedRoles, router]);

  const isAuthorized = React.useMemo(() => {
    if (isPending) return false;
    
    if (isPreviewMode && previewRole) {
      if (!allowedRoles) return true;
      return allowedRoles.includes(previewRole as Role);
    }
    
    if (user) {
      if (!allowedRoles) return true;
      return user.role && allowedRoles.includes(user.role as Role);
    }
    
    return false;
  }, [isPending, user, isPreviewMode, previewRole, allowedRoles]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
