import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import {
  Search,
  Building2,
  Filter,
  MapPin,
  Users,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

// Preloaded rich verified venues dataset
const INITIAL_VENUES = [
  {
    id: 201,
    venue_number: "BCV-000201",
    name: "The Velvet Amphitheater",
    description: "State-of-the-art live performance auditorium with concert acoustics, moving head stage lighting, and VIP lounge.",
    address: "Road No. 36, Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    capacity: 450,
    base_price: 55000,
    rating: 4.9,
    venue_type: "Amphitheater",
    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    facilities: ["Pro Sound Rig", "Motorized Stage", "2 Green Rooms", "AC"],
  },
  {
    id: 202,
    venue_number: "BCV-000202",
    name: "Skyline Rooftop Lounge",
    description: "Open-air panoramic rooftop arena tailored for sunset unplugged sessions, jazz evenings, and boutique galas.",
    address: "Financial District, Gachibowli",
    city: "Hyderabad",
    state: "Telangana",
    capacity: 200,
    base_price: 38000,
    rating: 4.7,
    venue_type: "Rooftop Lounge",
    cover_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    facilities: ["Warm Ambient LED", "Bose Array Sound", "Cocktail Bar", "Valet"],
  },
  {
    id: 203,
    venue_number: "BCV-000203",
    name: "Echo Underground Club",
    description: "Underground indie & rock sanctuary equipped with heavy subwoofers, industrial aesthetics, and stage isolation.",
    address: "Indiranagar 100ft Road",
    city: "Bengaluru",
    state: "Karnataka",
    capacity: 300,
    base_price: 42000,
    rating: 4.8,
    venue_type: "Club & Bar",
    cover_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    facilities: ["Heavy Bass Rig", "DMX Strobe Rig", "Artist Dressing Suite"],
  },
  {
    id: 204,
    venue_number: "BCV-000204",
    name: "Grand Symphony Concert Hall",
    description: "Multi-tiered acoustic concert auditorium tailored for classical symphonies, orchestral performances, and theatrical galas.",
    address: "Bandra West, Hill Road",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 850,
    base_price: 95000,
    rating: 5.0,
    venue_type: "Concert Hall",
    cover_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
    facilities: ["Acoustic Tuning Panels", "Tiered Seating", "Hydraulic Stage", "VIP Suites"],
  },
];

export default function BandVenuesMarketplace() {
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedVenueType, setSelectedVenueType] = useState(searchParams.get("venue_type") || "");
  const [minCapacity, setMinCapacity] = useState(searchParams.get("min_capacity") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recommended");

  const cities = ["All", "Hyderabad", "Bengaluru", "Mumbai", "Delhi NCR", "Chennai", "Goa"];
  const venueTypes = ["All", "Amphitheater", "Rooftop Lounge", "Concert Hall", "Club & Bar", "Auditorium"];

  useEffect(() => {
    async function fetchVenues() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (selectedCity && selectedCity !== "All") params.set("city", selectedCity);
        if (selectedVenueType && selectedVenueType !== "All") params.set("venue_type", selectedVenueType);
        if (minCapacity) params.set("min_capacity", minCapacity);
        if (sortBy) params.set("sort", sortBy);

        const res = await fetch(`http://localhost:8001/api/band/venues?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.items && data.items.length > 0) {
            setVenues(data.items);
            return;
          }
        }

        // Fallback filter on initial dataset
        let filtered = [...INITIAL_VENUES];
        if (search) {
          filtered = filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase()));
        }
        if (selectedCity && selectedCity !== "All") {
          filtered = filtered.filter(v => v.city === selectedCity);
        }
        if (selectedVenueType && selectedVenueType !== "All") {
          filtered = filtered.filter(v => v.venue_type === selectedVenueType);
        }
        if (minCapacity) {
          filtered = filtered.filter(v => v.capacity >= Number(minCapacity));
        }
        setVenues(filtered);
      } catch (err) {
        console.warn("Using filtered venue dataset:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchVenues();
    }, 150);

    return () => clearTimeout(timer);
  }, [search, selectedCity, selectedVenueType, minCapacity, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCity("");
    setSelectedVenueType("");
    setMinCapacity("");
    setSortBy("recommended");
  };

  return (
    <div className="band-page-container flex flex-col min-h-screen">
      <BandNavbar />

      <main className="band-marketplace-container flex-1">
        {/* ── 1. PAGE HEADER ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            <Building2 style={{ width: "14px", height: "14px", color: "#0a0a0f" }} />
            <span>Venue Directory</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>
            Performance Venues & Concert Spaces
          </h1>
          <p style={{ color: "#5c5c66", fontSize: "15px", margin: 0 }}>
            Discover verified auditoriums, rooftop lounges, open-air amphitheaters, and live club spaces.
          </p>
        </div>

        {/* ── 2. TOP SEARCH BAR ── */}
        <div style={{ background: "#ffffff", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "18px", padding: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", marginBottom: "36px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <Search style={{ width: "16px", height: "16px" }} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by venue name, Jubilee Hills, rooftop, auditorium..."
              style={{ width: "100%", height: "46px", background: "#f8fafc", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "12px", padding: "0 16px 0 42px", fontSize: "14px", color: "#0a0a0f", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: "46px", background: "#f8fafc", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "12px", padding: "0 16px", fontSize: "13px", fontWeight: 700, color: "#0a0a0f", outline: "none", cursor: "pointer" }}
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="capacity_desc">Highest Capacity</option>
            </select>

            <button
              onClick={clearFilters}
              style={{ height: "46px", padding: "0 18px", borderRadius: "12px", background: "#ffffff", border: "1px solid rgba(10,10,15,0.12)", color: "#0a0a0f", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            >
              <RotateCcw style={{ width: "14px", height: "14px" }} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ── 3. 2-COLUMN MARKETPLACE LAYOUT ── */}
        <div className="band-marketplace-layout">
          {/* Left Sidebar Filter */}
          <aside className="band-sidebar-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "#0a0a0f", display: "flex", alignItems: "center", gap: "8px" }}>
                <SlidersHorizontal style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
                Filter Venues
              </span>
              <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Reset All
              </button>
            </div>

            {/* City Filter */}
            <div>
              <span className="band-filter-group-title">City Location</span>
              <div className="band-filter-chips-wrap">
                {cities.map((c) => {
                  const active = (selectedCity === c) || (!selectedCity && c === "All");
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCity(c === "All" ? "" : c)}
                      className={`band-filter-chip ${active ? "active" : ""}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Venue Type */}
            <div>
              <span className="band-filter-group-title">Venue Type</span>
              <div className="band-filter-chips-wrap">
                {venueTypes.map((t) => {
                  const active = (selectedVenueType === t) || (!selectedVenueType && t === "All");
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedVenueType(t === "All" ? "" : t)}
                      className={`band-filter-chip ${active ? "active" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min Capacity Slider */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="band-filter-group-title" style={{ margin: 0 }}>Min Capacity</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f" }}>
                  {minCapacity ? `${minCapacity}+ Pax` : "Any Capacity"}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={minCapacity || 50}
                onChange={(e) => setMinCapacity(e.target.value)}
                style={{ width: "100%", accentColor: "#0a0a0f", cursor: "pointer" }}
              />
            </div>
          </aside>

          {/* Right Results Grid */}
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                Showing <strong style={{ color: "#0a0a0f", fontWeight: 900 }}>{venues.length}</strong> concert-ready spaces
              </span>
            </div>

            {venues.length === 0 ? (
              <div style={{ background: "#ffffff", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "20px", padding: "60px 24px", textAlign: "center" }}>
                <Building2 style={{ width: "48px", height: "48px", color: "#cbd5e1", margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: "0 0 6px 0" }}>No Venues Match Your Filters</h3>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0" }}>Try clearing some of your filters or location keywords.</p>
                <button onClick={clearFilters} className="band-search-action-btn" style={{ margin: "0 auto", height: "40px", padding: "0 20px" }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                {venues.map((venue) => (
                  <div key={venue.id} className="band-card-item group">
                    {/* Card Cover */}
                    <div style={{ position: "relative", height: "190px", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                      <img
                        src={venue.cover_image}
                        alt={venue.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

                      {/* BCV Number Badge */}
                      <span style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontFamily: "monospace", fontWeight: 900, backgroundColor: "#ffffff", color: "#0f172a", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                        {venue.venue_number}
                      </span>

                      {/* Capacity Badge */}
                      <span style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, backgroundColor: "rgba(255,255,255,0.92)", color: "#0a0a0f", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users style={{ width: "13px", height: "13px", color: "#64748b" }} />
                        <span>{venue.capacity} Pax</span>
                      </span>

                      {/* Title & City */}
                      <div style={{ position: "absolute", bottom: "12px", left: "14px" }}>
                        <h3 style={{ fontWeight: 800, fontSize: "16px", color: "#ffffff", margin: 0 }}>
                          {venue.name}
                        </h3>
                        <p style={{ fontSize: "11px", color: "#cbd5e1", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin style={{ width: "12px", height: "12px", color: "#c6ff3d" }} />
                          {venue.city}, {venue.state}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "12px", color: "#5c5c66", lineHeight: 1.6, margin: "0 0 14px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {venue.description}
                      </p>

                      {/* Facilities Tags */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                        {venue.facilities.slice(0, 3).map((f) => (
                          <span key={f} style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#f1f5f9", color: "#475569" }}>
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 800, display: "block" }}>Slot Rate</span>
                          <span style={{ fontWeight: 900, fontSize: "16px", color: "#0a0a0f" }}>
                            ₹{Number(venue.base_price).toLocaleString("en-IN")}
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400 }}> / slot</span>
                          </span>
                        </div>

                        <Link
                          to={`/band/venues/${venue.id}`}
                          style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", backgroundColor: "#ffffff", border: "1px solid rgba(10,10,15,0.12)", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BandFooter />
    </div>
  );
}
