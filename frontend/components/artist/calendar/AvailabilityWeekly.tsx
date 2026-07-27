"use client";

import * as React from "react";
import { AvailabilityData } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, Coffee, Save } from "lucide-react";
import toast from "react-hot-toast";

interface AvailabilityWeeklyProps {
  availability: AvailabilityData;
  onSave: (updated: AvailabilityData) => Promise<void>;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityWeekly({ availability, onSave }: AvailabilityWeeklyProps) {
  const [weekly, setWeekly] = React.useState(availability.weekly_schedule);
  const [breakTime, setBreakTime] = React.useState(availability.break_time || { start: "13:00", end: "14:00" });
  const [saving, setSaving] = React.useState(false);

  const handleToggle = (day: string) => {
    setWeekly(prev => {
      const current = prev[day] || { available: false, start: "09:00", end: "22:00" };
      return {
        ...prev,
        [day]: { ...current, available: !current.available }
      };
    });
  };

  const handleTimeChange = (day: string, type: "start" | "end", val: string) => {
    setWeekly(prev => {
      const current = prev[day] || { available: true, start: "09:00", end: "22:00" };
      return {
        ...prev,
        [day]: { ...current, [type]: val }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...availability,
        weekly_schedule: weekly,
        break_time: breakTime
      });
      toast.success("Weekly schedule hours saved successfully!");
    } catch {
      toast.error("Failed to save schedule changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Break Times Card */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Coffee className="h-4.5 w-4.5 text-primary" />
            Performer Daily Break Slot
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Specify break times during which you will not receive show bookings.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Break Start</Label>
              <input
                type="time"
                value={breakTime.start}
                onChange={e => setBreakTime(prev => ({ ...prev, start: e.target.value }))}
                className="h-9 px-3 rounded-lg border border-border bg-bg-elevated text-text-primary text-xs focus:outline-none"
              />
            </div>
            <span className="text-text-muted mt-5 text-xs">to</span>
            <div className="space-y-1">
              <Label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Break End</Label>
              <input
                type="time"
                value={breakTime.end}
                onChange={e => setBreakTime(prev => ({ ...prev, end: e.target.value }))}
                className="h-9 px-3 rounded-lg border border-border bg-bg-elevated text-text-primary text-xs focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule days Card */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-primary" />
            Working Hours Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3.5 divide-y divide-border/40">
          {DAYS.map(day => {
            const config = weekly[day] || { available: false, start: "09:00", end: "22:00" };
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 first:pt-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`weekly-${day}`}
                    checked={config.available}
                    onChange={() => handleToggle(day)}
                    className="w-4.5 h-4.5 accent-primary rounded bg-bg-card border-border cursor-pointer"
                  />
                  <label htmlFor={`weekly-${day}`} className={`text-sm font-bold cursor-pointer ${config.available ? "text-text-primary" : "text-text-muted"}`}>
                    {day}
                  </label>
                </div>

                {config.available && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Hours:</span>
                    <input
                      type="time"
                      value={config.start}
                      onChange={e => handleTimeChange(day, "start", e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-border bg-bg-elevated text-text-primary focus:outline-none"
                    />
                    <span className="text-xs text-text-muted">to</span>
                    <input
                      type="time"
                      value={config.end}
                      onChange={e => handleTimeChange(day, "end", e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-border bg-bg-elevated text-text-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span>{saving ? "Saving Schedule..." : "Save Weekly Hours"}</span>
      </Button>

    </div>
  );
}
