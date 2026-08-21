"use client";

import * as React from "react";
import BandNavbar from "@/components/band/BandNavbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import "@/app/band/styles/band.css";

export function DashboardLayout({ children, role }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f7f8", color: "#0a0a0f", width: "100%" }}>
      {/* ── Unified BandConnect Top Navbar across ALL Dashboards ── */}
      <BandNavbar />

      {/* ── Fixed Left Sidebar for Desktop ── */}
      <Sidebar role={role} />

      {/* ── Mobile Drawer Navigation Overlay ── */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} role={role} />

      {/* ── Main Dashboard Canvas ── */}
      <main
        style={{
          paddingTop: "76px",
          paddingLeft: isDesktop ? "260px" : "0px",
          minHeight: "100vh",
          backgroundColor: "#f7f7f8",
          boxSizing: "border-box",
          width: "100%",
          transition: "padding-left 0.2s ease",
        }}
      >
        <div style={{ padding: "28px 32px 80px", maxWidth: "1500px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
