"use client";

import * as React from "react";
import VenueSidebar from "@/components/venue-dashboard/VenueSidebar";
import VenueTopHeader from "@/components/venue-dashboard/VenueTopHeader";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { venueService } from "@/services/venueService";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import "../styles/venue-dashboard.css";

function VenueOnboardingGuard({ children }) {
  const [checking, setChecking] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    async function checkVenue() {
      try {
        await venueService.getProfile();
        setChecking(false);
      } catch (err) {
        if (err?.response?.status === 404 && pathname !== "/venue/profile") {
          router.replace("/venue/profile");
        } else {
          setChecking(false);
        }
      }
    }
    checkVenue();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Checking venue profile...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function VenueRouteLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["venue_owner"]}>
      <VenueOnboardingGuard>
        <div className="vd-root">
          <VenueTopHeader />
          <div className="vd-layout">
            <VenueSidebar />
            <main className="vd-main">
              {children}
            </main>
          </div>
        </div>
      </VenueOnboardingGuard>
    </ProtectedRoute>
  );
}
