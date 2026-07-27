"use client";

import * as React from "react";
import { artistService } from "@/services/artistService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarCheck, ShieldAlert, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export function ConflictChecker() {
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("19:00");
  const [endTime, setEndTime] = React.useState("22:00");
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<{ checked: boolean; hasConflict: boolean; reason: string | null }>({
    checked: false,
    hasConflict: false,
    reason: null
  });

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date for checking conflicts.");
      return;
    }

    setChecking(true);
    try {
      const res = await artistService.checkConflict(date, startTime, endTime);
      setResult({
        checked: true,
        hasConflict: res.has_conflict,
        reason: res.reason
      });
      if (res.has_conflict) {
        toast.error("Schedule conflict detected!");
      } else {
        toast.success("Schedule slot is available!");
      }
    } catch {
      toast.error("Failed to run schedule conflict validation.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <CalendarCheck className="h-4.5 w-4.5 text-primary" />
          Event Conflict Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleCheck} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="check_date">Event Date</Label>
            <Input
              id="check_date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="check_start">Start Time</Label>
              <Input
                id="check_start"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="check_end">End Time</Label>
              <Input
                id="check_end"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={checking}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 mt-2"
          >
            {checking ? "Checking conflicts..." : "Verify Slot Availability"}
          </Button>
        </form>

        {/* Results indicator card */}
        {result.checked && (
          <div 
            className={`p-3.5 rounded-xl border flex gap-3 ${
              result.hasConflict 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <div className="shrink-0 pt-0.5">
              {result.hasConflict ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-primary block">
                {result.hasConflict ? "Slot Blocked / Conflicting" : "Slot is Open"}
              </span>
              <p className="text-[11px] leading-relaxed">
                {result.hasConflict 
                  ? `Reason: ${result.reason || "Performer is unavailable at these times."}` 
                  : "The performer is available and free of booking conflicts during these hours!"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
