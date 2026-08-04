"use client";

import * as React from "react";
import ClientSidebar from "@/components/client-dashboard/ClientSidebar";
import ClientTopHeader from "@/components/client-dashboard/ClientTopHeader";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import "../../styles/client-dashboard.css";

export default function ClientRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="cd-root">
        <ClientTopHeader />
        <div className="cd-layout">
          <ClientSidebar />
          <main className="cd-main">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
