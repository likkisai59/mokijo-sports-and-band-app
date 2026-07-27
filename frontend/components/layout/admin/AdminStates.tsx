"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Loading Layout ──────────────────────────────────────────────────────────

export function AdminLoadingLayout() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border/30 pb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </Card>
    </div>
  );
}

// ─── Error Layout ────────────────────────────────────────────────────────────

interface AdminErrorLayoutProps {
  error?: Error;
  reset?: () => void;
}

export function AdminErrorLayout({ error, reset }: AdminErrorLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="p-4 bg-destructive/10 rounded-full border border-destructive/20 text-destructive mb-6 animate-bounce">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">Administrative Error Boundary</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
        {error?.message || "An administrative process exception occurred. System operators have been notified."}
      </p>
      <div className="flex gap-4">
        {reset && (
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Reset View</span>
          </Button>
        )}
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Console</Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Unauthorized Layout ──────────────────────────────────────────────────────

export function AdminUnauthorizedLayout() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="p-4 bg-primary/10 rounded-full border border-primary/20 text-primary mb-6 animate-pulse">
        <Lock className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">Restricted Access Areas</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
        You do not hold correct administrator credentials access permissions list claims. Please log in with authorized credentials.
      </p>
      <Link href="/login">
        <Button>Log In Authorized</Button>
      </Link>
    </div>
  );
}
