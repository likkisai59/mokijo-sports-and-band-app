import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import {
  Search,
  Mic2,
  Building2,
  Star,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Users,
  Zap,
} from "lucide-react";

// Initial verified showcase data
const INITIAL_ARTISTS = [
  {
    id: 101,
    display_name: "The Deccan Strings",
    username: "deccanstrings",
    bio: "Premier acoustic & fusion band based in Hyderabad. Specializing in Telugu & Bollywood hits with acoustic cello and guitars.",
    base_rate: 25000,
    rating: 4.9,
    band_type: "Band",
    total_members: 4,
    profile_image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    genres: ["Fusion", "Acoustic", "Bollywood"],
  },
  {
    id: 102,
    display_name: "Rhea Chakraborty Live",
    username: "rheasings",
    bio: "Soulful playback singer and indie-pop vocalist for weddings, club gigs, and corporate galas.",
    base_rate: 18000,
    rating: 4.8,
    band_type: "Solo",
    total_members: 1,
    profile_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    genres: ["Bollywood", "Indie Pop", "Sufi"],
  },
  {
    id: 103,
    display_name: "Groove Syndicate",
    username: "groovesyndicate",
    bio: "High-energy 5-piece rock & funk ensemble delivering electrifying concert and arena performances.",
    base_rate: 45000,
    rating: 5.0,
    band_type: "Band",
    total_members: 5,
    profile_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    genres: ["Rock", "Funk", "Classic Rock"],
  },
];

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
    cover_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    facilities: ["Heavy Bass Rig", "DMX Strobe Rig", "Artist Dressing Suite"],
  },
];

