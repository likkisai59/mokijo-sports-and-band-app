import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
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
} from "lucide-react";

export default function BandNewBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const artistIdParam = searchParams.get("artist_id");
  const venueIdParam = searchParams.get("venue_id");

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
    eventName: "Grand Wedding Reception",
    eventType: "Wedding",
    eventDate: "2026-09-20",
    startTime: "19:00",
    endTime: "23:00",
    location: "The Velvet Amphitheater, Jubilee Hills, Hyderabad",
    guestCount: 250,
    equipmentSelected: ["Wireless Microphones", "Digital Sound Mixer", "Stage Acoustic Monitors"],
    specialNotes: "High-energy Bollywood acoustic fusion performance requested.",
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
          const res = await fetch(`http://localhost:8001/api/band/artists/${artistIdParam}`);
          if (res.ok) {
            const data = await res.json();
            setTargetArtist(data);
          }
        }
        if (venueIdParam) {
          const res = await fetch(`http://localhost:8001/api/band/venues/${venueIdParam}`);
          if (res.ok) {
            const data = await res.json();
            setTargetVenue(data);
          }
        }
      } catch (err) {
        console.warn("Using fallback booking mock targets:", err);
      }
    }
    loadEntity();
  }, [artistIdParam, venueIdParam, navigate]);

  // Financial Calculations
  const baseRate = targetArtist ? Number(targetArtist.base_rate) : targetVenue ? Number(targetVenue.base_price) : 35000;
  const durationHours = 4;
  const soundRiderFee = form.equipmentSelected.length * 1500;
  const subtotal = baseRate + soundRiderFee;
  const gst = Math.round(subtotal * 0.18);
  const totalEstimated = subtotal + gst;
  const advanceDeposit20 = Math.round(totalEstimated * 0.2);
  const remaining80 = totalEstimated - advanceDeposit20;

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
      }
    } catch (err) {
      console.warn("Availability check bypassed:", err);
      setIsAvailable(true);
    } finally {
      setAvailabilityChecking(false);
    }
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        artist_profile_id: artistIdParam ? Number(artistIdParam) : 101,
        venue_id: venueIdParam ? Number(venueIdParam) : undefined,
        event_name: form.eventName,
        event_date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
        location: form.location,
        proposed_price: totalEstimated,
        notes: `${form.specialNotes} | Equipment: ${form.equipmentSelected.join(", ")}`,
      };

      const res = await bandApi.post("/bookings", payload);
      navigate(`/band/client/bookings/${res.data?.id || 101}`);
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.detail || "Failed to submit booking inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="band-page-container flex flex-col min-h-screen bg-[#f7f7f8] text-[#0a0a0f]">
      <BandNavbar />

      <main className="flex-1 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Step Indicator Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#0a0a0f] text-white">
              Step {step} of 4
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {step === 1 && "Event Schedule & Availability"}
              {step === 2 && "Venue & Guest Logistics"}
              {step === 3 && "Sound Rider & Acoustic Equipment"}
              {step === 4 && "Price Breakdown & Submit"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0f] tracking-tight">
            Book {targetArtist?.display_name || targetVenue?.name || "Live Entertainment"}
          </h1>
        </div>

        {/* 4-Step Wizard Navigation Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? "bg-[#c6ff3d]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: EVENT DETAILS & TIME SLOT ── */}
        {step === 1 && (
          <div className="band-card-item p-6 sm:p-8 bg-white space-y-6">
            <h2 className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-slate-700" />
              <span>Event Details & Scheduling</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="font-extrabold text-[#0a0a0f] block mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={form.eventName}
                  onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                  placeholder="e.g. Wedding Reception, Corporate Gala"
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-3 text-sm text-[#0a0a0f] focus:bg-white focus:outline-none focus:border-[#0a0a0f]"
                />
              </div>

              <div>
                <label className="font-extrabold text-[#0a0a0f] block mb-1.5">
                  Event Category
                </label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-3 text-xs font-bold text-[#0a0a0f]"
                >
                  <option value="Wedding">Wedding / Sangeet Ceremony</option>
                  <option value="Corporate">Corporate Gala / Product Launch</option>
                  <option value="Club Gig">Club / Lounge Live Night</option>
                  <option value="Festival">College Fest / Music Festival</option>
                  <option value="Private">Private Birthday / Anniversary</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-[#0a0a0f] block mb-1.5">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#0a0a0f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0a0a0f]"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-[#0a0a0f] block mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0a0a0f]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCheckSlot}
                disabled={availabilityChecking}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0a0a0f] flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{availabilityChecking ? "Checking Slot..." : "Verify Slot Availability"}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="band-btn-lime py-3 px-6 text-xs"
              >
                <span>Continue to Venue Logistics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VENUE & GUEST LOGISTICS ── */}
        {step === 2 && (
          <div className="band-card-item p-6 sm:p-8 bg-white space-y-6">
            <h2 className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-slate-700" />
              <span>Venue & Location Logistics</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-[#0a0a0f] block mb-1.5">
                  Complete Venue Address *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Street address, Area, City, Pincode"
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-3 text-sm text-[#0a0a0f]"
                />
              </div>

              <div>
                <label className="font-extrabold text-[#0a0a0f] block mb-1.5">
                  Expected Guest Gathering
                </label>
                <input
                  type="number"
                  value={form.guestCount}
                  onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })}
                  className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-3 text-sm text-[#0a0a0f]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0a0a0f]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="band-btn-lime py-3 px-6 text-xs"
              >
                <span>Continue to Sound Rider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SOUND & EQUIPMENT REQUIREMENTS ── */}
        {step === 3 && (
          <div className="band-card-item p-6 sm:p-8 bg-white space-y-6">
            <h2 className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Music className="w-5 h-5 text-slate-700" />
              <span>Sound Rider & Acoustic Equipment</span>
            </h2>

            <div>
              <label className="font-extrabold text-[#0a0a0f] block mb-3 text-xs">
                Select Audio Equipment to be Arranged
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  "Wireless Microphones",
                  "Digital Sound Mixer",
                  "Stage Acoustic Monitors",
                  "Bass & Guitar Amplifiers",
                  "In-Ear Monitors (IEM)",
                  "Pro Drum PA Rig",
                ].map((eq) => {
                  const checked = form.equipmentSelected.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        checked ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-[#f8fafc] border-slate-200 text-[#5c5c66]"
                      }`}
                    >
                      <span>{eq} (+₹1,500)</span>
                      {checked && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-extrabold text-[#0a0a0f] block mb-1.5 text-xs">
                Special Playlist Notes & Performer Instructions
              </label>
              <textarea
                rows={3}
                value={form.specialNotes}
                onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3.5 text-xs text-[#0a0a0f]"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0a0a0f]"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="band-btn-lime py-3 px-6 text-xs"
              >
                <span>Review Quote Breakdown</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: QUOTE BREAKDOWN & SUBMIT ── */}
        {step === 4 && (
          <div className="band-card-item p-6 sm:p-8 bg-white space-y-6">
            <h2 className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Booking Quote & Escrow Advance</span>
            </h2>

            {/* Price Breakdown Table */}
            <div className="space-y-3 text-xs bg-[#f8fafc] p-5 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between text-[#5c5c66]">
                <span>Base Performance / Venue Fee</span>
                <span className="text-[#0a0a0f] font-bold">₹{baseRate.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[#5c5c66]">
                <span>Sound Rider Addons ({form.equipmentSelected.length} items)</span>
                <span className="text-[#0a0a0f] font-bold">₹{soundRiderFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[#5c5c66]">
                <span>Platform Escrow Protection</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-[#5c5c66]">
                <span>GST (18%)</span>
                <span className="text-[#0a0a0f] font-bold">₹{gst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#0a0a0f] pt-3 border-t border-slate-200">
                <span>Total Estimated Cost</span>
                <span className="text-[#0a0a0f]">₹{totalEstimated.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Escrow Deposit Note */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>20% Advance Lock Policy</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                You only pay <strong>₹{advanceDeposit20.toLocaleString("en-IN")} (20%)</strong> after the performer accepts your inquiry. The remaining <strong>₹{remaining80.toLocaleString("en-IN")} (80%)</strong> is paid directly on the event day.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0a0a0f]"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitBooking}
                className="band-btn-lime py-3.5 px-8 text-sm"
              >
                {loading ? "Submitting Inquiry..." : "Submit Booking Inquiry"}
              </button>
            </div>
          </div>
        )}
      </main>

      <BandFooter />
    </div>
  );
}
