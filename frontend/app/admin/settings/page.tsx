"use client";

import * as React from "react";
import {
  Settings,
  Mail,
  Sliders,
  Terminal,
  Save,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Bell
} from "lucide-react";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { api } from "@/services/api";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface AuditLogItem {
  id: string;
  user_name: string;
  action: string;
  ip_address: string;
  user_agent: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const settingsTabs = [
  { label: "Application & Theme", value: "app_theme", icon: Settings },
  { label: "Templates config", value: "templates", icon: Mail },
  { label: "System Preferences", value: "preferences", icon: Sliders },
  { label: "Notification Preferences", value: "notif_preferences", icon: Bell },
  { label: "Audit Logs history", value: "audit_logs", icon: Terminal },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = React.useState("app_theme");
  const [saving, setSaving] = React.useState(false);

  // Settings Values State
  const [appName, setAppName] = React.useState("BandConnect");
  const [supportEmail, setSupportEmail] = React.useState("support@bandconnect.in");
  const [supportPhone, setSupportPhone] = React.useState("+91 99999 88888");
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  const [welcomeEmail, setWelcomeEmail] = React.useState("");
  const [passwordResetEmail, setPasswordResetEmail] = React.useState("");
  const [otpSms, setOtpSms] = React.useState("");

  const [commissionRate, setCommissionRate] = React.useState(10.0);
  const [disputeHoldDays, setDisputeHoldDays] = React.useState(7);
  const [storageProvider, setStorageProvider] = React.useState("local");
  const [emailDispatch, setEmailDispatch] = React.useState(true);
  const [smsDispatch, setSmsDispatch] = React.useState(true);

  // Audit Logs State
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = React.useState(0);
  const [logPage, setLogPage] = React.useState(1);
  const [logLimit] = React.useState(10);
  const [logLoading, setLogLoading] = React.useState(true);
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null);

  // Load settings keys
  const loadSettings = React.useCallback(async () => {
    try {
      // General Application settings
      const appRes = await api.get("/admin/settings/application_settings");
      if (appRes.data.success && appRes.data.data.value) {
        const val = appRes.data.data.value;
        setAppName(val.app_name || "BandConnect");
        setSupportEmail(val.support_email || "");
        setSupportPhone(val.support_phone || "");
        setMaintenanceMode(!!val.maintenance_mode);
      }

      // Email & SMS templates
      const emailRes = await api.get("/admin/settings/email_templates");
      if (emailRes.data.success && emailRes.data.data.value) {
        const val = emailRes.data.data.value;
        setWelcomeEmail(val.welcome_email || "");
        setPasswordResetEmail(val.password_reset || "");
      }

      const smsRes = await api.get("/admin/settings/sms_templates");
      if (smsRes.data.success && smsRes.data.data.value) {
        const val = smsRes.data.data.value;
        setOtpSms(val.otp_sms || "");
      }

      // System Preferences & Storage
      const prefRes = await api.get("/admin/settings/system_preferences");
      if (prefRes.data.success && prefRes.data.data.value) {
        const val = prefRes.data.data.value;
        setCommissionRate(val.commission_rate ?? 10.0);
        setDisputeHoldDays(val.dispute_hold_days ?? 7);
      }

      const storeRes = await api.get("/admin/settings/storage_settings");
      if (storeRes.data.success && storeRes.data.data.value) {
        const val = storeRes.data.data.value;
        setStorageProvider(val.provider || "local");
      }

      const notifyRes = await api.get("/admin/settings/notification_settings");
      if (notifyRes.data.success && notifyRes.data.data.value) {
        const val = notifyRes.data.data.value;
        setEmailDispatch(!!val.email_dispatch);
        setSmsDispatch(!!val.sms_dispatch);
      }
    } catch {
      console.error("Failed loading configuration values.");
    }
  }, []);

  // Load audit logs
  const fetchAuditLogs = React.useCallback(async () => {
    setLogLoading(true);
    try {
      const offset = (logPage - 1) * logLimit;
      const response = await api.get(`/admin/settings/audit-logs?limit=${logLimit}&offset=${offset}`);
      if (response.data.success && response.data.data) {
        setLogs(response.data.data.items || []);
        setTotalLogs(response.data.data.total || 0);
      }
    } catch {
      console.error("Failed loading audit logs.");
    } finally {
      setLogLoading(false);
    }
  }, [logPage, logLimit]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  React.useEffect(() => {
    if (activeTab === "audit_logs") {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // Save Application Settings
  const handleSaveAppTheme = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/application_settings", {
        value: {
          app_name: appName,
          support_email: supportEmail,
          support_phone: supportPhone,
          maintenance_mode: maintenanceMode,
        },
      });
      toast.success("Application configurations updated.");
    } catch {
      toast.error("Failed updating application configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Save Templates
  const handleSaveTemplates = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/email_templates", {
        value: {
          welcome_email: welcomeEmail,
          password_reset: passwordResetEmail,
        },
      });
      await api.put("/admin/settings/sms_templates", {
        value: {
          otp_sms: otpSms,
        },
      });
      toast.success("Templates updated successfully.");
    } catch {
      toast.error("Failed updating templates.");
    } finally {
      setSaving(false);
    }
  };

  // Save System Preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/system_preferences", {
        value: {
          commission_rate: Number(commissionRate),
          dispute_hold_days: Number(disputeHoldDays),
        },
      });
      await api.put("/admin/settings/storage_settings", {
        value: {
          provider: storageProvider,
        },
      });
      await api.put("/admin/settings/notification_settings", {
        value: {
          email_dispatch: emailDispatch,
          sms_dispatch: smsDispatch,
        },
      });
      toast.success("System preferences saved.");
    } catch {
      toast.error("Failed saving system preferences.");
    } finally {
      setSaving(false);
    }
  };

  const totalLogPages = Math.ceil(totalLogs / logLimit);

  return (
    <AdminPageContainer
      title="System settings Console"
      description="Manage marketplace commissioning flat rates, template texts details, storage options and audit histories logs."
    >
      {/* 1. Settings tab selectors */}
      <div className="flex border-b border-border mb-6 overflow-x-auto gap-2 pb-1 scrollbar-none select-none">
        {settingsTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-primary border-primary text-white"
                  : "bg-bg-card border-border/80 text-text-secondary hover:text-white"
              )}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: APPLICATION & THEME THEME CONFIG ────────────────────────── */}
      {activeTab === "app_theme" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
              <Globe className="h-4.5 w-4.5 text-primary" />
              <span>General site settings configurations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label htmlFor="app_name">Marketplace Brand Name</Label>
              <Input id="app_name" value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="support_email">Support Desk Email</Label>
              <Input id="support_email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="support_phone">Contact Phone Support</Label>
              <Input id="support_phone" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2.5 font-semibold text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-bg-card accent-primary"
                />
                <span>Enable Maintenance Mode (Restricts Public APIs)</span>
              </Label>
            </div>

            <Button onClick={handleSaveAppTheme} disabled={saving} className="w-full font-bold h-9 mt-4 flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Application configs"}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 2: TEMPLATES CONFIG ─────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
              <Mail className="h-4.5 w-4.5 text-secondary" />
              <span>System Email & SMS templates text formats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label htmlFor="welcome_email">Verification Welcome Email Text</Label>
              <Textarea
                id="welcome_email"
                rows={4}
                value={welcomeEmail}
                onChange={(e) => setWelcomeEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password_reset">Password Reset Link Email Text</Label>
              <Textarea
                id="password_reset"
                rows={4}
                value={passwordResetEmail}
                onChange={(e) => setPasswordResetEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="otp_sms">OTP Pincode SMS Notification Text</Label>
              <Textarea
                id="otp_sms"
                rows={3}
                value={otpSms}
                onChange={(e) => setOtpSms(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveTemplates} disabled={saving} className="w-full font-bold h-9 mt-4 flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Templates configs"}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 3: SYSTEM PREFERENCES & STORAGE ─────────────────────────────── */}
      {activeTab === "preferences" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
              <Sliders className="h-4.5 w-4.5 text-accent" />
              <span>Commission rates and file upload settings config</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="commission_rate">Flat Commission commission_rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dispute_hold_days">Dispute Funds Hold (Days)</Label>
                <Input
                  id="dispute_hold_days"
                  type="number"
                  value={disputeHoldDays}
                  onChange={(e) => setDisputeHoldDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Active Media Storage Provider client</Label>
              <Select value={storageProvider} onValueChange={setStorageProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Host Filesystem Storage</SelectItem>
                  <SelectItem value="s3">Amazon Web Services S3 Bucket client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2.5 font-semibold text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailDispatch}
                  onChange={(e) => setEmailDispatch(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-bg-card accent-primary"
                />
                <span>Enable Automated Email Dispatches</span>
              </Label>
              <Label className="flex items-center gap-2.5 font-semibold text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={smsDispatch}
                  onChange={(e) => setSmsDispatch(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-border bg-bg-card accent-primary"
                />
                <span>Enable Automated SMS Dispatch Notifications</span>
              </Label>
            </div>

            <Button onClick={handleSavePreferences} disabled={saving} className="w-full font-bold h-9 mt-4 flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB: NOTIFICATION PREFERENCES ────────────────────────── */}
      {activeTab === "notif_preferences" && (
        <div className="max-w-xl">
          <NotificationPreferencesCard />
        </div>
      )}

      {/* ─── TAB 4: AUDIT LOGS HISTORY FEED ──────────────────────────────────── */}
      {activeTab === "audit_logs" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrator Action</TableHead>
                    <TableHead>Actor profile Name</TableHead>
                    <TableHead>Client IP address</TableHead>
                    <TableHead>Audit Date</TableHead>
                    <TableHead className="text-right">Payload Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                        Loading audit logs lists...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                        No auditing logs tracked.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-text-primary border-white/20">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-text-primary text-xs">
                          {log.user_name}
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs font-mono text-[10px]">
                          {log.ip_address}
                        </TableCell>
                        <TableCell className="text-text-secondary text-[11px]">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => setSelectedLog(log)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-text-secondary hover:text-text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalLogPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs font-semibold text-text-secondary select-none">
              <span>
                Page {logPage} of {totalLogPages} ({totalLogs} entries total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logPage === 1}
                  onClick={() => setLogPage((prev) => prev - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logPage === totalLogPages}
                  onClick={() => setLogPage((prev) => prev + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Detail payload presentation sheet */}
      <Drawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        description="Administrative settings updates payloads"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs text-text-secondary">
            <div className="space-y-1">
              <span className="font-semibold text-text-muted">Operation Action</span>
              <div className="font-bold text-text-primary uppercase">{selectedLog.action}</div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-text-muted">Administrator</span>
              <div className="font-bold text-text-primary">{selectedLog.user_name}</div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-text-muted">Client User Agent</span>
              <div className="bg-bg-card p-2 rounded border border-border/50 text-[10px] leading-relaxed break-all">
                {selectedLog.user_agent}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-text-muted">Changes Log payload details</span>
              <pre className="bg-bg-card p-3 rounded border border-border/50 font-mono text-[10px] text-primary leading-normal overflow-x-auto">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </AdminPageContainer>
  );
}
