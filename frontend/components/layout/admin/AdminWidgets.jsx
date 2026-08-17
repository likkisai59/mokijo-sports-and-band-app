"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/utils/cn";

export function AdminStatCard({
  title,
  value,
  trend,
  description,
  icon: Icon,
  className,
  onClick,
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          {Icon && (
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-black tracking-tight text-text-primary">
            {value}
          </h3>

          {(trend || description) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center font-bold gap-0.5",
                    trend.isPositive ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {trend.value}
                </span>
              )}
              {description && <span>{description}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
