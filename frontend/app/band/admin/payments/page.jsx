"use client";
import * as React from "react";
import { AdminPageContainer } from "@/components/admin-dashboard/AdminPageContainer";

export default function AdminPaymentsPage() {
  return (
    <AdminPageContainer
      title="Payments & Escrow"
      description="Manage platform transactions, commission payouts, and escrow releases."
    >
      <div className="p-8 text-center text-text-secondary bg-surface rounded-2xl shadow-sm border border-border/40">
        <h2 className="text-xl font-bold text-text-primary mb-2">Coming Soon</h2>
        <p>The payments dashboard will be available in the next release.</p>
      </div>
    </AdminPageContainer>
  );
}
