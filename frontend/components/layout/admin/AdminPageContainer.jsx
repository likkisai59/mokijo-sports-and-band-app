"use client";

import * as React from "react";

export function AdminPageContainer({ title, description, actions, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
