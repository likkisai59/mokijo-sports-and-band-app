"use client";

import * as React from "react";
import { 
  Car, 
  Wind, 
  Zap, 
  Layers, 
  Volume2, 
  Lightbulb, 
  Sparkles, 
  Utensils, 
  Flame, 
  Home, 
  Users, 
  Accessibility, 
  Wifi, 
  ArrowUpDown, 
  Shield, 
  Grid,
  Plus, 
  Trash2, 
  Search, 
  Sliders, 
  Save,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_FACILITIES = [
  {
    id: "parking",
    label: "Parking Space",
    category: "Space",
    icon: Car,
    fields: [
      { key: "slots", label: "Parking Slots Count", type: "number", placeholder: "e.g. 150" },
      { key: "valet", label: "Valet Service Available", type: "boolean" }
    ]
  },
  {
    id: "dining_hall",
    label: "Dining Hall",
    category: "Space",
    icon: Utensils,
    fields: [
      { key: "capacity", label: "Dining Seating Capacity", type: "number", placeholder: "e.g. 300" },
      { key: "catering_support", label: "In-house Catering Support", type: "boolean" }
    ]
  },
  {
    id: "kitchen",
    label: "Kitchen Space",
    category: "Space",
    icon: Flame,
    fields: [
      { key: "sqft", label: "Kitchen Size (SqFt)", type: "number", placeholder: "e.g. 500" },
      { key: "gas_lines", label: "Gas Lines Count", type: "number", placeholder: "e.g. 4" }
    ]
  },
  {
    id: "rooms",
    label: "Guest Rooms",
    category: "Space",
    icon: Home,
    fields: [
      { key: "count", label: "Total Rooms Count", type: "number", placeholder: "e.g. 10" },
      { key: "suite_rooms", label: "AC Suite Rooms Count", type: "number", placeholder: "e.g. 2" }
    ]
  },
  {
    id: "stage",
    label: "Elevated Stage",
    category: "Space",
    icon: Layers,
    fields: [
      { key: "dimensions", label: "Stage Dimensions (WxD in ft)", type: "text", placeholder: "e.g. 24x12" },
      { key: "height", label: "Stage Height (ft)", type: "number", placeholder: "e.g. 3" }
    ]
  },
  {
    id: "green_room",
    label: "Green / Makeup Room",
    category: "Space",
    icon: Sparkles,
    fields: [
      { key: "count", label: "Makeup Rooms Count", type: "number", placeholder: "e.g. 2" },
      { key: "attached_bathroom", label: "Attached Washroom Included", type: "boolean" }
    ]
  },
  {
    id: "power_backup",
    label: "Power Backup",
    category: "Technical",
    icon: Zap,
    fields: [
      { key: "duration_hours", label: "Backup Duration (Hours)", type: "number", placeholder: "e.g. 6" },
      { key: "auto_switch", label: "Automatic Switching (AMF)", type: "boolean" }
    ]
  },
  {
    id: "generator",
    label: "Generator Set",
    category: "Technical",
    icon: Zap,
    fields: [
      { key: "capacity_kva", label: "Generator Capacity (kVA)", type: "number", placeholder: "e.g. 125" },
      { key: "diesel_included", label: "Diesel Charges Included in Rent", type: "boolean" }
    ]
  },
  {
    id: "ac",
    label: "Air Conditioning (AC)",
    category: "Amenities",
    icon: Wind,
    fields: [
      { key: "tonnage", label: "Central AC Capacity (Tons)", type: "number", placeholder: "e.g. 60" },
      { key: "central", label: "Centralized Ducting", type: "boolean" }
    ]
  },
  {
    id: "lighting",
    label: "Lighting Setup",
    category: "Technical",
    icon: Lightbulb,
    fields: [
      { key: "stage_lights", label: "Stage Focus Lights Provided", type: "boolean" },
      { key: "ambient_dimming", label: "Ambient Lighting Dimmer", type: "boolean" }
    ]
  },
  {
    id: "sound_system",
    label: "Sound System",
    category: "Technical",
    icon: Volume2,
    fields: [
      { key: "power_watts", label: "Sound System Output (Watts)", type: "number", placeholder: "e.g. 2000" },
      { key: "mics_provided", label: "Cordless Microphones Provided", type: "number", placeholder: "e.g. 4" }
    ]
  },
  {
    id: "security",
    label: "Guard Security",
    category: "Amenities",
    icon: Shield,
    fields: [
      { key: "guards_count", label: "Guards Count on Duty", type: "number", placeholder: "e.g. 4" },
      { key: "cctv_monitored", label: "CCTV Security Monitored", type: "boolean" }
    ]
  },
  {
    id: "wheelchair_access",
    label: "Wheelchair Accessibility",
    category: "Access",
    icon: Accessibility,
    fields: [
      { key: "ramps_available", label: "Entrance Ramps Available", type: "boolean" },
      { key: "washroom_adapted", label: "Adapted Toilet Rooms", type: "boolean" }
    ]
  },
  {
    id: "wifi",
    label: "Guest WiFi",
    category: "Amenities",
    icon: Wifi,
    fields: [
      { key: "speed_mbps", label: "Internet Speed (Mbps)", type: "number", placeholder: "e.g. 100" },
      { key: "unlimited", label: "Unlimited Free Access", type: "boolean" }
    ]
  },
  {
    id: "lift",
    label: "Passenger Lift",
    category: "Access",
    icon: ArrowUpDown,
    fields: [
      { key: "capacity_pax", label: "Lift Carrying Capacity (Pax)", type: "number", placeholder: "e.g. 10" },
      { key: "service_lift", label: "Dedicated Cargo Service Lift", type: "boolean" }
    ]
  },
  {
    id: "rest_rooms",
    label: "Rest Rooms",
    category: "Amenities",
    icon: Users,
    fields: [
      { key: "male_count", label: "Male Washroom Cabins Count", type: "number", placeholder: "e.g. 5" },
      { key: "female_count", label: "Female Washroom Cabins Count", type: "number", placeholder: "e.g. 6" }
    ]
  }
];

export function VenueFacilities({ data, onSave }) {
  const [activeFacilities, setActiveFacilities] = React.useState(data.facilities || []);
  const [facilityDetails, setFacilityDetails] = React.useState(data.details || {});

  const [customFacList, setCustomFacList] = React.useState(() => {
    const list = [];
    if (data.facilities) {
      data.facilities.forEach(fac => {
        if (fac.startsWith("Custom:")) {
          const name = fac.replace("Custom:", "");
          const desc = data.details?.[fac]?.description || "";
          list.push({ name, desc });
        }
      });
    }
    return list;
  });

  const [saving, setSaving] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const [customName, setCustomName] = React.useState("");
  const [customDesc, setCustomDesc] = React.useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      const coreFacs = activeFacilities.filter(f => !f.startsWith("Custom:"));
      const customKeys = customFacList.map(c => `Custom:${c.name}`);
      const finalFacilities = [...coreFacs, ...customKeys];

      const finalDetails = { ...facilityDetails };
      customFacList.forEach(c => {
        const key = `Custom:${c.name}`;
        finalDetails[key] = {
          description: c.desc,
          active: true
        };
      });

      await onSave({
        facilities: finalFacilities,
        details: finalDetails
      });
      toast.success("Venue facilities and spec parameters saved!");
    } catch {
      toast.error("Failed to update venue facilities.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFacility = (facilityId) => {
    setActiveFacilities(prev => {
      if (prev.includes(facilityId)) {
        return prev.filter(id => id !== facilityId);
      } else {
        return [...prev, facilityId];
      }
    });
  };

  const updateDetailField = (facId, fieldKey, val) => {
    setFacilityDetails(prev => ({
      ...prev,
      [facId]: {
        ...prev[facId],
        [fieldKey]: val
      }
    }));
  };

  const handleAddCustomFacility = () => {
    if (!customName.trim()) {
      toast.error("Custom facility name cannot be blank.");
      return;
    }
    const cleanName = customName.trim();
    if (customFacList.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error("Custom facility already exists.");
      return;
    }

    setCustomFacList(prev => [...prev, { name: cleanName, desc: customDesc }]);
    setCustomName("");
    setCustomDesc("");
    toast.success(`Custom facility "${cleanName}" added!`);
  };

  const handleRemoveCustomFacility = (name) => {
    setCustomFacList(prev => prev.filter(c => c.name !== name));
    setFacilityDetails(prev => {
      const copy = { ...prev };
      delete copy[`Custom:${name}`];
      return copy;
    });
    toast.success(`Custom facility "${name}" removed.`);
  };

  const filteredDefault = DEFAULT_FACILITIES.filter(fac => {
    const matchesSearch = fac.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "All" || fac.category === categoryFilter;
    
    const isActive = activeFacilities.includes(fac.id);
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Active" && isActive) || 
      (statusFilter === "Inactive" && !isActive);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const showCustomSection = categoryFilter === "All" || categoryFilter === "Custom";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
      }}
    >
      {/* ── Top Header & Save Banner ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Sliders style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.01em" }}>
              Amenities &amp; Technical Rigging Specs
            </h1>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Enable available infrastructure, sound output, power capabilities, and custom venue assets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 28px",
            borderRadius: "14px",
            backgroundColor: "#c6ff3d",
            color: "#0a0a0f",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <Save style={{ width: "17px", height: "17px" }} />
          <span>{saving ? "Saving Changes..." : "Save Facilities"}</span>
        </button>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.015)",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
          <Search style={{ position: "absolute", left: "14px", top: "13px", width: "16px", height: "16px", color: "#94a3b8" }} />
          <input
            placeholder="Search facility name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 16px 0 40px",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              color: "#0a0a0f",
              fontWeight: 600,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#64748b" }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All">All Categories</option>
              <option value="Space">Halls &amp; Spaces</option>
              <option value="Amenities">General Amenities</option>
              <option value="Technical">Technical Setup</option>
              <option value="Access">Accessibility</option>
              <option value="Custom">Custom Items</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#64748b" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only ({activeFacilities.length})</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section: Custom Venue Facilities ── */}
      {showCustomSection && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px 32px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
              <Plus style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Register Custom Space Facilities
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
                Got unique property highlights? (e.g. Helipad, Swimming Pool, Open Terrace Lounge). Add them below.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) 160px",
              gap: "14px",
              alignItems: "flex-end",
              backgroundColor: "#f8fafc",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>Facility Name</label>
              <input
                placeholder="e.g. Infinity Swimming Pool"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                style={{
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  color: "#0a0a0f",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>Description / Capacity</label>
              <input
                placeholder="e.g. Length 25m, heated water, 4.5ft depth"
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                style={{
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  color: "#0a0a0f",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddCustomFacility}
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "10px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontWeight: 900,
                fontSize: "12.5px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              <span>Add Facility</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {customFacList.map((custom, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", backgroundColor: "rgba(198, 255, 61, 0.2)", color: "#0a0a0f", padding: "2px 8px", borderRadius: "6px" }}>
                    Custom Spec
                  </span>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0a0a0f", marginTop: "6px" }}>
                    {custom.name}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>
                    {custom.desc || "No special constraints defined"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCustomFacility(custom.name)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e11d48",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            ))}

            {customFacList.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "24px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "14px", color: "#94a3b8", fontSize: "12.5px", fontWeight: 600 }}>
                No custom facilities registered yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
