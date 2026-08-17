import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import {
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Heart,
  Volume2,
  Clock,
} from "lucide-react";

export default function BandVenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("Evening Slot (5 PM - 11 PM)");

  useEffect(() => {
    async function fetchVenueDetail() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/band/venues/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setVenue(data);
      } catch (err) {
        console.error("Failed to load venue detail:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchVenueDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BandNavbar />
        <div className="max-w-[1600px] mx-auto px-4 py-20 text-center flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900" />
        </div>
        <BandFooter />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col">
        <BandNavbar />
        <div className="max-w-[1600px] mx-auto px-4 py-20 text-center flex-1">
          <h2 className="text-2xl font-extrabold text-[#0a0a0f] mb-2">Venue Not Found</h2>
          <p className="text-[#5c5c66] text-sm mb-6">The requested performance venue does not exist or has been unlisted.</p>
          <Link to="/band/venues" className="mokijo-btn-primary">
            Browse Venues
          </Link>
        </div>
        <BandFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <BandNavbar />

      <main className="flex-1">
        {/* ── 1. PHOTO GALLERY HEADER ── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="mokijo-badge-venue">
                  {venue.venue_number}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                  {venue.venue_type}
                </span>
                <div className="mokijo-badge-verified">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Verified</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0f] tracking-tight">{venue.name}</h1>
              <p className="text-xs sm:text-sm text-[#5c5c66] flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-4 h-4 text-slate-500" />
                {venue.address}, {venue.city}, {venue.state} - {venue.pincode}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="mokijo-btn-secondary text-xs">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="mokijo-btn-secondary text-xs">
                <Heart className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-100">
            <div className="md:col-span-2 h-full overflow-hidden">
              <img src={venue.gallery[0] || venue.cover_image} alt={venue.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="hidden md:flex flex-col gap-4 h-full">
              <div className="flex-1 overflow-hidden">
                <img src={venue.gallery[1] || venue.cover_image} alt={venue.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <img src={venue.gallery[2] || venue.cover_image} alt={venue.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. DETAILS & BOOKING CARD ── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Specs Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="mokijo-card p-5">
                  <span className="text-[#5c5c66] text-[11px] font-bold uppercase tracking-wider block mb-1">Seating Capacity</span>
                  <span className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-700" />
                    {venue.capacity} Pax
                  </span>
                </div>
                <div className="mokijo-card p-5">
                  <span className="text-[#5c5c66] text-[11px] font-bold uppercase tracking-wider block mb-1">Acoustic Specs</span>
                  <span className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-slate-700" />
                    Concert Ready
                  </span>
                </div>
                <div className="mokijo-card p-5">
                  <span className="text-[#5c5c66] text-[11px] font-bold uppercase tracking-wider block mb-1">Operating Hours</span>
                  <span className="text-lg font-extrabold text-[#0a0a0f] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-700" />
                    10 AM - 11:30 PM
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    activeTab === "overview" ? "bg-[#c6ff3d] text-slate-950 shadow-xs" : "text-[#5c5c66] hover:text-[#0a0a0f]"
                  }`}
                >
                  Overview & Facilities
                </button>
                <button
                  onClick={() => setActiveTab("rules")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    activeTab === "rules" ? "bg-[#c6ff3d] text-slate-950 shadow-xs" : "text-[#5c5c66] hover:text-[#0a0a0f]"
                  }`}
                >
                  Venue Policies & Curfew
                </button>
              </div>

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="mokijo-card p-6">
                    <h3 className="text-base font-extrabold text-[#0a0a0f] mb-2">About the Venue</h3>
                    <p className="text-xs sm:text-sm text-[#5c5c66] leading-relaxed">{venue.description}</p>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-[#0a0a0f] mb-3">Key Facilities & Infrastructure</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {venue.facilities.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-3 mokijo-card p-4 text-xs font-semibold text-[#0a0a0f]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-6 text-sm text-[#5c5c66]">
                  <div className="mokijo-card p-6 space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a0a0f]">House Rules & Technical Guidelines</h3>
                    <ul className="space-y-2.5 text-xs text-[#5c5c66]">
                      <li>• <strong>Sound Curfew:</strong> Outdoor amplification must be lowered by 10:00 PM per city zoning laws.</li>
                      <li>• <strong>Green Room Access:</strong> 2 air-conditioned dressing suites available 2 hours before event start.</li>
                      <li>• <strong>Power Backup:</strong> Dedicated 125 KVA silent DG power generator for audio and stage lighting rigs.</li>
                      <li>• <strong>Security Deposit:</strong> Refundable deposit of ₹10,000 required upon check-in.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div>
              <div className="mokijo-card p-7 sticky top-28 space-y-6 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Slot Rental Rate</span>
                    <span className="text-2xl font-extrabold text-[#0a0a0f]">
                      ₹{Number(venue.base_price).toLocaleString("en-IN")}{" "}
                      <span className="text-xs text-slate-400 font-normal">/ slot</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="mokijo-badge-venue">{venue.venue_number}</span>
                    <span className="text-xs text-[#5c5c66] block mt-1">{venue.city}</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Booking Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0a0a0f]"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Time Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0a0a0f] focus:outline-none focus:border-[#0a0a0f]"
                    >
                      <option value="Morning Slot (10 AM - 4 PM)">Morning Slot (10:00 AM - 04:00 PM)</option>
                      <option value="Evening Slot (5 PM - 11 PM)">Evening Concert Slot (05:00 PM - 11:00 PM)</option>
                      <option value="Full Day (10 AM - 11 PM)">Full Day Rental (10:00 AM - 11:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-[#5c5c66]">
                    <span>Base Venue Slot</span>
                    <span className="text-[#0a0a0f] font-bold">₹{Number(venue.base_price).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c66]">
                    <span>Acoustic Rig & Sound PA</span>
                    <span className="text-emerald-700 font-bold">INCLUDED</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0a0a0f] pt-2 border-t border-slate-100">
                    <span>Total Estimate</span>
                    <span className="text-slate-950 text-base font-extrabold">₹{Number(venue.base_price).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Link
                  to={`/band/login?redirect=/band/venues/${venue.id}`}
                  className="w-full mokijo-btn-primary py-3.5 text-center block text-sm"
                >
                  Request Venue Booking
                </Link>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  Venue manager will confirm slot availability within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BandFooter />
    </div>
  );
}
