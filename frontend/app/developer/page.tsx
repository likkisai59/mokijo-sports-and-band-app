"use client";

// Cache-busting comment to force compilation refresh.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDevMode } from "@/utils/dev-mode";
import { Building2, Music, User, ArrowRight, ShieldAlert, LogOut, CheckCircle2, ShieldCheck } from "lucide-react";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { useRouter } from "next/navigation";
import { getRoleDashboard } from "@/utils/role-routes";

export default function DeveloperPage() {
  const { isPreviewMode, previewRole, setPreview, exitPreview, isHydrated } = useDeveloperPreview();
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Guarantee identical server and initial client rendering
  const showConsole = mounted && isHydrated;

  if (!isDevMode()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-bg-primary">
        <ShieldAlert className="h-16 w-16 text-error mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Not Found</h2>
        <p className="text-text-secondary max-w-md">
          Developer tools are not enabled in this environment. Please ensure you are running in local development mode.
        </p>
      </div>
    );
  }

  if (!showConsole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-bg-primary">
        <div className="h-9 w-9 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  const handleSelect = (role: "client" | "artist" | "venue_owner" | "admin") => {
    setPreview(role);
    const path = getRoleDashboard(role);
    router.push(path);
  };

  const handleExitPreview = () => {
    exitPreview();
  };

  const portals = [
    {
      role: "client" as const,
      name: "Client Portal",
      description: "Inspect completed Client workflows and dashboard layout.",
      icon: User,
      color: "text-blue-500 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40",
      routes: [
        { label: "Dashboard", path: "/client/dashboard" },
        { label: "Bookings", path: "/client/bookings" },
        { label: "Favorites", path: "/client/favorites" },
        { label: "Settings", path: "/client/settings" }
      ]
    },
    {
      role: "artist" as const,
      name: "Artist / Band Portal",
      description: "Inspect completed Artist / Band workflows and dashboard layout.",
      icon: Music,
      color: "text-amber-500 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
      routes: [
        { label: "Dashboard", path: "/artist/dashboard" },
        { label: "Profile Details", path: "/artist/profile" },
        { label: "Manage Bookings", path: "/artist/bookings" },
        { label: "Earnings summary", path: "/artist/earnings" },
        { label: "Client Reviews", path: "/artist/reviews" },
        { label: "Analytics Console", path: "/artist/analytics" }
      ]
    },
    {
      role: "venue_owner" as const,
      name: "Venue Owner Portal",
      description: "Inspect completed Venue Owner workflows and dashboard layout.",
      icon: Building2,
      color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40",
      routes: [
        { label: "Dashboard", path: "/venue/dashboard" },
        { label: "Venue Profile", path: "/venue/profile" },
        { label: "Manage Bookings", path: "/venue/bookings" },
        { label: "Calendar View", path: "/venue/calendar" },
        { label: "Earnings summary", path: "/venue/earnings" },
        { label: "Review details", path: "/venue/reviews" },
        { label: "Verification queue", path: "/venue/verification" },
        { label: "Analytics Console", path: "/venue/analytics" }
      ]
    },
    {
      role: "admin" as const,
      name: "Admin Portal",
      description: "Inspect completed Admin workflows and dashboard layout.",
      icon: ShieldCheck,
      color: "text-purple-500 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40",
      routes: [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Manage Users", path: "/admin/users" },
        { label: "Manage Artists", path: "/admin/artists" },
        { label: "Manage Venues", path: "/admin/venues" },
        { label: "Manage Locations", path: "/admin/locations" },
        { label: "Manage Categories", path: "/admin/categories" },
        { label: "Portal Settings", path: "/admin/settings" }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8 bg-bg-primary min-h-[80vh]">
      {/* Title Header */}
      <div className="space-y-2 border-b border-border/50 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight font-heading">
            BandConnect Developer Preview
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Development-only portal and UI preview console. Excludes live authentication checks.
          </p>
        </div>
        
        {isPreviewMode && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExitPreview} 
            className="flex items-center gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 self-start"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit Active Preview ({previewRole})</span>
          </Button>
        )}
      </div>

      {/* Main Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {portals.map((portal) => {
          const Icon = portal.icon;
          const isCurrentActive = isPreviewMode && previewRole === portal.role;

          return (
            <Card 
              key={portal.role} 
              className={`border-2 transition-all duration-300 ${
                isCurrentActive 
                  ? "border-amber-500 bg-amber-500/5 shadow-amber-500/5" 
                  : "border-border/60 hover:scale-[1.01] hover:shadow-lg"
              }`}
            >
              <CardHeader className="space-y-2.5">
                <div className={`p-2.5 rounded-xl border w-fit ${portal.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>{portal.name}</span>
                    {isCurrentActive && (
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs text-text-secondary mt-1 min-h-[40px]">
                    {portal.description}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Completed Routes Registry */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-text-muted">
                    Completed Routes
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 min-h-[90px]">
                    {portal.routes.map((route) => (
                      <div 
                        key={route.path} 
                        className="text-[10px] text-text-secondary p-1.5 bg-bg-elevated/40 border border-border/40 rounded-md font-semibold truncate"
                        title={route.path}
                      >
                        {route.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => handleSelect(portal.role)}
                  className="w-full flex items-center justify-center gap-1.5 font-bold"
                >
                  <span>Launch Preview</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Developer Information Disclaimer */}
      <div className="p-4 rounded-2xl bg-bg-elevated/40 border border-border/80 text-xs text-text-secondary space-y-2">
        <h4 className="font-bold text-text-primary">Preview Environment Rules & Security:</h4>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>Preview mode acts strictly client-side. The Axios client will not transmit mock tokens or authorization headers to your local backend API.</li>
          <li>All modify actions (mutations) are intercepted client-side to prevent database noise or continuous 401 warnings.</li>
          <li>To test real database states and live APIs, use standard user registration and the regular Login flow instead.</li>
        </ul>
      </div>
    </div>
  );
}
