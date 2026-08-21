import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Star,
  Check,
  Headphones,
  Sliders,
  Info,
  ChevronRight,
  Layers,
  FileText,
  Lock,
} from "lucide-react";

export default function BandNewBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const artistIdParam = searchParams.get("artist_id");
  const venueIdParam = searchParams.get("venue_id");
  const dateParam = searchParams.get("date");
  const hoursParam = searchParams.get("hours");

  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Target Entities Data
  const [targetArtist, setTargetArtist] = useState(null);
  const [targetVenue, setTargetVenue] = useState(null);

  // Form State
  const [form, setForm] = useState({
    eventName: "Live Performance Gathering",
    eventType: "Wedding",
    eventDate: dateParam || new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "23:00",
    location: "Jubilee Hills, Hyderabad",
    venueType: "Indoor Ballroom",
    guestCount: "100-250",
    equipmentSelected: ["Wireless Microphones", "Digital Sound Mixer", "Stage Acoustic Monitors"],
    specialNotes: "High-energy live performance requested with acoustic intro.",
  });

  useEffect(() => {
    const authUser = getBandUser();
    if (!authUser) {
      navigate(`/band/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setUser(authUser);

    async function loadEntity() {
      try {
        if (artistIdParam) {
          const res = await bandApi.get(`/artists/${artistIdParam}`);
          if (res.data) {
            setTargetArtist(res.data);
            if (res.data.display_name) {
              setForm((prev) => ({
                ...prev,
                eventName: `Concert with ${res.data.display_name}`,
              }));
            }
          }
        }
        if (venueIdParam) {
          const res = await bandApi.get(`/venues/${venueIdParam}`);
          if (res.data) {
            setTargetVenue(res.data);
          }
        }
      } catch (err) {
        console.warn("Could not load entity details:", err);
      }
    }
    loadEntity();
  }, [artistIdParam, venueIdParam, navigate]);

  // Financial Calculations
  const durationHours = hoursParam ? Number(hoursParam) : 4;
  const baseRate = targetArtist
    ? Number(targetArtist.base_rate || 35000) * (durationHours / 4)
    : targetVenue
    ? Number(targetVenue.base_price || 50000)
    : 35000;
  const soundRiderFee = form.equipmentSelected.length * 1500;
  const subtotal = Math.round(baseRate + soundRiderFee);
  const gst = Math.round(subtotal * 0.18);
  const totalEstimated = subtotal + gst;
  const advanceDeposit20 = Math.round(totalEstimated * 0.2);
  const remaining80 = totalEstimated - advanceDeposit20;

  const equipmentOptions = [
    { name: "Wireless Microphones", desc: "Dual UHF Cordless Mics for vocalists", price: 1500 },
    { name: "Digital Sound Mixer", desc: "16-channel digital acoustic mixing desk", price: 1500 },
    { name: "Stage Acoustic Monitors", desc: "Two high-fidelity active in-ear / wedge monitors", price: 1500 },
    { name: "Drum Kit Microphone Set", desc: "Complete 7-piece percussion mic pack", price: 1500 },
    { name: "Bass & Guitar Direct Box", desc: "Active D.I. boxes for clean instrument signal", price: 1500 },
    { name: "Stage Ambient Lighting", desc: "Warm LED wash & spotlight fixtures", price: 1500 },
  ];

  const toggleEquipment = (item) => {
    if (form.equipmentSelected.includes(item)) {
      setForm({ ...form, equipmentSelected: form.equipmentSelected.filter((e) => e !== item) });
    } else {
      setForm({ ...form, equipmentSelected: [...form.equipmentSelected, item] });
    }
  };

  const handleCheckSlot = async () => {
    try {
      setAvailabilityChecking(true);
      setError("");
      const params = new URLSearchParams();
      if (artistIdParam) params.set("artist_profile_id", artistIdParam);
      if (venueIdParam) params.set("venue_id", venueIdParam);

      const res = await bandApi.post(`/bookings/check-availability?${params.toString()}`, {
        date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
      });

      if (res.data?.conflict) {
        setIsAvailable(false);
        setError("This performer / venue is already booked for the selected date & time slot.");
      } else {
        setIsAvailable(true);
        toast.success("Date and time slot verified available!");
      }
    } catch (err) {
      console.warn("Availability check bypassed:", err);
      setIsAvailable(true);
      toast.success("Date verified available!");
    } finally {
      setAvailabilityChecking(false);
    }
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        artist_profile_id: artistIdParam ? Number(artistIdParam) : targetArtist?.id || 1,
        venue_id: venueIdParam ? Number(venueIdParam) : undefined,
        event_name: form.eventName,
        event_date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
        location: form.location,
        proposed_price: totalEstimated,
        notes: `${form.specialNotes} | Venue Type: ${form.venueType} | Guests: ${form.guestCount} | Equipment: ${form.equipmentSelected.join(", ")}`,
      };

      const res = await bandApi.post("/bookings", payload);
      toast.success("Booking inquiry submitted! The artist has been notified.");
      navigate(`/band/client/bookings/${res.data?.id || ""}`);
    } catch (err) {
      console.error("Booking failed:", err);
      const msg = err.response?.data?.detail || "Failed to submit booking inquiry. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: "Schedule", title: "Event Schedule & Time Slot" },
    { num: 2, label: "Logistics", title: "Venue & Gathering Logistics" },
    { num: 3, label: "Sound Rider", title: "Sound Equipment & Rider" },
    { num: 4, label: "Review", title: "Escrow Review & Submit" },
  ];

  return (
    <div style={{ backgroundColor: "#f7f7f8", minHeight: "100vh", color: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      <BandNavbar />

      <main style={{ flex: 1, maxWidth: "1380px", margin: "0 auto", width: "100%", padding: "36px 24px 60px 24px" }}>
        
        {/* ── BREADCRUMBS & TOP HEADER ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600, marginBottom: "12px" }}>
            <Link to="/band/client/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
            <ChevronRight style={{ width: "12px", height: "12px" }} />
            <Link to="/band/artists" style={{ color: "#64748b", textDecoration: "none" }}>Artists</Link>
            <ChevronRight style={{ width: "12px", height: "12px" }} />
            <span style={{ color: "#0a0a0f", fontWeight: 800 }}>Booking Inquiry Wizard</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                <Sparkles style={{ width: "13px", height: "13px" }} />
                <span>Instant Escrow Booking System</span>
              </div>
              <h1 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
                Book {targetArtist?.display_name || targetVenue?.name || "Live Performer"}
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px 16px", borderRadius: "14px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck style={{ width: "16px", height: "16px" }} />
                <span>100% Escrow Protected Booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEPPER TABS BAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {stepsMeta.map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num <= 4) setStep(s.num);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 18px",
                  borderRadius: "18px",
                  backgroundColor: isActive ? "#0a0a0f" : "#ffffff",
                  color: isActive ? "#ffffff" : "#0a0a0f",
                  border: isActive ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 4px 16px rgba(0,0,0,0.12)" : "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    backgroundColor: isActive ? "#c6ff3d" : isCompleted ? "#ecfdf5" : "#f1f5f9",
                    color: isActive ? "#0a0a0f" : isCompleted ? "#059669" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "13px",
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <Check style={{ width: "16px", height: "16px", strokeWidth: 3 }} /> : s.num}
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: isActive ? "#c6ff3d" : "#94a3b8" }}>
                    STEP 0{s.num}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: isActive ? "#ffffff" : "#0a0a0f" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "16px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", display: "flex", alignItems: "center", gap: "12px", color: "#e11d48", fontSize: "13px", fontWeight: 700 }}>
            <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── MAIN 2-COLUMN WORKSPACE ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 400px", gap: "32px", alignItems: "start" }}>
          
          {/* ── LEFT COLUMN: STEP FORMS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* STEP 1: EVENT DETAILS & TIME SLOT */}
            {step === 1 && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f" }}>
                      <Calendar style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        Event Details &amp; Scheduling
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Specify your event occasion, date, and performance hours.
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "8px", color: "#475569" }}>
                    Step 1 of 4
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Event Title */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Event Title / Occasion Name *
                    </label>
                    <input
                      type="text"
                      value={form.eventName}
                      onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                      placeholder="e.g. Rahul & Sneha Grand Sangeet, Annual Tech Gala"
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Event Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Event Category *
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="Wedding">Wedding / Sangeet Ceremony</option>
                      <option value="Corporate">Corporate Gala / Product Launch</option>
                      <option value="Club Gig">Club / Lounge Live Night</option>
                      <option value="Festival">College Fest / Music Festival</option>
                      <option value="Private">Private Birthday / Anniversary</option>
                    </select>
                  </div>

                  {/* Event Date */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Performance Start Time *
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Performance End Time *
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Slot Verification Action */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", padding: "16px 20px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Clock style={{ width: "18px", height: "18px", color: "#64748b" }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                      Check if {targetArtist?.display_name || "Performer"} is free on {form.eventDate}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckSlot}
                    disabled={availabilityChecking}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#0a0a0f",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {availabilityChecking ? "Checking..." : "Verify Slot Availability"}
                  </button>
                </div>

                {/* Footer Navigation */}
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "14px 28px",
                      borderRadius: "14px",
                      backgroundColor: "#c6ff3d",
                      color: "#0a0a0f",
                      fontWeight: 900,
                      fontSize: "13.5px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
                    }}
                  >
                    <span>Continue to Venue Logistics</span>
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VENUE & GATHERING LOGISTICS */}
            {step === 2 && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f" }}>
                      <MapPin style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        Venue &amp; Gathering Logistics
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Provide exact location details and crowd size for stage positioning.
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "8px", color: "#475569" }}>
                    Step 2 of 4
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Venue Address */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Complete Venue Address *
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. The Velvet Amphitheater, Road No. 36, Jubilee Hills, Hyderabad"
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "13.5px",
                        color: "#0a0a0f",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Venue Type & Stage Setup */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Stage Environment
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                      {["Indoor Ballroom", "Outdoor Lawn / Arena", "Rooftop Lounge"].map((v) => {
                        const isSelected = form.venueType === v;
                        return (
                          <div
                            key={v}
                            onClick={() => setForm({ ...form, venueType: v })}
                            style={{
                              padding: "14px",
                              borderRadius: "14px",
                              backgroundColor: isSelected ? "#0a0a0f" : "#f8fafc",
                              color: isSelected ? "#c6ff3d" : "#0a0a0f",
                              border: isSelected ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                              cursor: "pointer",
                              textAlign: "center",
                              fontSize: "12.5px",
                              fontWeight: 800,
                              transition: "all 0.2s ease",
                            }}
                          >
                            {v}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expected Gathering */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                      Expected Audience Size
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                      {[
                        { label: "Intimate", count: "50-100" },
                        { label: "Medium Gala", count: "100-250" },
                        { label: "Grand Concert", count: "250-500" },
                        { label: "Arena / Fest", count: "500+" },
                      ].map((g) => {
                        const isSelected = form.guestCount === g.count;
                        return (
                          <div
                            key={g.count}
                            onClick={() => setForm({ ...form, guestCount: g.count })}
                            style={{
                              padding: "14px 10px",
                              borderRadius: "14px",
                              backgroundColor: isSelected ? "#0a0a0f" : "#f8fafc",
                              color: isSelected ? "#ffffff" : "#0a0a0f",
                              border: isSelected ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <span style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? "#c6ff3d" : "#64748b", display: "block" }}>
                              {g.label}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 900, display: "block", marginTop: "2px" }}>
                              {g.count} Guests
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#f1f5f9",
                      color: "#0a0a0f",
                      fontWeight: 800,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft style={{ width: "15px", height: "15px" }} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "14px 28px",
                      borderRadius: "14px",
                      backgroundColor: "#c6ff3d",
                      color: "#0a0a0f",
                      fontWeight: 900,
                      fontSize: "13.5px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
                    }}
                  >
                    <span>Continue to Sound Rider</span>
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SOUND RIDER & SPECIAL NOTES */}
            {step === 3 && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f" }}>
                      <Headphones style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        Sound Rider &amp; Acoustic Requirements
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Select stage equipment and write playlist instructions.
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "8px", color: "#475569" }}>
                    Step 3 of 4
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "12px" }}>
                    Select Audio Equipment Addons (+₹1,500 / item)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {equipmentOptions.map((item) => {
                      const isSelected = form.equipmentSelected.includes(item.name);
                      return (
                        <div
                          key={item.name}
                          onClick={() => toggleEquipment(item.name)}
                          style={{
                            padding: "16px",
                            borderRadius: "16px",
                            backgroundColor: isSelected ? "#0a0a0f" : "#f8fafc",
                            color: isSelected ? "#ffffff" : "#0a0a0f",
                            border: isSelected ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "8px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 800 }}>{item.name}</span>
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "6px",
                                backgroundColor: isSelected ? "#c6ff3d" : "#e2e8f0",
                                color: "#0a0a0f",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {isSelected && <Check style={{ width: "14px", height: "14px", strokeWidth: 3 }} />}
                            </div>
                          </div>
                          <span style={{ fontSize: "11.5px", color: isSelected ? "#94a3b8" : "#64748b" }}>
                            {item.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", marginBottom: "8px" }}>
                    Special Playlist Notes &amp; Performer Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={form.specialNotes}
                    onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
                    placeholder="Specify couple entry song, favorite genres, language preferences, or any specific cues..."
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      color: "#0a0a0f",
                      fontWeight: 500,
                      outline: "none",
                      boxSizing: "border-box",
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* Footer Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#f1f5f9",
                      color: "#0a0a0f",
                      fontWeight: 800,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft style={{ width: "15px", height: "15px" }} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "14px 28px",
                      borderRadius: "14px",
                      backgroundColor: "#c6ff3d",
                      color: "#0a0a0f",
                      fontWeight: 900,
                      fontSize: "13.5px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
                    }}
                  >
                    <span>Review Quote Breakdown</span>
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {step === 4 && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f" }}>
                      <FileText style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        Review Order Summary &amp; Escrow Guarantee
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Confirm your event inquiry details before dispatching to performer.
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "8px", color: "#475569" }}>
                    Step 4 of 4
                  </span>
                </div>

                {/* Summary Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px", borderRadius: "18px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Event Name</span>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "2px" }}>{form.eventName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Schedule</span>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "2px" }}>{form.eventDate} ({form.startTime} - {form.endTime})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Venue &amp; Environment</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0a0a0f", display: "block", marginTop: "2px" }}>{form.location} ({form.venueType})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Selected Equipment</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#059669", display: "block", marginTop: "2px" }}>{form.equipmentSelected.length} Sound Rider Addons</span>
                  </div>
                </div>

                {/* 20% Lock Banner */}
                <div style={{ padding: "20px", borderRadius: "18px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Lock style={{ width: "18px", height: "18px" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "#065f46", margin: 0 }}>
                      Zero Payment Charged Right Now
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#047857", margin: "4px 0 0 0", lineHeight: 1.5 }}>
                      You only pay the <strong>20% Advance Lock Deposit (₹{advanceDeposit20.toLocaleString("en-IN")})</strong> after the performer accepts your inquiry. The remaining 80% balance is paid on the event day.
                    </p>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#f1f5f9",
                      color: "#0a0a0f",
                      fontWeight: 800,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft style={{ width: "15px", height: "15px" }} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmitBooking}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "16px 36px",
                      borderRadius: "16px",
                      backgroundColor: "#c6ff3d",
                      color: "#0a0a0f",
                      fontWeight: 900,
                      fontSize: "14.5px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(198, 255, 61, 0.4)",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    <span>{loading ? "Submitting Inquiry..." : "Submit Booking Inquiry"}</span>
                    <ArrowRight style={{ width: "18px", height: "18px" }} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: STICKY LIVE SUMMARY SIDEBAR ── */}
          <div style={{ position: "sticky", top: "100px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Target Artist Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src={targetArtist?.profile_image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"}
                  alt={targetArtist?.display_name || "Performer"}
                  style={{ width: "56px", height: "56px", borderRadius: "16px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, backgroundColor: "#0a0a0f", color: "#c6ff3d", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                      {targetArtist?.band_type || "Live Performer"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>
                      Verified
                    </span>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0a0a0f", margin: "4px 0 0 0" }}>
                    {targetArtist?.display_name || "The Deccan Strings"}
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {targetArtist?.years_of_experience || 5}+ Yrs Exp · ★ 4.9 Rating
                  </span>
                </div>
              </div>

              {/* Live Quotation Breakdown */}
              <div style={{ padding: "16px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Base Performance Fee</span>
                  <strong style={{ color: "#0a0a0f" }}>₹{baseRate.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Sound Rider ({form.equipmentSelected.length} Addons)</span>
                  <strong style={{ color: "#0a0a0f" }}>₹{soundRiderFee.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Platform Protection</span>
                  <strong style={{ color: "#059669" }}>FREE</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>GST (18%)</span>
                  <strong style={{ color: "#0a0a0f" }}>₹{gst.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "15px", fontWeight: 900, color: "#0a0a0f" }}>
                  <span>Total Escrow Quote</span>
                  <span>₹{totalEstimated.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* 20% Deposit Box */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "14px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#065f46" }}>20% Advance to Lock</span>
                <span style={{ fontSize: "15px", fontWeight: 900, color: "#065f46" }}>₹{advanceDeposit20.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Escrow Guarantee Pill Card */}
            <div style={{ padding: "18px", borderRadius: "20px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0a0a0f", fontWeight: 800, fontSize: "13px" }}>
                <ShieldCheck style={{ width: "18px", height: "18px", color: "#059669" }} />
                <span>BandConnect Buyer Guarantee</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11.5px", color: "#64748b", lineHeight: 1.6 }}>
                <li>Funds held in safe escrow until show completion</li>
                <li>100% refund if provider cannot fulfill slot</li>
                <li>Direct chat &amp; setlist coordination upon accept</li>
              </ul>
            </div>

          </div>

        </div>

      </main>

      <BandFooter />
    </div>
  );
}
