"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { Spinner } from "@/components/ui/spinner";
import { getRoleDashboard } from "@/utils/role-routes";
import { isBandAuthenticated, getBandUser } from "@/lib/bandAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const pathname = usePathname();
  const { user: sportsUser, isLoading: authLoading } = useAuth();
  const { isPreviewMode, previewRole, isHydrated: previewHydrated } = useDeveloperPreview();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  const [bandUser, setBandUser] = React.useState(null);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && isBandAuthenticated()) {
      setBandUser(getBandUser());
    }
  }, [pathname]);

  const isBandRoute =
    pathname?.startsWith("/band") ||
    pathname?.startsWith("/artist") ||
    pathname?.startsWith("/venue") ||
    pathname?.startsWith("/admin");

  const effectiveUser = isBandRoute ? (bandUser || sportsUser) : (sportsUser || bandUser);

  React.useEffect(() => {
    if (!mounted || !previewHydrated) return;

    if (isPreviewMode && previewRole) {
      if (allowedRoles && allowedRoles.includes(previewRole)) {
        return;
      }
      router.replace(getRoleDashboard(previewRole));
      return;
    }

    if (effectiveUser) {
      const userRole = effectiveUser.role ? String(effectiveUser.role).toLowerCase() : "";
      if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        router.replace(getRoleDashboard(userRole));
      }
      return;
    }

    // Only redirect to login when auth check is definitely complete and user is not authenticated
    if (!authLoading && !bandUser) {
      router.replace(isBandRoute ? "/band/login" : "/login");
    }
  }, [
    effectiveUser,
    mounted,
    previewHydrated,
    authLoading,
    bandUser,
    isPreviewMode,
    previewRole,
    allowedRoles,
    router,
    isBandRoute,
  ]);

  const isAuthorized = React.useMemo(() => {
    if (!mounted || !previewHydrated) return false;

    if (isPreviewMode && previewRole) {
      if (!allowedRoles) return true;
      return allowedRoles.includes(previewRole);
    }

    if (effectiveUser) {
      if (!allowedRoles) return true;
      const userRole = effectiveUser.role ? String(effectiveUser.role).toLowerCase() : "";
      return userRole && allowedRoles.includes(userRole);
    }

    return false;
  }, [mounted, previewHydrated, effectiveUser, isPreviewMode, previewRole, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
