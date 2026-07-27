"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "client" | "artist" | "venue" | "admin";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top navbar */}
      <Header onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Sidebar for Desktop */}
      <Sidebar role={role} />

      {/* Mobile nav overlay */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} role={role} />

      {/* Main panel */}
      <main className="pt-16 md:pl-64 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
