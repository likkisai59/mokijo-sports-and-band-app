import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Heart,
} from "lucide-react";

export default function BandArtistDetailPage() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedHours, setSelectedHours] = useState(2);
  const [bookingDate, setBookingDate] = useState("");
  const [guestCount, setGuestCount] = useState("100-250");

  useEffect(() => {
    async function fetchArtistDetail() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/band/artists/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setArtist(data);
      } catch (err) {
        console.error("Failed to load artist detail:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchArtistDetail();
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

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col">
        <BandNavbar />
        <div className="max-w-[1600px] mx-auto px-4 py-20 text-center flex-1">
          <h2 className="text-2xl font-extrabold text-[#0a0a0f] mb-2">Artist Profile Not Found</h2>
          <p className="text-[#5c5c66] text-sm mb-6">The requested artist profile does not exist or has been removed.</p>
          <Link to="/band/artists" className="mokijo-btn-primary">
            Browse Artists
          </Link>
        </div>
        <BandFooter />
      </div>
    );
  }

  const estimatedTotal = Number(artist.base_rate) * selectedHours;

  return (
    <div className="flex flex-col min-h-screen">
      <BandNavbar />

      <main className="flex-1">
        {/* ── 1. HERO COVER & PROFILE ── */}
        <div className="relative">
          <div className="h-64 sm:h-80 w-full overflow-hidden relative bg-slate-200">
            <img src={artist.cover_image} alt={artist.display_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f7f7f8] via-transparent to-black/30" />
          </div>

          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-24 sm:-mt-28 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <img
                  src={artist.profile_image}
                  alt={artist.display_name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0a0a0f] text-white">
                      {artist.band_type}
                    </span>
                    <div className="mokijo-badge-verified">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Performer</span>
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0f] tracking-tight">{artist.display_name}</h1>
                  <p className="text-xs sm:text-sm text-[#5c5c66] font-medium">@{artist.username} • {artist.years_of_experience}+ Years Experience</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button className="mokijo-btn-secondary text-xs">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="mokijo-btn-secondary text-xs">
                  <Heart className="w-4 h-4" /> Wishlist
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200/80 text-xs">
              <div className="mokijo-card p-5">
                <span className="text-[#5c5c66] block font-bold text-[11px] uppercase tracking-wider mb-1">Performance Rate</span>
                <span className="text-lg font-extrabold text-[#0a0a0f]">
                  ₹{Number(artist.base_rate).toLocaleString("en-IN")}{" "}
                  <span className="text-xs text-slate-400 font-normal">/ hour</span>
                </span>
              </div>
              <div className="mokijo-card p-5">
                <span className="text-[#5c5c66] block font-bold text-[11px] uppercase tracking-wider mb-1">Artist Rating</span>
                <div className="flex items-center gap-1.5 text-slate-900 text-lg font-extrabold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{artist.rating}</span>
                  <span className="text-slate-400 text-xs font-normal">(18 Reviews)</span>
                </div>
              </div>
              <div className="mokijo-card p-5">
                <span className="text-[#5c5c66] block font-bold text-[11px] uppercase tracking-wider mb-1">Travel Radius</span>
                <span className="text-lg font-extrabold text-[#0a0a0f]">{artist.travel_radius} KM Coverage</span>
              </div>
              <div className="mokijo-card p-5">
                <span className="text-[#5c5c66] block font-bold text-[11px] uppercase tracking-wider mb-1">Squad Members</span>
                <span className="text-lg font-extrabold text-[#0a0a0f]">{artist.total_members} On-Stage Pax</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. BODY CONTENT & BOOKING WIDGET ── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Details Tabs */}
            <div className="lg:col-span-2 space-y-8">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    activeTab === "overview" ? "bg-[#c6ff3d] text-slate-950 shadow-xs" : "text-[#5c5c66] hover:text-[#0a0a0f]"
                  }`}
                >
                  Overview & Bio
                </button>
                <button
                  onClick={() => setActiveTab("media")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    activeTab === "media" ? "bg-[#c6ff3d] text-slate-950 shadow-xs" : "text-[#5c5c66] hover:text-[#0a0a0f]"
                  }`}
                >
                  Photo Gallery
                </button>
                <button
                  onClick={() => setActiveTab("equipment")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    activeTab === "equipment" ? "bg-[#c6ff3d] text-slate-950 shadow-xs" : "text-[#5c5c66] hover:text-[#0a0a0f]"
                  }`}
                >
                  Equipment & Tech
                </button>
              </div>

              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="mokijo-card p-6">
                    <h3 className="text-base font-extrabold text-[#0a0a0f] mb-2">About the Performer</h3>
                    <p className="text-xs sm:text-sm text-[#5c5c66] leading-relaxed whitespace-pre-line">{artist.bio}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="mokijo-card p-6">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {artist.genres.map((g) => (
                          <span key={g} className="mokijo-badge-genre">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mokijo-card p-6">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {artist.languages.map((l) => (
                          <span key={l} className="mokijo-badge-genre">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Media */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-extrabold text-[#0a0a0f]">Performance Moments & Gallery</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {artist.gallery.map((imgUrl, idx) => (
                      <div key={idx} className="h-56 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs group bg-slate-100">
                        <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Equipment */}
              {activeTab === "equipment" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-extrabold text-[#0a0a0f]">Equipment Provided by Artist</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {artist.equipment.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 mokijo-card p-4 text-xs font-semibold text-[#0a0a0f]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div>
              <div className="mokijo-card p-7 sticky top-28 space-y-6 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Standard Rate</span>
                    <span className="text-2xl font-extrabold text-[#0a0a0f]">
                      ₹{Number(artist.base_rate).toLocaleString("en-IN")}{" "}
                      <span className="text-xs text-slate-400 font-normal">/ hour</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-700 font-extrabold block">20% Advance Lock</span>
                    <span className="text-xs text-slate-400">Direct Coordination</span>
                  </div>
                </div>

                {/* Booking Inputs */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Event Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#0a0a0f]"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Performance Duration (Hours)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedHours(h)}
                          className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-all ${
                            selectedHours === h ? "bg-[#0a0a0f] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {h} {h > 1 ? "Hrs" : "Hr"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-[#0a0a0f] block mb-1.5">Expected Gathering</label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0a0a0f] focus:outline-none focus:border-[#0a0a0f]"
                    >
                      <option value="50-100">Intimate (50 - 100 Guests)</option>
                      <option value="100-250">Medium Gala (100 - 250 Guests)</option>
                      <option value="250-500">Concert / Wedding (250 - 500 Guests)</option>
                      <option value="500+">Arena / Festival (500+ Guests)</option>
                    </select>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-[#5c5c66]">
                    <span>Performance ({selectedHours} hrs × ₹{Number(artist.base_rate).toLocaleString("en-IN")})</span>
                    <span className="text-[#0a0a0f] font-bold">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c66]">
                    <span>Platform Escrow Protection</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0a0a0f] pt-2 border-t border-slate-100">
                    <span>Estimated Total</span>
                    <span className="text-slate-950 text-base font-extrabold">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Request Booking CTA */}
                <Link
                  to={`/band/login?redirect=/band/artists/${artist.id}`}
                  className="w-full mokijo-btn-primary py-3.5 text-center block text-sm"
                >
                  Request Booking & Check Availability
                </Link>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  No payment charged now. Performer reviews request within 24 hours.
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
