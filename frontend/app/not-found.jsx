"use client";

import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-bg-elevated/40 rounded-full border border-border/80 shadow-2xl">
          <SearchX className="h-16 w-16 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">404</h1>
          <h2 className="text-xl font-bold">Page Not Found</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            The page you are looking for doesn't exist, has been moved, or you don't have permission to view it.
          </p>
        </div>

        <div className="pt-6">
          <Button asChild className="w-full sm:w-auto px-8 font-bold text-xs h-10 shadow-lg shadow-primary/20">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