export default function BandLandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState(INITIAL_ARTISTS);
  const [featuredVenues, setFeaturedVenues] = useState(INITIAL_VENUES);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const [resArtists, resVenues] = await Promise.all([
          fetch("http://localhost:8001/api/band/artists?limit=6")
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("http://localhost:8001/api/band/venues?limit=3")
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (resArtists?.items && resArtists.items.length > 0) {
          setFeaturedArtists(resArtists.items);
        }
        if (resVenues?.items && resVenues.items.length > 0) {
          setFeaturedVenues(resVenues.items);
        }
      } catch (err) {
        console.warn("Using default showcase data:", err);
      }
    }
    loadFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCity) params.set("city", selectedCity);

    if (selectedType === "venues") {
      navigate(`/band/venues?${params.toString()}`);
    } else {
      navigate(`/band/artists?${params.toString()}`);
    }
  };

  const trendingGenres = ["Bollywood", "Fusion", "Indie Rock", "Acoustic", "Pop", "Sufi"];

  return (
    <div className="band-page-container flex flex-col min-h-screen">
      <BandNavbar />

      <main className="flex-1">
        {/* ── 1. PERFECTLY CENTERED HERO SECTION ── */}
        <section className="band-hero-wrapper">
          <div className="band-ambient-light" />

          <div className="band-hero-content">
            {/* Top Pill Badge */}
            <div className="band-hero-badge">
              <span style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#c6ff3d" }} />
              <span>Live Music Artist & Venue Marketplace</span>
            </div>

            {/* Centered Headline */}
            <h1 className="band-hero-title">
              Book Live Bands, Solo Artists &{" "}
              <span className="band-hero-highlight">
                Stunning Venues.
                <span className="band-hero-highlight-bg" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="band-hero-subtitle">
              Discover verified performers, audit acoustic specs, check real-time calendar availability, and coordinate bookings seamlessly.
            </p>

            {/* ── IMMACULATE CENTERED SEARCH BOX ── */}
            <div className="band-search-container-box">
              <form onSubmit={handleSearch} className="band-search-row">
                {/* 1. Category Switcher */}
                <div className="band-segmented-pills">
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className={`band-pill-btn ${selectedType === "all" ? "active" : ""}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("artists")}
                    className={`band-pill-btn ${selectedType === "artists" ? "active" : ""}`}
                  >
                    Artists
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("venues")}
                    className={`band-pill-btn ${selectedType === "venues" ? "active" : ""}`}
                  >
                    Venues
                  </button>
                </div>

                {/* 2. Text Search Input with Clean Left Icon */}
                <div className="band-input-wrapper">
                  <div className="band-input-icon">
                    <Search style={{ width: "16px", height: "16px" }} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      selectedType === "venues"
                        ? "Search by venue name, rooftop, auditorium..."
                        : "Search by artist name, Bollywood, acoustic..."
                    }
                    className="band-text-input"
                  />
                </div>

                {/* 3. City Select Dropdown with Clean Left Icon */}
                <div className="band-city-wrapper">
                  <div className="band-input-icon" style={{ left: "12px" }}>
                    <MapPin style={{ width: "16px", height: "16px" }} />
                  </div>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="band-city-select"
                  >
                    <option value="">All Cities</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Goa">Goa</option>
                  </select>
                </div>

                {/* 4. Electric Lime CTA Button */}
                <button type="submit" className="band-search-action-btn">
                  <Search style={{ width: "16px", height: "16px" }} />
                  <span>Search</span>
                </button>
              </form>

              {/* Centered Trending Chips */}
              <div className="band-trending-row">
                <span style={{ color: "#5c5c66", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap style={{ width: "14px", height: "14px", color: "#f59e0b" }} /> Trending:
                </span>
                {trendingGenres.map((g) => (
                  <Link
                    key={g}
                    to={`/band/artists?genre=${encodeURIComponent(g)}`}
                    className="band-trending-pill"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. FEATURED ARTISTS SECTION ── */}
        <section style={{ backgroundColor: "#ffffff", borderTop: "1px solid rgba(10,10,15,0.06)", borderBottom: "1px solid rgba(10,10,15,0.06)" }}>
          <div className="band-section-container">
            <div className="band-section-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Mic2 style={{ width: "14px", height: "14px", color: "#0a0a0f" }} />
                  <span>Verified Performers</span>
                </div>
                <h2 className="band-section-title">
                  Featured Artists & Live Bands
                </h2>
              </div>
              <Link
                to="/band/artists"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none" }}
              >
                <span>View All Performers</span>
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </Link>
            </div>

            {/* Artist Cards Grid */}
            <div className="band-cards-grid">
              {featuredArtists.map((artist) => (
                <div key={artist.id} className="band-card-item group">
                  {/* Card Cover */}
                  <div style={{ position: "relative", height: "210px", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                    <img
                      src={artist.cover_image}
                      alt={artist.display_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

                    {/* Band Type Badge */}
                    <span style={{ position: "absolute", top: "14px", left: "14px", padding: "4px 10px", borderRadius: "9999px", fontSize: "10px", fontWeight: 800, backgroundColor: "rgba(255,255,255,0.92)", color: "#0a0a0f" }}>
                      {artist.band_type} • {artist.total_members} {artist.total_members > 1 ? "Members" : "Solo"}
                    </span>

                    {/* Verified Badge */}
                    <div style={{ position: "absolute", top: "14px", right: "14px", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                      <ShieldCheck style={{ width: "14px", height: "14px", color: "#059669" }} />
                      <span>Verified</span>
                    </div>

                    {/* Avatar & Title */}
                    <div style={{ position: "absolute", bottom: "14px", left: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={artist.profile_image}
                        alt={artist.display_name}
                        style={{ width: "48px", height: "48px", borderRadius: "14px", objectFit: "cover", border: "2px solid #ffffff", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}
                      />
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: "16px", color: "#ffffff", margin: 0 }}>
                          {artist.display_name}
                        </h3>
                        <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0 }}>@{artist.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "13px", color: "#5c5c66", lineHeight: 1.6, margin: "0 0 16px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {artist.bio}
                    </p>

                    {/* Genre Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                      {artist.genres.slice(0, 3).map((g) => (
                        <span key={g} style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* Footer: Price & Book */}
                    <div style={{ paddingTop: "16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 800, display: "block" }}>Starting Rate</span>
                        <span style={{ fontWeight: 900, fontSize: "17px", color: "#0a0a0f" }}>
                          ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 400 }}> / gig</span>
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "4px 8px", borderRadius: "8px" }}>
                          <Star style={{ width: "14px", height: "14px", fill: "#f59e0b", color: "#f59e0b" }} />
                          <span>{artist.rating}</span>
                        </div>
                        <Link
                          to={`/band/artists/${artist.id}`}
                          className="band-search-action-btn"
                          style={{ height: "36px", padding: "0 16px", fontSize: "12px", textDecoration: "none" }}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. FEATURED VENUES SECTION ── */}
        <section style={{ backgroundColor: "#f7f7f8" }}>
          <div className="band-section-container">
            <div className="band-section-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Building2 style={{ width: "14px", height: "14px", color: "#0a0a0f" }} />
                  <span>Concert Ready Spaces</span>
                </div>
                <h2 className="band-section-title">
                  Featured Performance Venues
                </h2>
              </div>
              <Link
                to="/band/venues"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none" }}
              >
                <span>Explore All Venues</span>
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </Link>
            </div>

            {/* Venue Cards Grid */}
            <div className="band-cards-grid">
              {featuredVenues.map((venue) => (
                <div key={venue.id} className="band-card-item group">
                  <div style={{ position: "relative", height: "210px", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                    <img
                      src={venue.cover_image}
                      alt={venue.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

                    <span style={{ position: "absolute", top: "14px", left: "14px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontFamily: "monospace", fontWeight: 900, backgroundColor: "#ffffff", color: "#0f172a", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                      {venue.venue_number}
                    </span>

                    <span style={{ position: "absolute", top: "14px", right: "14px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, backgroundColor: "rgba(255,255,255,0.92)", color: "#0a0a0f", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Users style={{ width: "13px", height: "13px", color: "#64748b" }} />
                      <span>{venue.capacity} Pax</span>
                    </span>

                    <div style={{ position: "absolute", bottom: "14px", left: "16px" }}>
                      <h3 style={{ fontWeight: 800, fontSize: "18px", color: "#ffffff", margin: 0 }}>
                        {venue.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin style={{ width: "13px", height: "13px", color: "#c6ff3d" }} />
                        {venue.city}, {venue.state}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "13px", color: "#5c5c66", lineHeight: 1.6, margin: "0 0 16px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {venue.description}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                      {venue.facilities.slice(0, 3).map((f) => (
                        <span key={f} style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {f}
                        </span>
                      ))}
                    </div>

                    <div style={{ paddingTop: "16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 800, display: "block" }}>Slot Rate</span>
                        <span style={{ fontWeight: 900, fontSize: "17px", color: "#0a0a0f" }}>
                          ₹{Number(venue.base_price).toLocaleString("en-IN")}
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 400 }}> / slot</span>
                        </span>
                      </div>

                      <Link
                        to={`/band/venues/${venue.id}`}
                        style={{ padding: "8px 18px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", backgroundColor: "#ffffff", border: "1px solid rgba(10,10,15,0.12)", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. HOW IT WORKS ── */}
        <section style={{ backgroundColor: "#ffffff", borderTop: "1px solid rgba(10,10,15,0.06)", padding: "100px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", display: "block", marginBottom: "8px" }}>
              Simple 3-Step Journey
            </span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>
              How BandConnect Works
            </h2>
            <p style={{ color: "#5c5c66", fontSize: "15px", maxWidth: "560px", margin: "0 auto 60px auto", lineHeight: 1.6 }}>
              From discovering top artists to seamless on-ground performance coordination.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", textAlign: "left" }}>
              <div className="band-card-item" style={{ padding: "36px 30px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f", fontWeight: 900, fontSize: "18px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(198,255,61,0.4)" }}>
                  01
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: "0 0 10px 0" }}>Discover & Audit</h3>
                <p style={{ color: "#5c5c66", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                  Browse verified audio samples, video reels, venue acoustic specs, and transparent hourly rates.
                </p>
              </div>

              <div className="band-card-item" style={{ padding: "36px 30px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d", fontWeight: 900, fontSize: "18px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  02
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: "0 0 10px 0" }}>Request & Approve</h3>
                <p style={{ color: "#5c5c66", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                  Select your date, time slot, and guest requirements. Performers and venues review and accept your booking.
                </p>
              </div>

              <div className="band-card-item" style={{ padding: "36px 30px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f", fontWeight: 900, fontSize: "18px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(198,255,61,0.4)" }}>
                  03
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: "0 0 10px 0" }}>Celebrate & Review</h3>
                <p style={{ color: "#5c5c66", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                  Lock your booking with verified advance payment. Enjoy the event and leave verified feedback.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BandFooter />
    </div>
  );
}
