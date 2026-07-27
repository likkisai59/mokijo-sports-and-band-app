"use client";

import Link from "next/link";
import { Menu, Sun, Moon, Music, User, Building2, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/theme-provider";
import { useDeveloperPreview } from "@/providers/developer-preview-provider";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { HeaderProfileDropdown } from "@/components/layout/HeaderProfileDropdown";
import * as React from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isPreviewMode, previewRole, isHydrated: previewHydrated, exitPreview } = useDeveloperPreview();

  // Prevent hydration mismatches
  const [mounted, setMounted] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard accessibility — close dropdowns on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const effectiveRole = isPreviewMode ? previewRole : user?.role;

  // Admin role — hide marketplace navigation links
  const isAdmin = effectiveRole === "admin";

  const handleExitPreview = () => {
    exitPreview();
    window.location.href = "/developer";
  };

  // ─── Right-side controls ───────────────────────────────────────────────────

  const renderRightControls = () => {
    // Stable placeholder during SSR / hydration
    if (!mounted || authLoading || !previewHydrated) {
      return <div className="h-9 w-24" />;
    }

    // Developer preview banner
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

    // ── Authenticated user ──────────────────────────────────────────────────
    if (user) {
      return (
        <div className="flex items-center gap-2">
          {/* Notifications bell (hidden for admin — admin has its own) */}
          {!isAdmin && <NotificationsBell />}

          {/* Profile dropdown */}
          <HeaderProfileDropdown />
        </div>
      );
    }

    // ── Guest / unauthenticated ─────────────────────────────────────────────
    return (
      <div className="flex items-center gap-2 relative">
        {/* LOGIN DROPDOWN */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold flex items-center gap-1 hover:bg-bg-elevated hover:text-text-primary px-2 sm:px-3 text-xs sm:text-sm h-9"
            onClick={() => {
              setLoginOpen(!loginOpen);
              setRegisterOpen(false);
            }}
          >
            <span>Login</span>
            <ChevronDown className={`h-3 w-3 opacity-70 transition-transform ${loginOpen ? "rotate-180" : ""}`} />
          </Button>

          {loginOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setLoginOpen(false)} />
              <div className="absolute right-0 sm:right-auto sm:left-0 top-[calc(100%+8px)] z-50 w-72 sm:w-80 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[10px] font-black uppercase tracking-wider text-text-muted pb-2 border-b border-border/30 mb-2">
                  Login
                </div>
                <div className="space-y-1">
                  <Link
                    href="/login?role=client"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <User className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        As Client
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Find and book live performers.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/login?role=artist"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Music className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        As Artist / Band
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Manage gigs, profile, and earnings.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/login?role=venue_owner"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Building2 className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        As Venue Owner
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Manage venues and bookings.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/login?role=admin"
                    onClick={() => setLoginOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left border-t border-border/30 pt-3 mt-2"
                  >
                    <ShieldCheck className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        As Admin
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Verify artists and venues.
                      </div>
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
            className="font-bold flex items-center gap-1 bg-primary hover:bg-primary-hover text-white px-2.5 sm:px-4 text-xs sm:text-sm h-9"
            onClick={() => {
              setRegisterOpen(!registerOpen);
              setLoginOpen(false);
            }}
          >
            <span>Register</span>
            <ChevronDown className={`h-3 w-3 opacity-80 transition-transform ${registerOpen ? "rotate-180" : ""}`} />
          </Button>

          {registerOpen && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setRegisterOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 sm:w-80 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[10px] font-black uppercase tracking-wider text-text-muted pb-2 border-b border-border/30 mb-2">
                  Register
                </div>
                <div className="space-y-1">
                  <Link
                    href="/register?role=client"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <User className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        Join as Client
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Discover and book artists and venues.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/register?role=artist"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Music className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        Join as Artist / Band
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        Create a performer profile and receive gigs.
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/register?role=venue_owner"
                    onClick={() => setRegisterOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group text-left"
                  >
                    <Building2 className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        Join as Venue Owner
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        List and manage venue spaces.
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

  // ─── Centre nav links ──────────────────────────────────────────────────────

  const renderNavLinks = () => {
    // Authenticated view: show optional Marketplace/Find Venues
    // Only rendered post-hydration to avoid SSR mismatch on role-specific href
    if (mounted && !authLoading && previewHydrated && user && effectiveRole) {
      return (
        <nav className="hidden md:flex items-center gap-6">
          {!isAdmin && (
            <>
              <Link href="/artists" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Find Artist
              </Link>
              <Link href="/venues" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Find Venues
              </Link>
            </>
          )}
        </nav>
      );
    }

    // Default / guest / pre-hydration: always render the public nav
    // Static links — safe to render on SSR and during hydration
    return (
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/artists" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          Find Artist
        </Link>
        <Link href="/venues" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          Find Venues
        </Link>
        <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          About
        </Link>
        <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          Contact
        </Link>
      </nav>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-panel h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
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
        {mounted && isPreviewMode && previewRole && (
          <div className="px-2.5 py-1 text-[9px] font-black tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full select-none whitespace-nowrap">
            {previewRole === "venue_owner"
              ? "PREVIEW — VENUE OWNER"
              : `PREVIEW — ${previewRole.toUpperCase()}`}
          </div>
        )}

        {renderNavLinks()}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-text-secondary hover:text-text-primary"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {renderRightControls()}
      </div>
    </header>
  );
}
