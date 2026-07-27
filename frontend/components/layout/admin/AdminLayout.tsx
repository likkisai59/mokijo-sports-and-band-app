"use client";

import * as React from "react";
import { AdminHeader } from "@/components/layout/admin/AdminHeader";
import { AdminSidebar } from "@/components/layout/admin/AdminSidebar";
import { AdminFooter } from "@/components/layout/admin/AdminFooter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top Header sticky */}
      <AdminHeader />

      <div className="flex pt-16">
        {/* Responsive Collapsible Sidebar */}
        <AdminSidebar />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] transition-all duration-300 md:pl-64">
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
          {/* Layout Footer */}
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
