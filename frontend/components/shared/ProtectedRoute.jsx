"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { Spinner } from "@/components/ui/spinner";
import { getRoleDashboard } from "@/utils/role-routes";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading: authLoading } = useAuth();
  const { isPreviewMode, previewRole, isHydrated: previewHydrated } = useDeveloperPreview();
  const router = useRouter();

  const isPending = authLoading || !previewHydrated;

  React.useEffect(() => {
    if (isPending) return;

    if (isPreviewMode && previewRole) {
      if (allowedRoles && allowedRoles.includes(previewRole)) {
        return;
      }
      router.replace(getRoleDashboard(previewRole));
      return;
    }

    if (user) {
      if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
        router.replace("/");
      }
      return;
    }

    router.replace("/login");
  }, [user, isPending, isPreviewMode, previewRole, allowedRoles, router]);

  const isAuthorized = React.useMemo(() => {
    if (isPending) return false;
    
    if (isPreviewMode && previewRole) {
      if (!allowedRoles) return true;
      return allowedRoles.includes(previewRole);
    }
    
    if (user) {
      if (!allowedRoles) return true;
      return user.role && allowedRoles.includes(user.role);
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
