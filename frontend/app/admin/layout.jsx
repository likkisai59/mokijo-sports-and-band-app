"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function AdminRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout role="admin">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
