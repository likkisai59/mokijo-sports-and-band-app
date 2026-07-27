"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function VenueRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["venue_owner"]}>
      <DashboardLayout role="venue">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
