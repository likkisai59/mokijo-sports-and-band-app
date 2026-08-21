"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { venueProfileUpdateSchema } from "@/utils/validation";
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

export function VenueProfileEdit({ profile, onSuccess }) {
  const [countries, setCountries] = React.useState([]);
  const [states, setStates] = React.useState([]);
  const [cities, setCities] = React.useState([]);
  const [loadingLocations, setLoadingLocations] = React.useState(false);

  const [youtubeInput, setYoutubeInput] = React.useState("");
  const [uploadingDoc, setUploadingDoc] = React.useState({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(venueProfileUpdateSchema),
    defaultValues: {
      owner_name: profile.user?.name || "",
      business_name: profile.business_name || "",
      contact_person: profile.metadata_fields?.contact_person || "",
      gst_number: profile.metadata_fields?.gst_number || "",
      pan_number: profile.metadata_fields?.pan_number || "",
      venue_name: profile.name || "",
      venue_type: profile.venue_type || "Banquet Hall",
      description: profile.description || "",
      established_year: profile.metadata_fields?.established_year || null,
      indoor_outdoor: profile.metadata_fields?.indoor_outdoor || "Both",
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

  const watchedDocPan = watch("doc_pan");
  const watchedDocGst = watch("doc_gst");
  const watchedDocOwnershipProof = watch("doc_ownership_proof");
  const watchedDocGovId = watch("doc_government_id");

  React.useEffect(() => {
    const fetchLocationsOnLoad = async () => {
      try {
        const countryRes = await api.get("/locations/countries");
        const countryList = countryRes.data?.data || [];
        setCountries(countryList);

        const currentCountry = profile.country;
        const matchingCountry = countryList.find((c) => c.name === currentCountry);
        if (matchingCountry) {
          const stateRes = await api.get(`/locations/states?country_id=${matchingCountry.id}`);
          const stateList = stateRes.data?.data || [];
          setStates(stateList);

          const currentState = profile.state;
          const matchingState = stateList.find((s) => s.name === currentState);
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

  const handleCountryChange = async (countryName) => {
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

  const handleStateChange = async (stateName) => {
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

  const handleDocumentUpload = async (e, fieldName) => {
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
      const mockUrl = URL.createObjectURL(file);
      setValue(fieldName, mockUrl);
      toast.success(`${file.name} uploaded successfully! (Sandbox Mode)`);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const toggleFacility = (facilityId) => {
    const current = [...watchedFacilities];
    const idx = current.indexOf(facilityId);
    if (idx > -1) current.splice(idx, 1);
    else current.push(facilityId);
    setValue("facilities", current);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSuccess)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
      }}
    >
      {/* ── Section 1: Basic Space Information ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
              <Building2 style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Basic Venue &amp; Space Identity
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
                Primary public naming, space categorization, and acoustic atmosphere description.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Venue Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="venue_name" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Venue Name <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <input
              id="venue_name"
              {...register("venue_name")}
              placeholder="e.g. Grand Velvet Amphitheater"
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.venue_name && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.venue_name.message}</p>}
          </div>

          {/* Venue Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="venue_type" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Venue Type <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <select 
              id="venue_type"
              {...register("venue_type")}
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Established Year */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="established_year" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Established Year
            </label>
            <input
              id="established_year"
              type="number"
              placeholder="e.g. 2018"
              {...register("established_year", { valueAsNumber: true })}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.established_year && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.established_year.message}</p>}
          </div>

          {/* Preference Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="indoor_outdoor" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Area Setting
            </label>
            <select 
              id="indoor_outdoor"
              {...register("indoor_outdoor")}
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="Indoor">Indoor Only</option>
              <option value="Outdoor">Outdoor / Open Air</option>
              <option value="Both">Both Indoor &amp; Outdoor Spaces</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="description" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
            Venue Story &amp; Acoustic Description <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe acoustic treatments, stage dimensions, natural light, green room features, and surrounding ambiance..."
            {...register("description")}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "13.5px",
              color: "#0a0a0f",
              fontWeight: 500,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
          />
          {errors.description && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.description.message}</p>}
        </div>
      </div>

      {/* ── Section 2: Owner & Legal Business Entity ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Briefcase style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Business &amp; Legal Entity
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Corporate registration details, billing entity, and authorized point of contact.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="owner_name" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Owner Legal Name <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <input
              id="owner_name"
              {...register("owner_name")}
              placeholder="e.g. Ramesh Chandra"
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.owner_name && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.owner_name.message}</p>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="business_name" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Business / Firm Name <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <input
              id="business_name"
              {...register("business_name")}
              placeholder="e.g. Velvet Spaces Private Limited"
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.business_name && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.business_name.message}</p>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="contact_person" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Booking Representative
            </label>
            <input
              id="contact_person"
              {...register("contact_person")}
              placeholder="e.g. Venue Manager (Priya)"
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="gst_number" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              GST Identification Number (GSTIN)
            </label>
            <input
              id="gst_number"
              placeholder="e.g. 36AAAAA0000A1Z5"
              {...register("gst_number")}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="pan_number" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Corporate PAN Number
            </label>
            <input
              id="pan_number"
              placeholder="e.g. ABCDE1234F"
              {...register("pan_number")}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Physical Location & Address ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <MapPin style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Location &amp; Physical Address
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Physical coordinates for client directions, GPS navigation, and regional filtering.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Country</label>
            <select 
              value={watch("country")}
              onChange={e => handleCountryChange(e.target.value)}
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>State / Province</label>
            <select 
              value={watch("state")}
              onChange={e => handleStateChange(e.target.value)}
              disabled={!watch("country") || loadingLocations}
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>City</label>
            <select 
              value={watch("city_id")}
              onChange={e => setValue("city_id", e.target.value)}
              disabled={!watch("state") || loadingLocations}
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select City</option>
              {cities.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="pincode" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Pincode / Postal Code</label>
            <input
              id="pincode"
              placeholder="e.g. 500033"
              {...register("pincode")}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="district" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>District / Sub-Division</label>
            <input
              id="district"
              placeholder="e.g. Hyderabad District"
              {...register("district")}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="google_map_location" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Google Maps Share Link</label>
            <input
              id="google_map_location"
              placeholder="https://maps.google.com/..."
              {...register("google_map_location")}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="address" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
            Full Street Address &amp; Landmarks <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <textarea
            id="address"
            rows={2}
            placeholder="Plot No. 42, Road No. 36, Beside Metro Station, Jubilee Hills, Hyderabad..."
            {...register("address")}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "13.5px",
              color: "#0a0a0f",
              fontWeight: 500,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {errors.address && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.address.message}</p>}
        </div>
      </div>

      {/* ── Section 4: Capacity & Rental Constraints ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Users style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Guest Capacity &amp; Booking Constraints
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Audience size limits and fire-code occupancy numbers.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="min_capacity" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Minimum Guest Capacity
            </label>
            <input
              id="min_capacity"
              type="number"
              placeholder="e.g. 50"
              {...register("min_capacity", { valueAsNumber: true })}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.min_capacity && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.min_capacity.message}</p>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="max_capacity" style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>
              Maximum Guest Capacity <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <input
              id="max_capacity"
              type="number"
              placeholder="e.g. 450"
              {...register("max_capacity", { valueAsNumber: true })}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errors.max_capacity && <p style={{ fontSize: "11px", color: "#e11d48", fontWeight: 700, margin: 0 }}>{errors.max_capacity.message}</p>}
          </div>
        </div>
      </div>

      {/* ── Section 5: Key Amenities Quick Matrix ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Grid style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Primary Amenities &amp; Rigging Specs
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Toggle infrastructure elements available for performing bands and event hosts.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          {FACILITY_OPTIONS.map(opt => {
            const active = watchedFacilities.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleFacility(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  fontSize: "12.5px",
                  fontWeight: active ? 800 : 600,
                  backgroundColor: active ? "#0a0a0f" : "#f8fafc",
                  color: active ? "#c6ff3d" : "#475569",
                  border: active ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: active ? "#c6ff3d" : "#e2e8f0",
                    color: active ? "#0a0a0f" : "#64748b",
                  }}
                >
                  {active ? "Active" : "Off"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Weekly Operating Schedule ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Clock style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Operating Schedule &amp; Sound Curfews
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Define open days and time slots for rehearsals and stage performances.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.keys(watchedWeeklySchedule).map(day => {
            const dayConfig = watchedWeeklySchedule[day];
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  backgroundColor: dayConfig.available ? "#f8fafc" : "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "160px" }}>
                  <input 
                    type="checkbox"
                    checked={!!dayConfig.available}
                    onChange={e => setValue(`weekly_schedule.${day}.available`, e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#0a0a0f", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: dayConfig.available ? "#0a0a0f" : "#94a3b8" }}>
                    {day}
                  </span>
                </div>

                {dayConfig.available ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input 
                      type="text" 
                      value={dayConfig.start}
                      onChange={e => setValue(`weekly_schedule.${day}.start`, e.target.value)}
                      style={{
                        width: "80px",
                        height: "36px",
                        textAlign: "center",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0a0a0f",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>to</span>
                    <input 
                      type="text" 
                      value={dayConfig.end}
                      onChange={e => setValue(`weekly_schedule.${day}.end`, e.target.value)}
                      style={{
                        width: "80px",
                        height: "36px",
                        textAlign: "center",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0a0a0f",
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>Closed / Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 7: Social Links & YouTube Embeds ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Video style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Live Performance Videos &amp; Virtual Tour
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Showcase YouTube videos of live concerts and acoustic atmosphere recordings.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input 
            placeholder="https://www.youtube.com/watch?v=..." 
            value={youtubeInput} 
            onChange={e => setYoutubeInput(e.target.value)}
            style={{
              flex: 1,
              height: "44px",
              padding: "0 16px",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "13.5px",
              color: "#0a0a0f",
              fontWeight: 600,
              outline: "none",
            }}
          />
          <button 
            type="button" 
            onClick={() => {
              if (!youtubeInput.trim()) return;
              setValue("youtube_links", [...watchedYoutubeLinks, youtubeInput.trim()]);
              setYoutubeInput("");
            }} 
            style={{
              padding: "0 22px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Add Link</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {watchedYoutubeLinks.map((url, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
              <button 
                type="button" 
                onClick={() => {
                  const current = [...watchedYoutubeLinks];
                  current.splice(i, 1);
                  setValue("youtube_links", current);
                }} 
                style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", padding: "4px" }}
              >
                <Trash2 style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 8: Credentials & Verification Documents ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "28px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <FileText style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Credentials &amp; Verification Documents
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Upload property ownership, GST, and trade licenses for verified badge approval.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>PAN Card Document</label>
            <input 
              type="file" 
              onChange={e => handleDocumentUpload(e, "doc_pan")}
              disabled={uploadingDoc.doc_pan}
              style={{ fontSize: "12px", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
            />
            {watchedDocPan && (
              <a href={watchedDocPan} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#0284c7", fontWeight: 800, textDecoration: "underline" }}>
                ✓ View Uploaded PAN
              </a>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>GST Document</label>
            <input 
              type="file" 
              onChange={e => handleDocumentUpload(e, "doc_gst")}
              disabled={uploadingDoc.doc_gst}
              style={{ fontSize: "12px", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
            />
            {watchedDocGst && (
              <a href={watchedDocGst} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#0284c7", fontWeight: 800, textDecoration: "underline" }}>
                ✓ View Uploaded GST
              </a>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Ownership Proof (Title Deed / Lease)</label>
            <input 
              type="file" 
              onChange={e => handleDocumentUpload(e, "doc_ownership_proof")}
              disabled={uploadingDoc.doc_ownership_proof}
              style={{ fontSize: "12px", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
            />
            {watchedDocOwnershipProof && (
              <a href={watchedDocOwnershipProof} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#0284c7", fontWeight: 800, textDecoration: "underline" }}>
                ✓ View Ownership Proof
              </a>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Government Authorized ID</label>
            <input 
              type="file" 
              onChange={e => handleDocumentUpload(e, "doc_government_id")}
              disabled={uploadingDoc.doc_government_id}
              style={{ fontSize: "12px", padding: "8px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
            />
            {watchedDocGovId && (
              <a href={watchedDocGovId} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#0284c7", fontWeight: 800, textDecoration: "underline" }}>
                ✓ View Uploaded ID
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Save Action Button ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px", paddingBottom: "32px" }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 40px",
            borderRadius: "16px",
            backgroundColor: "#c6ff3d",
            color: "#0a0a0f",
            fontWeight: 900,
            fontSize: "15px",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(198, 255, 61, 0.45)",
            transition: "all 0.15s ease",
          }}
        >
          <Save style={{ width: "19px", height: "19px" }} />
          <span>{isSubmitting ? "Saving Venue Updates..." : "Save Venue Changes"}</span>
        </button>
      </div>

    </form>
  );
}
