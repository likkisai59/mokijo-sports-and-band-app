import * as React from "react";
import Link from "next/link";

export function AdminFooter() {
  return (
    <footer className="border-t border-border/30 bg-bg-card/20 py-4 px-6 mt-12 text-center flex flex-col sm:flex-row justify-between items-center gap-2">
      <p className="text-[10px] text-text-muted">
        &copy; {new Date().getFullYear()} BandConnect. Admin Control Console. Confidential.
      </p>
      <div className="flex gap-4 text-[10px] text-text-muted">
        <Link href="/admin/system/logs" className="hover:text-text-primary transition-colors">
          System Logs
        </Link>
        <Link href="/admin/system/health" className="hover:text-text-primary transition-colors">
          Health Status
        </Link>
        <span>v1.0.0</span>
      </div>
    </footer>
  );
}
