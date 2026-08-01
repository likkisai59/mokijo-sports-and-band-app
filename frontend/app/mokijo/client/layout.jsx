"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ClientLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout role="client">{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
