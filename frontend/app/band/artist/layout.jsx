"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ArtistRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["artist"]}>
      <DashboardLayout role="artist">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
