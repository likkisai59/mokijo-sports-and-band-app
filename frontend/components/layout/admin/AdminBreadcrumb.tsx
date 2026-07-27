"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function AdminBreadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    return paths.map((path, idx) => {
      const href = "/" + paths.slice(0, idx + 1).join("/");
      let label = path
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (label === "Dashboard") {
        label = "Home";
      }
      
      return { label, href, isLast: idx === paths.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-text-secondary select-none">
      <Link href="/admin/dashboard" className="flex items-center hover:text-text-primary transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {breadcrumbs.map((crumb) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
          {crumb.isLast ? (
            <span className="text-text-primary font-bold">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-text-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
