"use client";

import React from "react";
import { cn } from "@/utils/cn";

export function ConversationSidebarSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-card/40 border border-border/30 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-border/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-border/40 rounded" />
            <div className="h-2 w-1/2 bg-border/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col space-y-1 max-w-[75%]",
            i % 2 === 0 ? "ml-auto items-end" : "mr-auto items-start"
          )}
        >
          <div
            className={cn(
              "h-10 rounded-2xl animate-pulse w-48",
              i % 2 === 0 ? "bg-primary/20" : "bg-bg-card border border-border/60"
            )}
          />
          <div className="h-2 w-16 bg-border/30 rounded" />
        </div>
      ))}
    </div>
  );
}
