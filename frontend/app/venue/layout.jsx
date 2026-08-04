"use client";

import * as React from "react";
import VenueSidebar from "@/components/venue-dashboard/VenueSidebar";
import VenueTopHeader from "@/components/venue-dashboard/VenueTopHeader";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import "../styles/venue-dashboard.css";

export default function VenueRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["venue_owner"]}>
      <div className="vd-root">
        <VenueTopHeader />
        <div className="vd-layout">
          <VenueSidebar />
          <main className="vd-main">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
