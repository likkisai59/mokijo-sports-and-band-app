import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import {
  Search,
  Mic2,
  Filter,
  Star,
  ShieldCheck,
  Music,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

// Preloaded rich verified performer dataset
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
    language: "Telugu",
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
    language: "Hindi",
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
    language: "English",
  },
  {
    id: 104,
    display_name: "Karthik Trio Unplugged",
    username: "karthiktrio",
    bio: "Harmonious 3-piece acoustic ensemble performing Carnatic fusion, AR Rahman classics, and retro pop melodies.",
    base_rate: 30000,
    rating: 4.9,
    band_type: "Duo",
    total_members: 3,
    profile_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    genres: ["Classical", "Fusion", "Acoustic"],
    language: "Tamil",
  },
];

export default function BandArtistsMarketplace() {
  const [searchParams] = useSearchParams();
  const [artists, setArtists] = useState(INITIAL_ARTISTS);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "");
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get("language") || "");
  const [selectedBandType, setSelectedBandType] = useState(searchParams.get("band_type") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "rating_desc");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");

  const genres = ["All", "Bollywood", "Fusion", "Indie Rock", "Acoustic", "Pop", "Sufi", "Classical", "Jazz", "EDM"];
  const languages = ["All", "English", "Hindi", "Telugu", "Tamil", "Kannada", "Punjabi"];
  const bandTypes = ["All", "Solo", "Duo", "Band"];

  useEffect(() => {
    async function fetchArtists() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (selectedGenre && selectedGenre !== "All") params.set("genre", selectedGenre);
        if (selectedLanguage && selectedLanguage !== "All") params.set("language", selectedLanguage);
        if (selectedBandType && selectedBandType !== "All") params.set("band_type", selectedBandType);
        if (maxPrice) params.set("max_price", maxPrice);
        if (sortBy) params.set("sort", sortBy);

        const res = await fetch(`http://localhost:8001/api/band/artists?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.items && data.items.length > 0) {
            setArtists(data.items);
            return;
          }
        }
        
        // Client side filtering on initial list if backend is offline
        let filtered = [...INITIAL_ARTISTS];
        if (search) {
          filtered = filtered.filter(a => a.display_name.toLowerCase().includes(search.toLowerCase()) || a.bio.toLowerCase().includes(search.toLowerCase()));
        }
        if (selectedGenre && selectedGenre !== "All") {
          filtered = filtered.filter(a => a.genres.includes(selectedGenre));
        }
        if (selectedBandType && selectedBandType !== "All") {
          filtered = filtered.filter(a => a.band_type === selectedBandType);
        }
        if (maxPrice) {
          filtered = filtered.filter(a => a.base_rate <= Number(maxPrice));
        }
        setArtists(filtered);
      } catch (err) {
        console.warn("Using filtered showcase data:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchArtists();
    }, 150);

    return () => clearTimeout(timer);
  }, [search, selectedGenre, selectedLanguage, selectedBandType, sortBy, maxPrice]);

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedBandType("");
    setMaxPrice("");
    setSortBy("rating_desc");
  };

  return (
    <div className="band-page-container flex flex-col min-h-screen">
      <BandNavbar />

      <main className="band-marketplace-container flex-1">
        {/* ── 1. PAGE HEADER ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            <Mic2 style={{ width: "14px", height: "14px", color: "#0a0a0f" }} />
            <span>Marketplace Directory</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>
            Discover Music Artists & Live Bands
          </h1>
          <p style={{ color: "#5c5c66", fontSize: "15px", margin: 0 }}>
            Book verified vocalists, instrumentalists, acoustic ensembles, and live concert bands.
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
              placeholder="Search by artist name, bio, instruments, or style..."
              style={{ width: "100%", height: "46px", background: "#f8fafc", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "12px", padding: "0 16px 0 42px", fontSize: "14px", color: "#0a0a0f", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: "46px", background: "#f8fafc", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "12px", padding: "0 16px", fontSize: "13px", fontWeight: 700, color: "#0a0a0f", outline: "none", cursor: "pointer" }}
            >
              <option value="rating_desc">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
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
                Filter Artists
              </span>
              <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Reset All
              </button>
            </div>

            {/* Genre Filter */}
            <div>
              <span className="band-filter-group-title">Music Genre</span>
              <div className="band-filter-chips-wrap">
                {genres.map((g) => {
                  const active = (selectedGenre === g) || (!selectedGenre && g === "All");
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g === "All" ? "" : g)}
                      className={`band-filter-chip ${active ? "active" : ""}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Band Type Segmented */}
            <div>
              <span className="band-filter-group-title">Band Type</span>
              <div className="band-segmented-3">
                {bandTypes.map((t) => {
                  const active = (selectedBandType === t) || (!selectedBandType && t === "All");
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedBandType(t === "All" ? "" : t)}
                      className={`band-seg-btn ${active ? "active" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Languages Filter */}
            <div>
              <span className="band-filter-group-title">Languages</span>
              <div className="band-filter-chips-wrap">
                {languages.map((lang) => {
                  const active = (selectedLanguage === lang) || (!selectedLanguage && lang === "All");
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang === "All" ? "" : lang)}
                      className={`band-filter-chip ${active ? "active" : ""}`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Budget Slider */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="band-filter-group-title" style={{ margin: 0 }}>Max Budget</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f" }}>
                  {maxPrice ? `₹${Number(maxPrice).toLocaleString("en-IN")}` : "Any Price"}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={maxPrice || 100000}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: "100%", accentColor: "#0a0a0f", cursor: "pointer" }}
              />
            </div>
          </aside>

          {/* Right Results Grid */}
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                Showing <strong style={{ color: "#0a0a0f", fontWeight: 900 }}>{artists.length}</strong> verified performers
              </span>
            </div>

            {artists.length === 0 ? (
              <div style={{ background: "#ffffff", border: "1px solid rgba(10,10,15,0.08)", borderRadius: "20px", padding: "60px 24px", textAlign: "center" }}>
                <Music style={{ width: "48px", height: "48px", color: "#cbd5e1", margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: "0 0 6px 0" }}>No Artists Match Your Filters</h3>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0" }}>Try clearing some of your filters or search keywords.</p>
                <button onClick={clearFilters} className="band-search-action-btn" style={{ margin: "0 auto", height: "40px", padding: "0 20px" }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                {artists.map((artist) => (
                  <div key={artist.id} className="band-card-item group">
                    {/* Card Cover */}
                    <div style={{ position: "relative", height: "190px", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                      <img
                        src={artist.cover_image}
                        alt={artist.display_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

                      {/* Band Type Badge */}
                      <span style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 10px", borderRadius: "9999px", fontSize: "10px", fontWeight: 800, backgroundColor: "rgba(255,255,255,0.92)", color: "#0a0a0f" }}>
                        {artist.band_type} • {artist.total_members} {artist.total_members > 1 ? "Pax" : "Solo"}
                      </span>

                      {/* Verified Badge */}
                      <div style={{ position: "absolute", top: "12px", right: "12px", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                        <ShieldCheck style={{ width: "13px", height: "13px", color: "#059669" }} />
                        <span>Verified</span>
                      </div>

                      {/* Avatar & Title */}
                      <div style={{ position: "absolute", bottom: "12px", left: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={artist.profile_image}
                          alt={artist.display_name}
                          style={{ width: "42px", height: "42px", borderRadius: "12px", objectFit: "cover", border: "2px solid #ffffff", boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}
                        />
                        <div>
                          <h3 style={{ fontWeight: 800, fontSize: "15px", color: "#ffffff", margin: 0 }}>
                            {artist.display_name}
                          </h3>
                          <p style={{ fontSize: "11px", color: "#cbd5e1", margin: 0 }}>@{artist.username}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "12px", color: "#5c5c66", lineHeight: 1.6, margin: "0 0 14px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {artist.bio}
                      </p>

                      {/* Genre Tags */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                        {artist.genres.map((g) => (
                          <span key={g} style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#f1f5f9", color: "#475569" }}>
                            {g}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 800, display: "block" }}>Starting Rate</span>
                          <span style={{ fontWeight: 900, fontSize: "16px", color: "#0a0a0f" }}>
                            ₹{Number(artist.base_rate).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", fontWeight: 800, color: "#0a0a0f", backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "3px 7px", borderRadius: "8px" }}>
                            <Star style={{ width: "13px", height: "13px", fill: "#f59e0b", color: "#f59e0b" }} />
                            <span>{artist.rating}</span>
                          </div>
                          <Link
                            to={`/band/artists/${artist.id}`}
                            className="band-search-action-btn"
                            style={{ height: "34px", padding: "0 14px", fontSize: "12px", textDecoration: "none" }}
                          >
                            View Profile
                          </Link>
                        </div>
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
