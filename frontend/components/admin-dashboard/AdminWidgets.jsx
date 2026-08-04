import * as React from "react";

export function AdminStatCard({ title, value, trend, description, icon: Icon }) {
    return (
        <div className="ad-stat-card p-5 rounded-xl border border-border/50 bg-bg-card/50 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="text-text-muted">
                    {Icon && <Icon className="h-5 w-5" />}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trend.value}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-sm font-bold text-text-secondary">{title}</h3>
                <div className="text-2xl font-black text-text-primary mt-1">{value}</div>
                {description && <p className="text-xs text-text-muted mt-2">{description}</p>}
            </div>
        </div>
    );
}
