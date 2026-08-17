"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ClientRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout role="client">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
