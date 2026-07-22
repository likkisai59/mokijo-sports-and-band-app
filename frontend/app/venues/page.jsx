"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Compass, Star, ArrowLeft, Loader2, Locate } from "lucide-react";

function VenueSearchContent() {
    const searchParams = useSearchParams();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSport, setSelectedSport] = useState("all");
    const [error, setError] = useState(null);

    // Advanced filters state
    const [maxPrice, setMaxPrice] = useState("");
    const [minRating, setMinRating] = useState("");
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [userLat, setUserLat] = useState(null);
    const [userLng, setUserLng] = useState(null);
    const [maxDistance, setMaxDistance] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const sportQuery = searchParams.get("sport");

    useEffect(() => {
        if (sportQuery) {
            setSelectedSport(sportQuery.toLowerCase());
        }
    }, [sportQuery]);

    // Dynamic backend fetching with filter parameters
    useEffect(() => {
        const fetchVenues = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                if (selectedSport && selectedSport !== "all") {
                    queryParams.append("sport", selectedSport);
                }
                if (maxPrice) {
                    queryParams.append("max_price", maxPrice);
                }
                if (minRating) {
                    queryParams.append("min_rating", minRating);
                }
                if (onlyAvailable) {
                    queryParams.append("only_available", "true");
                    if (selectedDate) {
                        queryParams.append("date", selectedDate);
                    }
                }
                if (userLat !== null && userLng !== null) {
                    queryParams.append("latitude", userLat.toString());
                    queryParams.append("longitude", userLng.toString());
                    if (maxDistance) {
                        queryParams.append("max_distance", maxDistance);
                    }
                }

                const response = await fetch(`${API_BASE_URL}/venues?${queryParams.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setVenues(data || []);
                } else {
                    setError("Failed to fetch venues.");
                }
            } catch {
                setError("Cannot connect to server. Is the backend running?");
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, [selectedSport, maxPrice, minRating, onlyAvailable, selectedDate, userLat, userLng, maxDistance]);

    // Request browser geolocation
    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }
        setLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLat(position.coords.latitude);
                setUserLng(position.coords.longitude);
                setLocationLoading(false);
                if (!maxDistance) {
                    setMaxDistance("25"); // default radius
                }
            },
            () => {
                setLocationError("Unable to retrieve location. Please check browser permissions.");
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const clearLocation = () => {
        setUserLat(null);
        setUserLng(null);
        setMaxDistance("");
        setLocationError(null);
    };

    // Filter venues on client side for searchTerm (name / location text)
    const filteredVenues = venues.filter((venue) => {
        const matchesSearch =
            venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const sportsList = ["all", "badminton", "cricket", "football", "basketball", "tennis", "swimming"];

    return (
        <div style={styles.container}>
            {/* Top Header */}
            <header style={styles.header}>
                <Link href="/user-dashboard" style={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Back to Dashboard</span>
                </Link>
                <div style={styles.brand}>
                    <Compass size={24} style={{ color: "#c6ff3d" }} />
                    <h1 style={styles.brandTitle}>Discover Venues</h1>
                </div>
            </header>

            {/* Main Area */}
            <div style={styles.main}>
                {/* Search and Filters Banner */}
                <section style={styles.filterSection}>
                    <div style={styles.searchWrapper}>
                        <Search style={styles.searchIcon} size={18} />
                        <input
                            type="text"
                            placeholder="Search by venue name or location..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sport Chips */}
                    <div style={styles.sportsContainer}>
                        {sportsList.map((sport) => (
                            <button
                                key={sport}
                                onClick={() => setSelectedSport(sport)}
                                style={{
                                    ...styles.sportChip,
                                    backgroundColor: selectedSport === sport ? "#c6ff3d" : "rgba(255, 255, 255, 0.04)",
                                    color: selectedSport === sport ? "#08080f" : "rgba(244, 244, 245, 0.7)",
                                    borderColor: selectedSport === sport ? "#c6ff3d" : "rgba(255, 255, 255, 0.08)",
                                }}
                            >
                                {sport.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Advanced Filters Section */}
                    <div style={styles.filtersGrid}>
                        {/* Budget Filter */}
                        <div style={styles.filterControl}>
                            <label style={styles.filterLabel}>Max Budget</label>
                            <select
                                style={styles.filterSelect}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            >
                                <option value="">Any Price</option>
                                <option value="500">Under ₹500 / hr</option>
                                <option value="1000">Under ₹1,000 / hr</option>
                                <option value="1500">Under ₹1,500 / hr</option>
                                <option value="2000">Under ₹2,000 / hr</option>
                            </select>
                        </div>

                        {/* Minimum Rating */}
                        <div style={styles.filterControl}>
                            <label style={styles.filterLabel}>Min Rating</label>
                            <select
                                style={styles.filterSelect}
                                value={minRating}
                                onChange={(e) => setMinRating(e.target.value)}
                            >
                                <option value="">Any Rating</option>
                                <option value="4.0">4.0+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4.8">4.8+ Stars</option>
                            </select>
                        </div>

                        {/* Distance Filter */}
                        <div style={styles.filterControl}>
                            <label style={styles.filterLabel}>Distance (Radius)</label>
                            <div style={styles.locationWrapper}>
                                {userLat !== null && userLng !== null ? (
                                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                        <select
                                            style={{ ...styles.filterSelect, flex: 1 }}
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(e.target.value)}
                                        >
                                            <option value="">Any Distance</option>
                                            <option value="5">Within 5 km</option>
                                            <option value="10">Within 10 km</option>
                                            <option value="25">Within 25 km</option>
                                            <option value="50">Within 50 km</option>
                                        </select>
                                        <button onClick={clearLocation} style={styles.locationClearBtn}>
                                            Reset
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={requestLocation}
                                        style={styles.locationBtn}
                                        disabled={locationLoading}
                                    >
                                        {locationLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={14} />
                                                <span>Locating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Locate size={14} />
                                                <span>Find Near Me</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            {locationError && <span style={styles.locationError}>{locationError}</span>}
                            {userLat !== null && userLng !== null && (
                                <span style={styles.locationSuccess}>📍 Location shared</span>
                            )}
                        </div>

                        {/* Date Availability Filter */}
                        <div style={styles.filterControl}>
                            <label style={styles.filterLabel}>Date & Availability</label>
                            <div style={styles.availabilityWrapper}>
                                <input
                                    type="date"
                                    style={styles.filterDateInput}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <label style={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={onlyAvailable}
                                        onChange={(e) => setOnlyAvailable(e.target.checked)}
                                        style={styles.toggleCheckbox}
                                    />
                                    <span>Only Available Arenas</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Loading state */}
                {loading ? (
                    <div style={styles.loadingContainer}>
                        <Loader2 className="animate-spin" size={32} style={{ color: "#c6ff3d" }} />
                        <p style={{ marginTop: "16px", color: "rgba(148, 163, 184, 0.6)" }}>
                            Searching sports arenas nearby...
                        </p>
                    </div>
                ) : error ? (
                    <div style={styles.errorContainer}>{error}</div>
                ) : filteredVenues.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <Compass size={48} style={{ color: "rgba(148, 163, 184, 0.2)", marginBottom: "16px" }} />
                        <h3>No arenas found</h3>
                        <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "14px", marginTop: "8px" }}>
                            Try adjusting your filters or search terms.
                        </p>
                    </div>
                ) : (
                    /* Venues Grid */
                    <div style={styles.grid}>
                        {filteredVenues.map((venue) => (
                            <div key={venue.id} style={styles.card}>
                                {/* Image cover */}
                                <div style={styles.cardImageWrapper}>
                                    <img
                                        src={
                                            venue.cover_image ||
                                            "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=600&auto=format&fit=crop"
                                        }
                                        alt={venue.name}
                                        style={styles.cardImage}
                                    />
                                    <div style={styles.ratingBadge}>
                                        <Star size={12} fill="#ffb800" stroke="#ffb800" />
                                        <span>{venue.rating || "5.0"}</span>
                                    </div>
                                    {venue.distance !== undefined && venue.distance !== null && (
                                        <div style={styles.distanceBadge}>
                                            <MapPin size={12} style={{ color: "#d9ff6e" }} />
                                            <span>{venue.distance} km</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Details */}
                                <div style={styles.cardBody}>
                                    <h3 style={styles.cardName}>{venue.name}</h3>
                                    <div style={styles.cardLoc}>
                                        <MapPin size={12} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                        <span>{venue.location}</span>
                                    </div>

                                    {/* Sport Chips inside card */}
                                    <div style={styles.cardSports}>
                                        {venue.sports_supported ? (
                                            venue.sports_supported.split(",").map((s, idx) => (
                                                <span key={idx} style={styles.cardSportChip}>
                                                    {s.trim()}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={styles.cardSportChip}>Sports</span>
                                        )}
                                    </div>

                                    {/* Footer pricing */}
                                    <div style={styles.cardFooter}>
                                        <div style={styles.priceSec}>
                                            <span style={styles.priceVal}>₹{venue.base_price_per_hour || 800}</span>
                                            <span style={styles.priceUnit}>/hr onwards</span>
                                        </div>
                                        <Link href={`/venues/${venue.id}`} style={styles.bookBtn}>
                                            <span>Book Slot</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VenueSearchPage() {
    return (
        <Suspense fallback={null}>
            <VenueSearchContent />
        </Suspense>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#08080f",
        color: "#f4f4f5",
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: "80px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(20, 20, 31, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    backBtn: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#d9ff6e",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "600",
    },
    brand: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    brandTitle: {
        fontSize: "20px",
        fontWeight: "800",
        background: "linear-gradient(135deg, #ffffff, rgba(255,255,255,0.7))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    main: {
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "40px",
    },
    filterSection: {
        background: "linear-gradient(135deg, rgba(20, 20, 31, 0.9) 0%, rgba(20, 20, 35, 0.7) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    },
    searchWrapper: {
        position: "relative",
        width: "100%",
    },
    searchIcon: {
        position: "absolute",
        left: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "rgba(148, 163, 184, 0.5)",
    },
    searchInput: {
        width: "100%",
        padding: "16px 16px 16px 48px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        fontSize: "15px",
        color: "#f4f4f5",
        outline: "none",
        transition: "all 0.25s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    sportsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
    },
    sportChip: {
        padding: "8px 18px",
        borderRadius: "20px",
        border: "1px solid",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.25s ease",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#fca5a5",
        padding: "16px",
        borderRadius: "12px",
        textAlign: "center",
        fontSize: "14px",
    },
    emptyContainer: {
        textAlign: "center",
        padding: "80px 0",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "30px",
    },
    card: {
        background: "rgba(20, 20, 31, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
    cardImageWrapper: {
        position: "relative",
        height: "180px",
        overflow: "hidden",
        backgroundColor: "#0d0d16",
    },
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform 0.5s ease",
    },
    ratingBadge: {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(20, 20, 31, 0.8)",
        backdropFilter: "blur(4px)",
        borderRadius: "8px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#ffb800",
        border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    cardBody: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
    },
    cardName: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: "8px",
    },
    cardLoc: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: "rgba(148, 163, 184, 0.6)",
        marginBottom: "16px",
    },
    cardSports: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginBottom: "20px",
    },
    cardSportChip: {
        fontSize: "10px",
        fontWeight: "700",
        color: "#d9ff6e",
        background: "rgba(217, 255, 110, 0.06)",
        padding: "3px 8px",
        borderRadius: "4px",
        border: "1px solid rgba(217, 255, 110, 0.12)",
        textTransform: "uppercase",
    },
    cardFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: "16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    },
    priceSec: {
        display: "flex",
        flexDirection: "column",
    },
    priceVal: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#ffffff",
    },
    priceUnit: {
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.4)",
    },
    bookBtn: {
        background: "linear-gradient(135deg, #c6ff3d, #d9ff6e)",
        color: "#08080f",
        border: "none",
        padding: "8px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: "skewX(-6deg)",
        boxShadow: "0 4px 12px rgba(198, 255, 61, 0.2)",
    },
    distanceBadge: {
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(20, 20, 31, 0.8)",
        backdropFilter: "blur(4px)",
        borderRadius: "8px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#d9ff6e",
        border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginTop: "10px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        paddingTop: "20px",
    },
    filterControl: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    filterLabel: {
        fontSize: "12px",
        fontWeight: "700",
        color: "rgba(244, 244, 245, 0.5)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    filterSelect: {
        width: "100%",
        padding: "10px 14px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#f4f4f5",
        outline: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    locationWrapper: {
        display: "flex",
        alignItems: "center",
        width: "100%",
    },
    locationBtn: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(217, 255, 110, 0.06)",
        border: "1px solid rgba(217, 255, 110, 0.15)",
        borderRadius: "8px",
        color: "#d9ff6e",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    locationClearBtn: {
        padding: "10px 14px",
        background: "rgba(239, 68, 68, 0.06)",
        border: "1px solid rgba(239, 68, 68, 0.15)",
        borderRadius: "8px",
        color: "#fca5a5",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    locationSuccess: {
        fontSize: "11px",
        color: "#10b981",
        marginTop: "2px",
    },
    locationError: {
        fontSize: "11px",
        color: "#ef4444",
        marginTop: "2px",
    },
    availabilityWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    filterDateInput: {
        width: "100%",
        padding: "10px 14px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#f4f4f5",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        colorScheme: "dark",
    },
    toggleLabel: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        fontWeight: "700",
        color: "rgba(244, 244, 245, 0.8)",
        cursor: "pointer",
        userSelect: "none",
    },
    toggleCheckbox: {
        width: "16px",
        height: "16px",
        accentColor: "#c6ff3d",
        cursor: "pointer",
    },
};
