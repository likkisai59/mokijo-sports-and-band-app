"use client";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
          <h1 className="ad-page-title">Notifications & Broadcasts</h1>
          <p className="ad-page-sub mt-1">View system alerts and broadcast messages to users.</p>
      </div>
      <div className="py-4">
        <NotificationCenter />
      </div>
    </div>
  );
}
