"use client";

import * as React from "react";
import AdminSidebar from "@/components/admin-dashboard/AdminSidebar";
import AdminTopHeader from "@/components/admin-dashboard/AdminTopHeader";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import "../../../styles/admin-dashboard.css";

export default function AdminRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="ad-root">
        <AdminTopHeader />
        <div className="ad-layout">
          <AdminSidebar />
          <main className="ad-main">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
