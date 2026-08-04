"use client";

import { Settings, Bell, ShieldAlert } from "lucide-react";

export default function ClientSettingsPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    <Settings className="h-6.5 w-6.5 text-primary" />
                    Account Settings
                </h1>
                <p className="cd-page-sub">
                    Manage your account security and notification preferences.
                </p>
            </div>

            <div className="cd-card max-w-3xl">
                <div className="cd-card-header">
                    <h2 className="cd-card-title flex items-center gap-2">
                        <ShieldAlert className="h-4.5 w-4.5 text-primary" />
                        Security Settings
                    </h2>
                </div>
                <div className="space-y-4">
                    <p className="text-xs text-text-muted">
                        Security policy forces credentials settings verification via Authentication slice settings. Use standard reset actions to adjust credentials.
                    </p>
                    <button className="cd-btn-ghost text-xs py-2 px-4">
                        Change Password
                    </button>
                </div>
            </div>

            <div className="cd-card max-w-3xl">
                <div className="cd-card-header">
                    <h2 className="cd-card-title flex items-center gap-2">
                        <Bell className="h-4.5 w-4.5 text-primary" />
                        Notification Preferences
                    </h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                        <div>
                            <div className="text-sm font-bold text-text-primary">Email Notifications</div>
                            <div className="text-xs text-text-muted">Receive booking updates via email</div>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-primary" disabled />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                        <div>
                            <div className="text-sm font-bold text-text-primary">Push Notifications</div>
                            <div className="text-xs text-text-muted">Receive real-time alerts in your browser</div>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-primary" disabled />
                    </div>
                </div>
            </div>
        </div>
    );
}
