"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Music,
  DollarSign,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Radio,
  MapPin,
  Mic2,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { getBandUser } from "@/lib/bandAuth";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ArtistProfilePage() {
  const { user } = useAuth();
  const [bandUser, setBandUser] = useState(null);
  const [activeTab, setActiveTab] = useState("identity"); // identity | music | media | pricing | rider
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    band_type: "Band", // Solo | Duo | Band
    genres: ["Bollywood Rock", "Sufi", "Indie Pop"],
    languages: ["Hindi", "English", "Punjabi"],
    city: "Mumbai",
    travel_radius_km: 250,
    base_price: 45000,
    hourly_rate: 15000,
    performance_duration_mins: 120,
    equipment_details: "6-channel digital mixer, 2 vocal wireless mics, 1 drum mic set",
    demo_audio_url: "",
    demo_video_url: "",
    verification_status: "approved",
    verification_notes: "",
  });

  const [newGenre, setNewGenre] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    const u = getBandUser();
    if (u) setBandUser(u);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await bandApi.get("/artists/me");
        if (res.data) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            name: d.display_name || d.name || bandUser?.name || user?.name || "Performer",
            username: d.username || "",
            bio: d.bio || "",
            band_type: d.band_type || "Band",
            genres: Array.isArray(d.genres) ? d.genres : d.genre ? [d.genre] : prev.genres,
            languages: Array.isArray(d.languages) ? d.languages : prev.languages,
            city: d.city || d.location || "Mumbai",
            travel_radius_km: d.travel_radius_km || 250,
            base_price: d.base_price || d.base_rate || 45000,
            hourly_rate: d.hourly_rate || 15000,
            performance_duration_mins: d.performance_duration_mins || 120,
            equipment_details: d.equipment_details || d.equipment || prev.equipment_details,
            demo_audio_url: d.demo_audio_url || "",
            demo_video_url: d.demo_video_url || "",
            verification_status: d.verification_status || "approved",
            verification_notes: d.verification_notes || "",
          }));
        }
      } catch {
        // Use initial form data
        if (bandUser?.name) {
          setFormData((prev) => ({ ...prev, name: bandUser.name }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [bandUser, user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGenre = () => {
    if (!newGenre.trim()) return;
    if (formData.genres.includes(newGenre.trim())) return;
    setFormData((prev) => ({ ...prev, genres: [...prev.genres, newGenre.trim()] }));
    setNewGenre("");
  };

  const handleRemoveGenre = (genre) => {
    setFormData((prev) => ({ ...prev, genres: prev.genres.filter((g) => g !== genre) }));
  };

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;
    if (formData.languages.includes(newLanguage.trim())) return;
    setFormData((prev) => ({ ...prev, languages: [...prev.languages, newLanguage.trim()] }));
    setNewLanguage("");
  };

  const handleRemoveLanguage = (lang) => {
    setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== lang) }));
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const response = await bandApi.put("/artists/me", {
        display_name: formData.name,
        username: formData.username.replace(/^@/, "").trim(),
        bio: formData.bio,
        band_type: formData.band_type,
        genres: formData.genres,
        languages: formData.languages,
        location: formData.city,
        base_rate: Number(formData.base_price),
        base_price: Number(formData.base_price),
        hourly_rate: Number(formData.hourly_rate),
        travel_radius_km: Number(formData.travel_radius_km),
        equipment_details: formData.equipment_details,
        demo_audio_url: formData.demo_audio_url,
        demo_video_url: formData.demo_video_url,
      });
      if (response?.data) {
        const d = response.data;
        setFormData((prev) => ({
          ...prev,
          name: d.display_name || prev.name,
          username: d.username || prev.username,
          base_price: d.base_price || d.base_rate || prev.base_price,
        }));
      }
      toast.success("Artist profile updated successfully!");
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || "Failed to save artist profile.";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    setVerifying(true);
    try {
      await bandApi.post("/artists/verify-submit");
      setFormData((prev) => ({ ...prev, verification_status: "pending" }));
      toast.success("Profile submitted for Admin verification!");
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || "Failed to submit verification.";
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const tabs = [
    { id: "identity", label: "Performer Identity", icon: User },
    { id: "music", label: "Genres & Taxonomy", icon: Music },
    { id: "pricing", label: "Rates & Logistics", icon: DollarSign },
    { id: "media", label: "Media & Demos", icon: ImageIcon },
    { id: "rider", label: "Stage Equipment", icon: Mic2 },
  ];

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              <Sparkles style={{ width: "13px", height: "13px" }} />
              <span>Artist Portfolio Setup</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Artist &amp; Band Profile Manager
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
              Manage your stage identity, music genres, performance rates, audio demos, and verification status.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "14px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 900,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
              }}
            >
              <Save style={{ width: "16px", height: "16px" }} />
              <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#ffffff",
            padding: "6px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: isActive ? "#0a0a0f" : "transparent",
                  color: isActive ? "#c6ff3d" : "#64748b",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon style={{ width: "16px", height: "16px", color: isActive ? "#c6ff3d" : "#64748b" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Identity & Bio */}
        {activeTab === "identity" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              Performer Identity &amp; Bio
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Stage / Performer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. The Groove Collective"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Unique Username (@handle) *
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", fontWeight: 800, color: "#94a3b8" }}>@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="groove_collective"
                    style={{ padding: "12px 16px 12px 32px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc", width: "100%" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Band Lineup Type
                </label>
                <select
                  value={formData.band_type}
                  onChange={(e) => handleInputChange("band_type", e.target.value)}
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                >
                  <option value="Solo">Solo Artist (Acoustic / DJ / Singer)</option>
                  <option value="Duo">Duo (Guitar + Vocals)</option>
                  <option value="Band">Full Live Band (3 - 8 Piece)</option>
                  <option value="Orchestra">Ensemble / Orchestra</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Base City / Location
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                Performer Biography &amp; Experience
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Describe your musical journey, noteworthy gigs, major festival appearances, and performance vibe..."
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#0a0a0f", fontWeight: 500, outline: "none", backgroundColor: "#f8fafc", resize: "vertical" }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Genres & Languages */}
        {activeTab === "music" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              Music Genres &amp; Performance Languages
            </h2>

            {/* Genres */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                Musical Genres
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {formData.genres.map((genre) => (
                  <span
                    key={genre}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      backgroundColor: "#0a0a0f",
                      color: "#c6ff3d",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    <span>{genre}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", maxWidth: "400px" }}>
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddGenre())}
                  placeholder="Add genre (e.g. Jazz, Sufi, Rock)"
                  style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#0a0a0f", outline: "none", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddGenre}
                  style={{ padding: "10px 16px", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#0a0a0f", fontWeight: 800, fontSize: "12px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Languages */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                Singing / Performance Languages
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {formData.languages.map((lang) => (
                  <span
                    key={lang}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      backgroundColor: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #a7f3d0",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    <span>{lang}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      style={{ background: "none", border: "none", color: "#047857", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", maxWidth: "400px" }}>
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLanguage())}
                  placeholder="Add language (e.g. Hindi, English, Punjabi)"
                  style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#0a0a0f", outline: "none", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  style={{ padding: "10px 16px", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#0a0a0f", fontWeight: 800, fontSize: "12px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rates & Logistics */}
        {activeTab === "pricing" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              Performance Rates &amp; Travel Logistics
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Base Gig Rate (₹ per show) *
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange("base_price", e.target.value)}
                  placeholder="45000"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Hourly Rate (₹ per extra hour)
                </label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                  placeholder="15000"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Default Performance Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.performance_duration_mins}
                  onChange={(e) => handleInputChange("performance_duration_mins", e.target.value)}
                  placeholder="120"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                  Max Travel Radius (km)
                </label>
                <input
                  type="number"
                  value={formData.travel_radius_km}
                  onChange={(e) => handleInputChange("travel_radius_km", e.target.value)}
                  placeholder="250"
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Media & Demos */}
        {activeTab === "media" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              Audio &amp; Video Performance Demos
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                YouTube / Live Video Demo Link
              </label>
              <input
                type="url"
                value={formData.demo_video_url}
                onChange={(e) => handleInputChange("demo_video_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                SoundCloud / Audio Track Stream Link
              </label>
              <input
                type="url"
                value={formData.demo_audio_url}
                onChange={(e) => handleInputChange("demo_audio_url", e.target.value)}
                placeholder="https://soundcloud.com/..."
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Stage Equipment Rider */}
        {activeTab === "rider" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              Technical Rider &amp; Stage Gear
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>
                Equipment Provided vs Required by Venue
              </label>
              <textarea
                rows={5}
                value={formData.equipment_details}
                onChange={(e) => handleInputChange("equipment_details", e.target.value)}
                placeholder="List instruments, vocal microphones, mixers, monitor wedges, DI boxes, and stage power requirements..."
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#0a0a0f", fontWeight: 500, outline: "none", backgroundColor: "#f8fafc", resize: "vertical" }}
              />
            </div>
          </div>
        )}

        {/* Admin Verification Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block" }}>
              Admin Verification Status
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              {formData.verification_status === "approved" ? (
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#047857", backgroundColor: "#ecfdf5", padding: "4px 12px", borderRadius: "9999px", border: "1px solid #a7f3d0" }}>
                  ✓ Approved for Marketplace Listing
                </span>
              ) : formData.verification_status === "pending" ? (
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#92400e", backgroundColor: "#fef3c7", padding: "4px 12px", borderRadius: "9999px", border: "1px solid #fde68a" }}>
                  ⏳ Verification In Review
                </span>
              ) : (
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#b91c1c", backgroundColor: "#fef2f2", padding: "4px 12px", borderRadius: "9999px", border: "1px solid #fecdd3" }}>
                  ⚠️ Unverified Profile
                </span>
              )}
            </div>
          </div>

          {formData.verification_status !== "approved" && (
            <button
              type="button"
              onClick={handleSubmitVerification}
              disabled={verifying || formData.verification_status === "pending"}
              style={{
                padding: "11px 22px",
                borderRadius: "12px",
                backgroundColor: "#0a0a0f",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: formData.verification_status === "pending" ? "default" : "pointer",
                opacity: formData.verification_status === "pending" ? 0.6 : 1,
              }}
            >
              {verifying ? "Submitting..." : formData.verification_status === "pending" ? "Submitted for Review" : "Submit for Verification"}
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
