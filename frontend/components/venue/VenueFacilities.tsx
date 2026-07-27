"use client";

import * as React from "react";
import { VenueFacilitiesData } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Save
} from "lucide-react";
import toast from "react-hot-toast";

interface VenueFacilitiesProps {
  data: VenueFacilitiesData;
  onSave: (updated: VenueFacilitiesData) => Promise<void>;
}

interface FacilityDefinition {
  id: string;
  label: string;
  category: "Space" | "Amenities" | "Technical" | "Access";
  icon: any;
  fields: Array<{
    key: string;
    label: string;
    type: "number" | "text" | "boolean";
    placeholder?: string;
  }>;
}

const DEFAULT_FACILITIES: FacilityDefinition[] = [
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

export function VenueFacilities({ data, onSave }: VenueFacilitiesProps) {
  const [activeFacilities, setActiveFacilities] = React.useState<string[]>(data.facilities || []);
  const [facilityDetails, setFacilityDetails] = React.useState<Record<string, any>>(data.details || {});

  // Custom facilities list (derived from core facilities starting with "Custom:")
  const [customFacList, setCustomFacList] = React.useState<Array<{ name: string; desc: string }>>(() => {
    const list: Array<{ name: string; desc: string }> = [];
    if (data.facilities) {
      data.facilities.forEach(fac => {
        if (fac.startsWith("Custom:")) {
          const name = fac.replace("Custom:", "");
          const desc = data.details[fac]?.description || "";
          list.push({ name, desc });
        }
      });
    }
    return list;
  });

  const [saving, setSaving] = React.useState(false);

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"All" | "Space" | "Amenities" | "Technical" | "Access" | "Custom">("All");
  const [statusFilter, setStatusFilter] = React.useState<"All" | "Active" | "Inactive">("All");

  // Custom Facilities creator inputs
  const [customName, setCustomName] = React.useState("");
  const [customDesc, setCustomDesc] = React.useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      // Re-compile core facilities to merge custom list
      const coreFacs = activeFacilities.filter(f => !f.startsWith("Custom:"));
      const customKeys = customFacList.map(c => `Custom:${c.name}`);
      const finalFacilities = [...coreFacs, ...customKeys];

      // Re-compile details including custom definitions
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

  const toggleFacility = (facilityId: string) => {
    setActiveFacilities(prev => {
      if (prev.includes(facilityId)) {
        return prev.filter(id => id !== facilityId);
      } else {
        return [...prev, facilityId];
      }
    });
  };

  const updateDetailField = (facId: string, fieldKey: string, val: any) => {
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

  const handleRemoveCustomFacility = (name: string) => {
    setCustomFacList(prev => prev.filter(c => c.name !== name));
    setFacilityDetails(prev => {
      const copy = { ...prev };
      delete copy[`Custom:${name}`];
      return copy;
    });
    toast.success(`Custom facility "${name}" removed.`);
  };

  // Filter facilities lists
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
    <div className="space-y-8 bg-bg-card/45 backdrop-blur-md border border-border/80 p-6 md:p-8 rounded-3xl shadow-xl">
      
      {/* Header */}
      <div className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-text-primary">Amenities & Facilities Management</h2>
          <p className="text-xs text-text-secondary">Enable default spaces/utilities, input capacities, and configure custom facilities.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 flex items-center gap-1.5 self-start sm:self-center"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving Amenities..." : "Save Facilities"}</span>
        </Button>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-text-muted" />
          <Input 
            placeholder="Search facility name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Category:</span>
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="h-8.5 px-2.5 rounded-lg border border-border bg-bg-card text-text-primary text-[11px]"
            >
              <option value="All">All Categories</option>
              <option value="Space">Halls & Spaces</option>
              <option value="Amenities">General Amenities</option>
              <option value="Technical">Technical Setup</option>
              <option value="Access">Accessibility</option>
              <option value="Custom">Custom Items</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-8.5 px-2.5 rounded-lg border border-border bg-bg-card text-text-primary text-[11px]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Standard checklist selector */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-primary" />
            Standard Checklist
          </h3>

          <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredDefault.map(fac => {
              const active = activeFacilities.includes(fac.id);
              const IconComp = fac.icon;
              return (
                <div 
                  key={fac.id}
                  className={`p-3.5 border rounded-xl flex items-center justify-between transition-colors ${
                    active ? "bg-primary/5 border-primary/65" : "bg-bg-elevated/5 border-border/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`p-2 rounded-lg border ${
                      active ? "bg-primary/10 border-primary/20 text-primary" : "bg-bg-elevated border-border/80 text-text-muted"
                    }`}>
                      <IconComp className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text-primary leading-snug">{fac.label}</p>
                      <p className="text-[10px] text-text-muted capitalize">{fac.category} Category</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFacility(fac.id)}
                    className={`h-7 px-3.5 text-[10px] font-bold rounded-lg border transition-all ${
                      active 
                        ? "bg-primary text-white border-primary hover:bg-primary/90" 
                        : "bg-transparent border-border text-text-secondary hover:text-white hover:border-text-secondary"
                    }`}
                  >
                    {active ? "Active" : "Enable"}
                  </button>
                </div>
              );
            })}
            {filteredDefault.length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-8">No standard facilities match search/filters.</p>
            )}
          </div>
        </div>

        {/* Right Column: Specifications Forms for Active Facilities */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-primary" />
            Active Specifications
          </h3>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {DEFAULT_FACILITIES.map(fac => {
              const active = activeFacilities.includes(fac.id);
              if (!active) return null;

              const facDetails = facilityDetails[fac.id] || {};

              return (
                <Card key={fac.id} className="bg-bg-card/45 backdrop-blur-md border border-border/85 rounded-xl shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                      <fac.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-text-primary">{fac.label} Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {fac.fields.map(f => {
                        const val = facDetails[f.key] !== undefined ? facDetails[f.key] : "";
                        return (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-[10px] text-text-secondary">{f.label}</Label>
                            {f.type === "boolean" ? (
                              <select
                                value={val === "" ? "false" : String(val)}
                                onChange={e => updateDetailField(fac.id, f.key, e.target.value === "true")}
                                className="w-full h-8 px-2 rounded border border-border bg-bg-card text-text-primary text-[11px]"
                              >
                                <option value="false">No / Disabled</option>
                                <option value="true">Yes / Enabled</option>
                              </select>
                            ) : (
                              <Input 
                                type={f.type === "number" ? "number" : "text"}
                                value={val}
                                placeholder={f.placeholder}
                                onChange={e => updateDetailField(
                                  fac.id, 
                                  f.key, 
                                  f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
                                )}
                                className="h-8 text-xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {activeFacilities.filter(id => !id.startsWith("Custom:")).length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-8">Enable facilities from the checklist to configure details.</p>
            )}
          </div>
        </div>

      </div>

      {/* Custom Facilities Builder Section */}
      {showCustomSection && (
        <div className="pt-6 border-t border-border/50 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Grid className="h-4.5 w-4.5 text-primary" />
              Add Custom Venue Facilities
            </h3>
            <p className="text-[11px] text-text-secondary">Got unique highlights? (e.g. Helipad, Swimming Pool, Open Kitchen). Register them below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="custom_name">Facility Name</Label>
              <Input 
                id="custom_name" 
                placeholder="e.g. Swimming Pool" 
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="h-9.5 text-xs"
              />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="custom_desc">Description / Capacity</Label>
              <Input 
                id="custom_desc" 
                placeholder="e.g. Length 25m, depth 4.5ft" 
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                className="h-9.5 text-xs"
              />
            </div>
            <Button onClick={handleAddCustomFacility} className="bg-primary text-white h-9.5 font-bold flex items-center justify-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Custom Facility</span>
            </Button>
          </div>

          {/* Custom Facilities Tags list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {customFacList.map((custom, idx) => (
              <div key={idx} className="p-3 border border-border bg-bg-card/80 rounded-2xl flex items-start justify-between relative group">
                <div className="space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] py-0.5 uppercase font-bold">
                    Custom Spec
                  </Badge>
                  <p className="text-xs font-bold text-text-primary">{custom.name}</p>
                  <p className="text-[10px] text-text-secondary leading-snug">{custom.desc || "No specifications description"}</p>
                </div>

                <button 
                  onClick={() => handleRemoveCustomFacility(custom.name)}
                  className="text-error hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {customFacList.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-text-muted italic border border-dashed border-border rounded-xl">
                No custom facilities registered yet.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
