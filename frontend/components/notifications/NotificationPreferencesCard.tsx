"use client";

import * as React from "react";
import { useNotificationsStore } from "@/features/notifications/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw, Save } from "lucide-react";
import toast from "react-hot-toast";

export function NotificationPreferencesCard() {
  const {
    preferences,
    loading,
    fetchPreferences,
    updatePreferences,
  } = useNotificationsStore();

  // Local state for toggles, so changes are only saved on clicking "Save Changes"
  const [localPrefs, setLocalPrefs] = React.useState({
    booking_enabled: true,
    payment_enabled: true,
    review_enabled: true,
    message_enabled: true,
    system_enabled: true,
    realtime_enabled: true,
  });

  // Load preferences from store on mount or store update
  React.useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        booking_enabled: preferences.booking_enabled,
        payment_enabled: preferences.payment_enabled,
        review_enabled: preferences.review_enabled,
        message_enabled: preferences.message_enabled,
        system_enabled: preferences.system_enabled,
        realtime_enabled: preferences.realtime_enabled,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPrefs) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPrefs({
        booking_enabled: preferences.booking_enabled,
        payment_enabled: preferences.payment_enabled,
        review_enabled: preferences.review_enabled,
        message_enabled: preferences.message_enabled,
        system_enabled: preferences.system_enabled,
        realtime_enabled: preferences.realtime_enabled,
      });
      toast.success("Preferences reset to current database settings");
    }
  };

  const handleSave = async () => {
    try {
      await updatePreferences(localPrefs);
      toast.success("Notification preferences updated successfully");
    } catch {
      toast.error("Failed to save notification preferences");
    }
  };

  const preferenceItems = [
    {
      key: "booking_enabled" as const,
      title: "Booking Notifications",
      description: "Receive updates on booking requests, updates, status changes, and dispute events.",
    },
    {
      key: "payment_enabled" as const,
      title: "Payment Notifications",
      description: "Receive confirmation alerts on invoices, transaction processing, and payouts.",
    },
    {
      key: "review_enabled" as const,
      title: "Review Notifications",
      description: "Get notified when you receive new feedback, ratings, or comment replies.",
    },
    {
      key: "message_enabled" as const,
      title: "Message Notifications",
      description: "Receive notifications for direct messages and active chat conversations.",
    },
    {
      key: "system_enabled" as const,
      title: "System Notifications",
      description: "Receive platform alerts, system logs, administration messages, and system alerts.",
    },
    {
      key: "realtime_enabled" as const,
      title: "Real-Time Notifications",
      description: "Push new updates instantly via WebSocket connections without reloading the page.",
    },
  ];

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-xl">
      <CardHeader className="border-b border-border/60 bg-bg-card/20 p-5">
        <CardTitle className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-1.5">
          <Bell className="h-4.5 w-4.5 text-primary" />
          Notification Delivery Preferences
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <p className="text-xs text-text-secondary leading-relaxed">
          Configure how you receive system alerts, live updates, and transaction messages across delivery paths.
        </p>

        <div className="divide-y divide-border/30">
          {preferenceItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
              <div className="space-y-0.5 max-w-[80%]">
                <label className="text-xs font-bold text-text-primary">{item.title}</label>
                <p className="text-[11px] text-text-muted leading-relaxed">{item.description}</p>
              </div>

              {/* Custom Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={localPrefs[item.key]}
                  onChange={() => handleToggle(item.key)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-1 peer-focus:ring-primary/45 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="font-bold text-xs h-9 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="font-bold text-xs h-9 bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
