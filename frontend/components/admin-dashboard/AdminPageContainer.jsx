import * as React from "react";

export function AdminPageContainer({ title, description, actions, children }) {
    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="ad-page-title">{title}</h1>
                    {description && <p className="ad-page-sub mt-1">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            <div className="ad-page-content">
                {children}
            </div>
        </div>
    );
}
