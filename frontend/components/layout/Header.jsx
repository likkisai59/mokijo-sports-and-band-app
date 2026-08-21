"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Music,
  User,
  Building2,
  ShieldCheck,
  ChevronDown,
  Activity,
  Dumbbell,
  Trophy,
  Users2,
  CalendarCheck,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/theme-provider";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { HeaderProfileDropdown } from "@/components/layout/HeaderProfileDropdown";
import * as React from "react";

import { getBandUser } from "@/lib/bandAuth";

export function Header({ onMenuClick }) {
  const pathname = usePathname() || "/";
  const { user, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isPreviewMode, previewRole, isHydrated: previewHydrated, exitPreview } = useDeveloperPreview();

  const [mounted, setMounted] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const bandUser = mounted && typeof window !== "undefined" ? getBandUser() : null;
  const currentUser = user || bandUser;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLoginOpen(false);
        setRegisterOpen(false);
      }
    };
    if (loginOpen || registerOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginOpen, registerOpen]);

  const isSportsContext =
    pathname.startsWith("/mokijo") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/venue") ||
    pathname.startsWith("/trainings") ||
    pathname.startsWith("/scoreboard") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/user-dashboard");

  const isBandContext =
    pathname.startsWith("/band") ||
    pathname.startsWith("/artists") ||
    pathname.startsWith("/artist");

  const effectiveRole = isPreviewMode ? previewRole : currentUser?.role;
  const isAdmin = effectiveRole === "admin";

  const handleExitPreview = () => {
    exitPreview();
    window.location.href = "/developer";
  };

  const renderModuleSwitcher = () => {
    return (
      <div className="hidden lg:flex items-center bg-bg-card/80 border border-border/80 p-0.5 rounded-full shadow-inner text-xs font-semibold select-none">
        <Link
          href="/mokijo"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 ${isSportsContext
              ? "bg-emerald-500 text-black font-bold shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
            }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Sports</span>
        </Link>
        <Link
          href="/band"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 ${isBandContext
              ? "bg-primary text-white font-bold shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
            }`}
        >
          <Music className="h-3.5 w-3.5" />
          <span>BandConnect</span>
        </Link>
      </div>
    );
  };

  const renderNavLinks = () => {
    if (isSportsContext) {
      return (
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link
            href="/venues"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span>Turf Venues</span>
          </Link>
          <Link
            href="/trainings"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Dumbbell className="h-4 w-4 text-emerald-500" />
            <span>Coaching</span>
          </Link>
          <Link
            href="/scoreboard"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span>Scoreboard</span>
          </Link>
          <Link
            href="/bookings"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            <span>My Bookings</span>
          </Link>
        </nav>
      );
    }

    if (isBandContext) {
      return (
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link
            href="/artists"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Music className="h-4 w-4 text-primary" />
            <span>Find Artists</span>
          </Link>
          <Link
            href="/venues"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Building2 className="h-4 w-4 text-primary" />
            <span>Venues</span>
          </Link>
          <Link
            href="/about"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Contact
          </Link>
        </nav>
      );
    }

    // Root Hub Navigation
    return (
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
        <Link
          href="/mokijo"
          className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
        >
          <Activity className="h-4 w-4 text-emerald-500" />
          <span>Sports Hub</span>
        </Link>
        <Link
          href="/band"
          className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
        >
          <Music className="h-4 w-4 text-primary" />
          <span>Music Marketplace</span>
        </Link>
        <Link
          href="/venues"
          className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
        >
          <Building2 className="h-4 w-4 text-amber-500" />
          <span>All Venues</span>
        </Link>
      </nav>
    );
  };

  const renderRightControls = () => {
    if (!mounted) {
      return <div className="h-9 w-24" />;
    }

    if (isPreviewMode) {
      return (
        <Button
          size="sm"
          onClick={handleExitPreview}
          className="font-bold bg-amber-500 hover:bg-amber-600 text-black border-amber-600 h-9"
        >
          Exit Preview
        </Button>
      );
    }

    if (currentUser) {
      return (
        <div className="flex items-center gap-2">
          {!isAdmin && <NotificationsBell />}
          <HeaderProfileDropdown />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 relative">
        {/* LOGIN DROPDOWN */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold flex items-center gap-1 hover:bg-bg-elevated hover:text-text-primary px-2.5 sm:px-3 text-xs sm:text-sm h-9 rounded-xl"
            onClick={() => {
              setLoginOpen(!loginOpen);
              setRegisterOpen(false);
            }}
          >
            <span>Login</span>
            <ChevronDown
              className={`h-3 w-3 opacity-70 transition-transform ${loginOpen ? "rotate-180" : ""}`}
            />
          </Button>

          {loginOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setLoginOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Sports Section */}
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 pb-1.5 border-b border-border/30 mb-2 flex items-center justify-between">
                  <span>Mokijo Sports</span>
                  <span className="text-[9px] text-text-muted">Player & Club</span>
                </div>
                <div className="space-y-1 mb-3">
                  <Link
                    href="/mokijo/login-user"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <User className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Player / Member
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Book turfs, join matches & track scores.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/login-admin"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Users2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Club & Team Admin
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Manage squads, dues & practice sessions.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/login-venue"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Building2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Sports Venue Owner
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Manage turf courts, slots & revenues.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/login-trainer"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Dumbbell className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Coach & Trainer
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Offer training sessions & courses.
                      </div>
                    </div>
                  </Link>
                </div>

                {/* BandConnect Section */}
                <div className="text-[10px] font-black uppercase tracking-wider text-primary pb-1.5 border-b border-border/30 mb-2 flex items-center justify-between">
                  <span>BandConnect</span>
                  <span className="text-[9px] text-text-muted">Music & Gigs</span>
                </div>
                <div className="space-y-1 mb-3">
                  <Link
                    href="/login?role=client"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary">
                        Event Host / Client
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Book bands & manage event gigs.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/login?role=artist"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Music className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary">
                        Artist & Live Band
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Accept gig requests & payout escrow.
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Super Admin */}
                <div className="border-t border-border/30 pt-2">
                  <Link
                    href="/super-admin/login"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-elevated transition-colors text-left"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="text-xs font-bold text-text-primary">
                      Super Admin Portal
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* REGISTER DROPDOWN */}
        <div className="relative">
          <Button
            size="sm"
            className="font-bold flex items-center gap-1 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-white px-3 sm:px-4 text-xs sm:text-sm h-9 rounded-xl shadow-md"
            onClick={() => {
              setRegisterOpen(!registerOpen);
              setLoginOpen(false);
            }}
          >
            <span>Register</span>
            <ChevronDown
              className={`h-3 w-3 opacity-90 transition-transform ${registerOpen ? "rotate-180" : ""}`}
            />
          </Button>

          {registerOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setRegisterOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Sports Registrations */}
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 pb-1.5 border-b border-border/30 mb-2">
                  Mokijo Sports Signup
                </div>
                <div className="space-y-1 mb-3">
                  <Link
                    href="/mokijo/register-user"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <User className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Join as Player
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Free membership for matches & venues.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/register"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Users2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Register Sports Club
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Manage sports academies & teams.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/register-venue"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Building2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        List Sports Venue
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        List turf ground & accept bookings.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mokijo/register-trainer"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group text-left"
                  >
                    <Dumbbell className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-emerald-500">
                        Join as Coach / Trainer
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Offer specialized sports coaching.
                      </div>
                    </div>
                  </Link>
                </div>

                {/* BandConnect Registrations */}
                <div className="text-[10px] font-black uppercase tracking-wider text-primary pb-1.5 border-b border-border/30 mb-2">
                  BandConnect Signup
                </div>
                <div className="space-y-1">
                  <Link
                    href="/band/register?role=client"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary">
                        Join as Event Client
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        Find & book verified music performers.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/band/register?role=artist"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Music className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary">
                        Join as Artist / Band
                      </div>
                      <div className="text-[10px] text-text-secondary leading-tight">
                        List performer profile & get gigs.
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        height: "64px",
      }}
      className="flex items-center justify-between px-4 sm:px-6"
    >
      <div className="flex items-center gap-4 lg:gap-6">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-text-secondary hover:text-text-primary"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <BrandLogo />
        {renderModuleSwitcher()}

        {mounted && isPreviewMode && previewRole && (
          <div className="px-2.5 py-1 text-[9px] font-black tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full select-none whitespace-nowrap hidden sm:block">
            {previewRole === "venue_owner"
              ? "PREVIEW — VENUE OWNER"
              : `PREVIEW — ${previewRole.toUpperCase()}`}
          </div>
        )}

        {renderNavLinks()}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-text-secondary hover:text-text-primary"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {renderRightControls()}
      </div>
    </header>
  );
}

