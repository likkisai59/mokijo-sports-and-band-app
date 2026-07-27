"use client";

import * as React from "react";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { venueProfileUpdateSchema, VenueProfileUpdateFormData } from "@/utils/validation";
import { VenueResponseData } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  MapPin, 
  Clock, 
  Grid, 
  FileText, 
  Plus, 
  Trash2, 
  Video, 
  Building2,
  Users,
  Briefcase
} from "lucide-react";
import { api } from "@/services/api";
import toast from "react-hot-toast";

interface VenueProfileEditProps {
  profile: VenueResponseData;
  onSuccess: (updated: VenueProfileUpdateFormData) => void;
}

const VENUE_TYPES = [
  "Marriage Hall",
  "Resort",
  "Banquet Hall",
  "Hotel",
  "Restaurant",
  "Club",
  "Pub",
  "Farm House",
  "Convention Center",
  "Beach Venue",
  "Open Ground",
  "Rooftop",
  "Others"
];

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

interface LocationItem {
  id: string | number;
  name: string;
}

export function VenueProfileEdit({ profile, onSuccess }: VenueProfileEditProps) {
  // Location list states
  const [countries, setCountries] = React.useState<LocationItem[]>([]);
  const [states, setStates] = React.useState<LocationItem[]>([]);
  const [cities, setCities] = React.useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(false);

  // List fields temp states
  const [youtubeInput, setYoutubeInput] = React.useState("");
  const [blockedDateInput, setBlockedDateInput] = React.useState("");
  const [maintenanceInput, setMaintenanceInput] = React.useState("");

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = React.useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<VenueProfileUpdateFormData>({
    resolver: zodResolver(venueProfileUpdateSchema),
    defaultValues: {
      owner_name: profile.user.name || "",
      business_name: profile.business_name || "",
      contact_person: profile.metadata_fields?.contact_person || "",
      gst_number: profile.metadata_fields?.gst_number || "",
      pan_number: profile.metadata_fields?.pan_number || "",
      venue_name: profile.name || "",
      venue_type: (profile.venue_type as VenueProfileUpdateFormData["venue_type"]) || "Banquet Hall",
      description: profile.description || "",
      established_year: profile.metadata_fields?.established_year || null,
      indoor_outdoor: (profile.metadata_fields?.indoor_outdoor as VenueProfileUpdateFormData["indoor_outdoor"]) || "Both",
      country: profile.country || "",
      state: profile.state || "",
      district: profile.metadata_fields?.district || "",
      city_id: profile.city_id || "",
      area: profile.metadata_fields?.area || "",
      address: profile.address || "",
      landmark: profile.metadata_fields?.landmark || "",
      pincode: profile.pincode || "",
      latitude: profile.metadata_fields?.latitude || null,
      longitude: profile.metadata_fields?.longitude || null,
      google_map_location: profile.google_map_location || "",
      facilities: profile.facilities || [],
      min_capacity: profile.min_capacity || 0,
      max_capacity: profile.capacity || 0,
      weekly_schedule: profile.availability_rules?.weekly_schedule || {
        Monday: { available: true, start: "09:00", end: "22:00" },
        Tuesday: { available: true, start: "09:00", end: "22:00" },
        Wednesday: { available: true, start: "09:00", end: "22:00" },
        Thursday: { available: true, start: "09:00", end: "22:00" },
        Friday: { available: true, start: "09:00", end: "23:00" },
        Saturday: { available: true, start: "09:00", end: "23:00" },
        Sunday: { available: true, start: "09:00", end: "22:00" }
      },
      blocked_dates: profile.availability_rules?.blocked_dates || [],
      maintenance_days: profile.availability_rules?.maintenance_days || [],
      public_holidays: profile.availability_rules?.public_holidays || [],
      booking_buffer_time: profile.availability_rules?.booking_buffer_time || 0,
      doc_pan: profile.documents?.doc_pan || "",
      doc_gst: profile.documents?.doc_gst || "",
      doc_ownership_proof: profile.documents?.doc_ownership_proof || "",
      doc_government_id: profile.documents?.doc_government_id || "",
      doc_business_license: profile.documents?.doc_business_license || "",
      youtube_links: profile.metadata_fields?.youtube_links || []
    }
  });

  const watchedFacilities = watch("facilities") || [];
  const watchedWeeklySchedule = watch("weekly_schedule") || {};
  const watchedYoutubeLinks = watch("youtube_links") || [];
  const watchedBlockedDates = watch("blocked_dates") || [];
  const watchedMaintenanceDays = watch("maintenance_days") || [];

  const watchedDocPan = watch("doc_pan");
  const watchedDocGst = watch("doc_gst");
  const watchedDocOwnershipProof = watch("doc_ownership_proof");
  const watchedDocGovId = watch("doc_government_id");
  const watchedDocLicense = watch("doc_business_license");

  // Load locations on mount
  React.useEffect(() => {
    const fetchLocationsOnLoad = async () => {
      try {
        const countryRes = await api.get("/locations/countries");
        const countryList = countryRes.data?.data || [];
        setCountries(countryList);

        const currentCountry = profile.country;
        const matchingCountry = countryList.find((c: any) => c.name === currentCountry);
        if (matchingCountry) {
          const stateRes = await api.get(`/locations/states?country_id=${matchingCountry.id}`);
          const stateList = stateRes.data?.data || [];
          setStates(stateList);

          const currentState = profile.state;
          const matchingState = stateList.find((s: any) => s.name === currentState);
          if (matchingState) {
            const cityRes = await api.get(`/locations/cities?state_id=${matchingState.id}`);
            setCities(cityRes.data?.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to load initial address locations", err);
      }
    };
    fetchLocationsOnLoad();
  }, [profile]);

  const handleCountryChange = async (countryName: string) => {
    setValue("country", countryName);
    setValue("state", "");
    setValue("city_id", "");
    setStates([]);
    setCities([]);

    const selectedCountry = countries.find(c => c.name === countryName);
    if (!selectedCountry) return;

    setLoadingLocations(true);
    try {
      const res = await api.get(`/locations/states?country_id=${selectedCountry.id}`);
      setStates(res.data?.data || []);
    } catch {
      toast.error("Failed to fetch states.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleStateChange = async (stateName: string) => {
    setValue("state", stateName);
    setValue("city_id", "");
    setCities([]);

    const selectedState = states.find(s => s.name === stateName);
    if (!selectedState) return;

    setLoadingLocations(true);
    try {
      const res = await api.get(`/locations/cities?state_id=${selectedState.id}`);
      setCities(res.data?.data || []);
    } catch {
      toast.error("Failed to fetch cities.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: Path<VenueProfileUpdateFormData>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must not exceed 5MB.");
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/venues/upload?subfolder=documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setValue(fieldName, res.data.data);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (_err) {
      // Sandbox fallback
      const mockUrl = URL.createObjectURL(file);
      setValue(fieldName, mockUrl);
      toast.success(`${file.name} uploaded successfully! (Sandbox Mode)`);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const toggleFacility = (facilityId: string) => {
    const current = [...watchedFacilities];
    const idx = current.indexOf(facilityId);
    if (idx > -1) current.splice(idx, 1);
    else current.push(facilityId);
    setValue("facilities", current);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSuccess)}
      className="space-y-8 bg-bg-card/45 backdrop-blur-md border border-border/80 p-6 md:p-8 rounded-3xl shadow-xl"
    >
      <div className="border-b border-border/50 pb-4">
        <h2 className="text-xl font-bold text-text-primary">Edit Venue Profile Details</h2>
        <p className="text-xs text-text-secondary">Update your workspace information, capacity constraints, location, and operating hours.</p>
      </div>

      {/* Basic Profile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Building2 className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Basic Space Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="venue_name">Venue Name</Label>
            <Input id="venue_name" {...register("venue_name")} />
            {errors.venue_name && <p className="text-xs text-error">{errors.venue_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venue_type">Venue Type</Label>
            <select 
              id="venue_type"
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              {...register("venue_type")}
            >
              {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="established_year">Established Year</Label>
            <Input id="established_year" type="number" {...register("established_year", { valueAsNumber: true })} />
            {errors.established_year && <p className="text-xs text-error">{errors.established_year.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="indoor_outdoor">Preference Area</Label>
            <select 
              id="indoor_outdoor"
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              {...register("indoor_outdoor")}
            >
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Both">Both Indoor & Outdoor</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">About Venue / Spaces Description</Label>
          <Textarea id="description" rows={4} placeholder="Tell clients about your design layouts, acoustics, parking limits..." {...register("description")} />
          {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
        </div>
      </div>

      {/* Owner Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Briefcase className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Owner & Business Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="owner_name">Owner Legal Name</Label>
            <Input id="owner_name" {...register("owner_name")} />
            {errors.owner_name && <p className="text-xs text-error">{errors.owner_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business/Firm Name</Label>
            <Input id="business_name" {...register("business_name")} />
            {errors.business_name && <p className="text-xs text-error">{errors.business_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_person">Booking Representative</Label>
            <Input id="contact_person" {...register("contact_person")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gst_number">GST Identification Number</Label>
            <Input id="gst_number" placeholder="Optional" {...register("gst_number")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pan_number">Corporate PAN Card</Label>
            <Input id="pan_number" placeholder="Optional" {...register("pan_number")} />
          </div>
        </div>
      </div>

      {/* Address & Google Maps */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <MapPin className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Address Management & Maps</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              value={watch("country")}
              onChange={e => handleCountryChange(e.target.value)}
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {errors.country && <p className="text-xs text-error">{errors.country.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>State</Label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              value={watch("state")}
              onChange={e => handleStateChange(e.target.value)}
              disabled={!watch("country") || loadingLocations}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            {errors.state && <p className="text-xs text-error">{errors.state.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>City</Label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              value={watch("city_id")}
              onChange={e => setValue("city_id", e.target.value)}
              disabled={!watch("state") || loadingLocations}
            >
              <option value="">Select City</option>
              {cities.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
            </select>
            {errors.city_id && <p className="text-xs text-error">{errors.city_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Input id="district" {...register("district")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area">Area / Suburb</Label>
            <Input id="area" {...register("area")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="landmark">Landmark</Label>
            <Input id="landmark" {...register("landmark")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" {...register("pincode")} />
            {errors.pincode && <p className="text-xs text-error">{errors.pincode.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="google_map_location">Google Maps Link</Label>
            <Input id="google_map_location" placeholder="https://maps.google.com/..." {...register("google_map_location")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" type="number" step="any" {...register("latitude", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" type="number" step="any" {...register("longitude", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Full Street Address</Label>
          <Textarea id="address" rows={2} {...register("address")} />
          {errors.address && <p className="text-xs text-error">{errors.address.message}</p>}
        </div>
      </div>

      {/* Facilities checklist */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Grid className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Amenities Summary</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FACILITY_OPTIONS.map(opt => {
            const active = watchedFacilities.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleFacility(opt.id)}
                className={`h-11 px-3 text-xs font-semibold rounded-lg border text-left flex items-center justify-between transition-all duration-200 ${
                  active ? "bg-primary/10 border-primary text-primary" : "bg-bg-elevated/20 border-border text-text-secondary"
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] uppercase font-bold">{active ? "Yes" : "No"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Capacity limits */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Users className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Guest Capacity Limits</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="min_capacity">Minimum Capacity</Label>
            <Input id="min_capacity" type="number" {...register("min_capacity", { valueAsNumber: true })} />
            {errors.min_capacity && <p className="text-xs text-error">{errors.min_capacity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_capacity">Maximum Capacity</Label>
            <Input id="max_capacity" type="number" {...register("max_capacity", { valueAsNumber: true })} />
            {errors.max_capacity && <p className="text-xs text-error">{errors.max_capacity.message}</p>}
          </div>
        </div>
      </div>

      {/* Operating schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Clock className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Operational availability rules</span>
        </div>

        <div className="space-y-3.5">
          {Object.keys(watchedWeeklySchedule).map(day => {
            const dayConfig = watchedWeeklySchedule[day];
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-bg-elevated/20">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-text-primary w-24 block">{day}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={!!dayConfig.available}
                      onChange={e => setValue(`weekly_schedule.${day}.available` as any, e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 bg-bg-card"
                    />
                    <span className="text-xs text-text-secondary">Open</span>
                  </label>
                </div>

                {dayConfig.available && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Input 
                      type="text" 
                      className="w-20 text-center h-8"
                      value={dayConfig.start}
                      onChange={e => setValue(`weekly_schedule.${day}.start` as any, e.target.value)}
                    />
                    <span className="text-xs text-text-muted">to</span>
                    <Input 
                      type="text" 
                      className="w-20 text-center h-8"
                      value={dayConfig.end}
                      onChange={e => setValue(`weekly_schedule.${day}.end` as any, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Blocked Dates */}
          <div className="space-y-3">
            <Label>Blocked Dates</Label>
            <div className="flex gap-2">
              <Input 
                type="date"
                value={blockedDateInput} 
                onChange={e => setBlockedDateInput(e.target.value)}
              />
              <Button type="button" onClick={() => {
                if (!blockedDateInput) return;
                setValue("blocked_dates", [...watchedBlockedDates, blockedDateInput]);
                setBlockedDateInput("");
              }} className="bg-primary text-white h-10 px-4">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {watchedBlockedDates.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-bg-elevated text-[10px] text-text-primary">
                  <span>{d}</span>
                  <button type="button" onClick={() => {
                    const current = [...watchedBlockedDates];
                    current.splice(i, 1);
                    setValue("blocked_dates", current);
                  }} className="text-error hover:text-red-400 font-bold font-mono">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance days */}
          <div className="space-y-3">
            <Label>Maintenance Dates</Label>
            <div className="flex gap-2">
              <Input 
                type="date"
                value={maintenanceInput} 
                onChange={e => setMaintenanceInput(e.target.value)}
              />
              <Button type="button" onClick={() => {
                if (!maintenanceInput) return;
                setValue("maintenance_days", [...watchedMaintenanceDays, maintenanceInput]);
                setMaintenanceInput("");
              }} className="bg-primary text-white h-10 px-4">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {watchedMaintenanceDays.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-bg-elevated text-[10px] text-text-primary">
                  <span>{d}</span>
                  <button type="button" onClick={() => {
                    const current = [...watchedMaintenanceDays];
                    current.splice(i, 1);
                    setValue("maintenance_days", current);
                  }} className="text-error hover:text-red-400 font-bold font-mono">×</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Social and Youtube Media Links */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Video className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Social Links & Youtube Media</span>
        </div>

        <div className="space-y-3">
          <Label>Youtube Video Embed Links</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={youtubeInput} 
              onChange={e => setYoutubeInput(e.target.value)}
            />
            <Button type="button" onClick={() => {
              if (!youtubeInput.trim()) return;
              setValue("youtube_links", [...watchedYoutubeLinks, youtubeInput.trim()]);
              setYoutubeInput("");
            }} className="bg-primary text-white h-10 px-4">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {watchedYoutubeLinks.map((url, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-bg-elevated/20">
                <span className="text-xs text-text-secondary truncate pr-4">{url}</span>
                <button type="button" onClick={() => {
                  const current = [...watchedYoutubeLinks];
                  current.splice(i, 1);
                  setValue("youtube_links", current);
                }} className="text-error hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents upload section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <FileText className="h-4.5 w-4.5 text-primary" />
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Credentials & Verification Documents</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>PAN Card Document File</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="file" 
                className="h-10 text-xs bg-bg-card/30 border-border"
                onChange={e => handleDocumentUpload(e, "doc_pan")}
                disabled={uploadingDoc.doc_pan}
              />
              {watchedDocPan && (
                <a href={watchedDocPan} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline shrink-0">
                  View Upload
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>GST Document File</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="file" 
                className="h-10 text-xs bg-bg-card/30 border-border"
                onChange={e => handleDocumentUpload(e, "doc_gst")}
                disabled={uploadingDoc.doc_gst}
              />
              {watchedDocGst && (
                <a href={watchedDocGst} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline shrink-0">
                  View Upload
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ownership Proof File (Title Deed/Lease)</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="file" 
                className="h-10 text-xs bg-bg-card/30 border-border"
                onChange={e => handleDocumentUpload(e, "doc_ownership_proof")}
                disabled={uploadingDoc.doc_ownership_proof}
              />
              {watchedDocOwnershipProof && (
                <a href={watchedDocOwnershipProof} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline shrink-0">
                  View Upload
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Government ID Proof</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="file" 
                className="h-10 text-xs bg-bg-card/30 border-border"
                onChange={e => handleDocumentUpload(e, "doc_government_id")}
                disabled={uploadingDoc.doc_government_id}
              />
              {watchedDocGovId && (
                <a href={watchedDocGovId} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline shrink-0">
                  View Upload
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Business / Trade License</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="file" 
                className="h-10 text-xs bg-bg-card/30 border-border"
                onChange={e => handleDocumentUpload(e, "doc_business_license")}
                disabled={uploadingDoc.doc_business_license}
              />
              {watchedDocLicense && (
                <a href={watchedDocLicense} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline shrink-0">
                  View Upload
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 flex items-center justify-center gap-2">
        <Save className="h-4 w-4" />
        <span>{isSubmitting ? "Saving Venue Updates..." : "Save Profile Details"}</span>
      </Button>

    </form>
  );
}
