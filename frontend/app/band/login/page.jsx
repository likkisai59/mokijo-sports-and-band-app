"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  AuthCard,
  AuthBrand,
  AuthField,
  AuthErrorBanner,
  AuthNavLinks,
  getAuthClasses,
} from "@/components/auth";
import PasswordField from "@/components/ui/PasswordField";
import { bandLogin } from "@/lib/bandAuth";
import { getRoleDashboard } from "@/utils/role-routes";
import {
  User,
  Music,
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const c = getAuthClasses("light");

const ROLES = [
  {
    id: "client",
    title: "Client",
    badge: "Event Host",
    icon: User,
  },
  {
    id: "artist",
    title: "Artist",
    badge: "Performer",
    icon: Music,
  },
  {
    id: "venue_owner",
    title: "Venue",
    badge: "Owner",
    icon: Building2,
  },
  {
    id: "admin",
    title: "Admin",
    badge: "Moderator",
    icon: ShieldCheck,
  },
];

export default function BandLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "client";

  const [role, setRole] = React.useState(
    ["client", "artist", "venue_owner", "admin"].includes(initialRole)
      ? initialRole
      : "client"
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await bandLogin(form.email.trim().toLowerCase(), form.password);
      toast.success(`Welcome back, ${res.user.name}!`);

      // Guaranteed direct dashboard redirection
      const targetDashboard = getRoleDashboard(res.user.role);
      window.location.href = targetDashboard;
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Invalid email address or password. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="light">
      <AuthCard size="sm" variant="light">
        <div className="flex flex-col items-center justify-center w-full">
          {/* Back to Marketplace */}
          <div className="w-full flex justify-start mb-4">
            <Link
              href="/band/artists"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#5c5c66] hover:text-[#0a0a0f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Explore Marketplace</span>
            </Link>
          </div>

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <AuthBrand
              variant="light"
              align="center"
              title="BandConnect Sign In"
              subtitle="Welcome back — select your role and enter credentials to continue."
            />
          </div>

          {/* Role Selector Tabs (4 Segmented Pills) */}
          <div className="w-full max-w-[360px] grid grid-cols-4 gap-1.5 p-1 bg-[#f7f7f8] border-2 border-gray-200 rounded-xl mb-6">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id);
                    setError("");
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${isSelected
                    ? "bg-black text-white shadow-sm font-bold"
                    : "text-[#5c5c66] hover:text-[#0a0a0f] hover:bg-white font-medium"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 mb-0.5 ${isSelected ? "text-[#c6ff3d]" : "text-[#5c5c66]"
                      }`}
                  />
                  <span className="text-[11px] font-bold leading-tight truncate w-full px-0.5">
                    {r.title}
                  </span>
                  <span
                    className={`text-[8px] ${isSelected ? "text-neutral-300" : "text-neutral-400"
                      }`}
                  >
                    {r.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Centered Form Block (Mukijo Standard 360px) */}
          <form
            className="block space-y-4 max-w-[360px] w-full text-left"
            onSubmit={handleSubmit}
          >
            <AuthField variant="light" label="Email Address" htmlFor="email" required>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
                  className={c.input}
                  style={{ paddingLeft: "42px" }}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </AuthField>

            <AuthField variant="light" label="Password" htmlFor="password" required>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <PasswordField
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  className={c.input}
                  inputStyle={{ paddingLeft: "42px" }}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  tone="light"
                />
              </div>
            </AuthField>

            {/* Error Banner */}
            {error && <AuthErrorBanner variant="light">{error}</AuthErrorBanner>}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[360px] mx-auto h-12 bg-[#c6ff3d] hover:bg-[#b8f52e] text-black font-black text-sm uppercase tracking-wide rounded-xl transition-all shadow-[0_4px_16px_rgba(198,255,61,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed !mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in as {ROLES.find((r) => r.id === role)?.title}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer Navigation Link */}
          {role !== "admin" && (
            <div className="w-full max-w-[360px] mt-4">
              <AuthNavLinks
                variant="light"
                showBackHome={false}
                footerPrompt="Don't have an account?"
                footerHref={`/band/register?role=${role}`}
                footerLabel={`Register as ${ROLES.find((r) => r.id === role)?.title}`}
              />
            </div>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
