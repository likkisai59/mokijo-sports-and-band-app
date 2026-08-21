"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Grid, 
  Users, 
  Sparkles, 
  Calendar, 
  Video,
  FileCheck,
  CheckCircle2,
  Phone,
  Compass,
  Star
} from "lucide-react";

const FACILITY_OPTIONS = [
  { id: "parking", label: "Parking Space" },
  { id: "ac", label: "Air Conditioning (AC)" },
  { id: "generator", label: "Generator / Power Backup" },
  { id: "stage", label: "Elevated Stage" },
  { id: "sound_system", label: "Sound System" },
  { id: "lighting", label: "Lighting setup" },
  { id: "green_room", label: "Green Room / Makeup Space" },
  { id: "dining_hall", label: "Dining Hall" },
  { id: "kitchen", label: "Kitchen Space" },
  { id: "rest_rooms", label: "Rest Rooms" },
  { id: "wheelchair_access", label: "Wheelchair Access" },
  { id: "lift", label: "Passenger Lift" },
  { id: "wifi", label: "Guest WiFi" },
  { id: "cctv", label: "CCTV Security" },
  { id: "security", label: "Guard Security" },
  { id: "power_backup", label: "Power Backup" },
  { id: "decoration_support", label: "Decoration Support" },
  { id: "catering_support", label: "Catering Support" }
];

export function VenueProfilePreview({ profile }) {
  const weeklySchedule = profile.availability_rules?.weekly_schedule || {};
  const blockedDates = profile.availability_rules?.blocked_dates || [];
  const maintenanceDays = profile.availability_rules?.maintenance_days || [];
  const youtubeLinks = profile.metadata_fields?.youtube_links || [];
  const gallery = profile.metadata_fields?.gallery || [];
  const coverImage = profile.cover_image || profile.image_url;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* ── Hero Banner Card ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* Banner Image or Gradient */}
        <div
          style={{
            height: "220px",
            position: "relative",
            backgroundColor: "#0a0a0f",
            background: coverImage 
              ? `url(${coverImage}) center / cover no-repeat`
              : "linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 100%)",
            display: "flex",
            alignItems: "flex-end",
            padding: "20px 32px",
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(10, 10, 15, 0.45)" }} />
          
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ backgroundColor: "#c6ff3d", color: "#0a0a0f", fontSize: "11px", fontWeight: 900, padding: "4px 12px", borderRadius: "8px", textTransform: "uppercase" }}>
              {profile.venue_type || "Event Space"}
            </span>
            <span style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", color: "#ffffff", fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "8px" }}>
              Est. {profile.metadata_fields?.established_year || "2020"}
            </span>
          </div>
        </div>

        {/* Identity Row */}
        <div style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                {profile.name}
              </h1>
              <span style={{ backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "10.5px", fontWeight: 900, padding: "3px 10px", borderRadius: "6px", textTransform: "uppercase" }}>
                {profile.verification_status || "Verified Space"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
              <MapPin style={{ width: "15px", height: "15px", color: "#0a0a0f" }} />
              <span>{profile.city?.name || profile.city_id || "Hyderabad"}, {profile.state || "Telangana"}</span>
              <span>•</span>
              <span>{profile.metadata_fields?.indoor_outdoor || "Indoor & Outdoor"}</span>
            </div>
          </div>

          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 24px", borderRadius: "16px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block" }}>Audience Capacity</span>
            <span style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "2px" }}>
              {profile.capacity} Guests
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Split: Details vs Sidebar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr)) 340px", gap: "24px" }}>
        
        {/* Main Content Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* About Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
                <Sparkles style={{ width: "16px", height: "16px" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                About The Performance Space
              </h2>
            </div>
            <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.6, margin: 0, fontWeight: 500, whiteSpace: "pre-line" }}>
              {profile.description || "No space description provided yet. Update in Venue Details."}
            </p>
          </div>

          {/* Amenities Badges Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
                <Grid style={{ width: "16px", height: "16px" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Included Amenities &amp; Facilities
              </h2>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {FACILITY_OPTIONS.map(opt => {
                const hasFacility = profile.facilities?.includes(opt.id);
                if (!hasFacility) return null;
                return (
                  <span
                    key={opt.id}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#0a0a0f",
                      color: "#c6ff3d",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    ✓ {opt.label}
                  </span>
                );
              })}
              {(!profile.facilities || profile.facilities.length === 0) && (
                <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                  No facilities configured. Update in Facilities &amp; Specs tab.
                </span>
              )}
            </div>
          </div>

          {/* Operating Schedule */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
                <Clock style={{ width: "16px", height: "16px" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Weekly Operating Schedule &amp; Sound Curfews
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
              {Object.keys(weeklySchedule).map((day) => {
                const item = weeklySchedule[day];
                return (
                  <div
                    key={day}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#0a0a0f" }}>{day}</span>
                    {item.available ? (
                      <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                        {item.start} - {item.end}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700 }}>Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Location Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <MapPin style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>Physical Location</h3>
            </div>
            <p style={{ fontSize: "13px", color: "#334155", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              {profile.address || "Address not provided"}
            </p>
            {profile.metadata_fields?.landmark && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>Landmark: {profile.metadata_fields.landmark}</span>
            )}
            <span style={{ fontSize: "12px", color: "#64748b" }}>Pincode: {profile.pincode}</span>
            {profile.google_map_location && (
              <a
                href={profile.google_map_location}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#0a0a0f",
                  backgroundColor: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  marginTop: "6px",
                }}
              >
                <span>Open Google Maps</span> ↗
              </a>
            )}
          </div>

          {/* Contact Representative */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <FileCheck style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>Host Details</h3>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Legal Representative</span>
              <div style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", marginTop: "2px" }}>
                {profile.user?.name || profile.business_name || "Venue Host"}
              </div>
            </div>
            {profile.metadata_fields?.contact_person && (
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Booking Manager</span>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0a0a0f", marginTop: "2px" }}>
                  {profile.metadata_fields.contact_person}
                </div>
              </div>
            )}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Registered Email</span>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0a0a0f", marginTop: "2px" }}>
                {profile.user?.email || "N/A"}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
