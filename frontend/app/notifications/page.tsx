"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

export default function NotificationsRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const role = user.role;
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if (role === "artist") {
      router.replace("/artist/notifications");
    } else if (role === "venue_owner") {
      router.replace("/venue/notifications");
    } else {
      router.replace("/client/notifications");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-text-secondary animate-pulse">
        Loading notifications portal...
      </p>
    </div>
  );
}
