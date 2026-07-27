"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ArtistRegisterPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/artist/profile");
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={["artist"]}>
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-sm text-text-secondary animate-pulse">Redirecting to artist profile setup...</p>
      </div>
    </ProtectedRoute>
  );
}
