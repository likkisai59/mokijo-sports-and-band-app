"use client";

import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
