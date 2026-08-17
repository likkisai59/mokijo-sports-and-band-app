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
import { bandRegister } from "@/lib/bandAuth";
import { getRoleDashboard } from "@/utils/role-routes";
import { User, Music, Building2, ArrowRight, ArrowLeft } from "lucide-react";
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
];

export default function BandRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "client";

  const [role, setRole] = React.useState(
    ["client", "artist", "venue_owner"].includes(initialRole) ? initialRole : "client"
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    username: "",
    venue_name: "",
  });

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: role,
        phone: form.phone.trim() || undefined,
      };

      const res = await bandRegister(payload);
      toast.success(`Account created! Welcome, ${res.user.name}!`);

      // Guaranteed direct redirection to role-based dashboard
      const targetDashboard = getRoleDashboard(res.user.role);
      window.location.href = targetDashboard;
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Registration failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="light">
      <AuthCard size="register" variant="light">
        <div className="flex flex-col items-center justify-center w-full">
          {/* Back Link */}
          <div className="w-full flex justify-start mb-4">
            <Link
              href="/band/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#5c5c66] hover:text-[#0a0a0f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Login</span>
            </Link>
          </div>

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <AuthBrand
              variant="light"
              align="center"
              title="Create BandConnect Account"
              subtitle="Direct dashboard access — no email verification wait required."
            />
          </div>

          {/* Role Selector Tabs (Pill Segmented Group) */}
          <div className="w-full max-w-[380px] grid grid-cols-3 gap-2 p-1 bg-[#f7f7f8] border-2 border-gray-200 rounded-xl mb-6">
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
                  <span className="text-xs font-bold leading-tight">{r.title}</span>
                  <span
                    className={`text-[9px] ${isSelected ? "text-neutral-300" : "text-neutral-400"
                      }`}
                  >
                    {r.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Centered Form Block (Mukijo Standard 380px) */}
          <form
            className="block space-y-4 max-w-[380px] w-full text-left"
            onSubmit={handleSubmit}
          >
            {/* Full Name */}
            <AuthField
              variant="light"
              label={
                role === "artist"
                  ? "Performer / Band Name"
                  : role === "venue_owner"
                    ? "Owner / Business Name"
                    : "Full Name"
              }
              htmlFor="name"
              required
            >
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder={
                  role === "artist"
                    ? "e.g., The Groove Collective"
                    : role === "venue_owner"
                      ? "e.g., Rajesh Sharma"
                      : "e.g., Ananya Sharma"
                }
                className={c.input}
                required
              />
            </AuthField>

            {/* Artist Unique Username */}
            {role === "artist" && (
              <AuthField
                variant="light"
                label="Public Artist Username (without @)"
                htmlFor="username"
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono font-bold">
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="thegrooveband"
                    className={`${c.input} pl-8 font-mono`}
                  />
                </div>
              </AuthField>
            )}

            {/* Venue Entity Name */}
            {role === "venue_owner" && (
              <AuthField variant="light" label="Venue Entity Name" htmlFor="venue_name">
                <input
                  id="venue_name"
                  name="venue_name"
                  type="text"
                  value={form.venue_name}
                  onChange={handleChange}
                  placeholder="e.g., Skyline Grand Arena"
                  className={c.input}
                />
              </AuthField>
            )}

            {/* Email Address */}
            <AuthField variant="light" label="Email Address" htmlFor="email" required>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@domain.com"
                className={c.input}
                required
              />
            </AuthField>

            {/* Phone Number */}
            <AuthField variant="light" label="Phone Number" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className={c.input}
              />
            </AuthField>

            {/* Password */}
            <AuthField variant="light" label="Password" htmlFor="password" required>
              <PasswordField
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                tone="light"
                className={c.input}
                required
              />
            </AuthField>

            {/* Confirm Password */}
            <AuthField
              variant="light"
              label="Confirm Password"
              htmlFor="confirmPassword"
              required
            >
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                tone="light"
                className={c.input}
                required
              />
            </AuthField>

            {/* Error Banner */}
            {error && <AuthErrorBanner variant="light">{error}</AuthErrorBanner>}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[380px] mx-auto h-12 bg-[#c6ff3d] hover:bg-[#b8f52e] text-black font-black text-sm uppercase tracking-wide rounded-xl transition-all shadow-[0_4px_16px_rgba(198,255,61,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed !mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Register as {ROLES.find((r) => r.id === role)?.title}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="w-full max-w-[380px] mt-4">
            <AuthNavLinks
              variant="light"
              showBackHome={false}
              footerPrompt="Already have an account?"
              footerHref={`/band/login?role=${role}`}
              footerLabel="Log in here"
            />
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
