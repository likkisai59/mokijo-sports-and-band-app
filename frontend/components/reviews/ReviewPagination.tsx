"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ReviewPaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function ReviewPagination({
  page,
  pages,
  total,
  onPageChange,
  className
}: ReviewPaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between pt-4 border-t border-border/60 text-xs font-semibold text-text-secondary select-none", className)}>
      <span>
        Page {page} of {pages} ({total} reviews)
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 text-xs px-2.5"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 text-xs px-2.5"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
