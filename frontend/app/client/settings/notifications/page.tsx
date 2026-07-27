"use client";

import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { Settings } from "lucide-react";

export default function ClientNotificationPreferencesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Notification Preferences
        </h1>
        <p className="text-xs text-text-secondary">
          Manage how and when you receive notifications from the platform.
        </p>
      </div>
      <NotificationPreferencesCard />
    </div>
  );
}
