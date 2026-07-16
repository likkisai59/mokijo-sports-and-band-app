"use client";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LogOut,
    Calendar,
    Trophy,
    Award,
    MapPin,
    Activity,
    Bell,
    Compass,
    Clock,
    Search,
    Star,
    Loader2,
    Home as HomeIcon,
    Bike,
    Waves,
    Target,
    Flag,
    Shield,
    Users,
    UserCheck,
    Dumbbell,
    Sparkles,
    Flame,
    Heart,
    Gamepad2,
    Sword,
    PlusCircle,
    Play,
    CalendarCheck,
    Locate,
} from "lucide-react";

export default function UserDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState("User");
    const [userEmail, setUserEmail] = useState("");
    const [activeTab, setActiveTab] = useState("home"); // Default to Home tab

    // Explore / Discovery states
    const [venues, setVenues] = useState([]);
    const [loadingVenues, setLoadingVenues] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSport, setSelectedSport] = useState("all");

    // Advanced filters state for User Dashboard
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

    // Bookings states
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    // Create / Host Game form states
    const [gameSport, setGameSport] = useState("badminton");
    const [gameDate, setGameDate] = useState("");
    const [gameTime, setGameTime] = useState("");
    const [gameLocation, setGameLocation] = useState("");
    const [gameMaxPlayers, setGameMaxPlayers] = useState(4);
    const [gameSkillLevel, setGameSkillLevel] = useState("All");
    const [gameDescription, setGameDescription] = useState("");
    const [gamePrivacy, setGamePrivacy] = useState("public"); // Default to public
    const [gamePrice, setGamePrice] = useState(150);
    const [submittingGame, setSubmittingGame] = useState(false);
    const [gameSuccess, setGameSuccess] = useState(false);

    // List of joined/hosted activities
    const [hostedGames, setHostedGames] = useState([]);
    const [loadingHostedGames, setLoadingHostedGames] = useState(false);
    const [gameSubTab, setGameSubTab] = useState("host"); // Default to Host a Game in Game tab
    const [publicGames, setPublicGames] = useState([]);
    const [loadingPublicGames, setLoadingPublicGames] = useState(false);
    const [joiningGameId, setJoiningGameId] = useState(null);

    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        const storedEmail = localStorage.getItem("userEmail");
        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);
    }, []);

    // Fetch Venues dynamically with filters
    useEffect(() => {
        const fetchVenues = async () => {
            setLoadingVenues(true);
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
                }
            } catch (err) {
                console.error("Error loading venues:", err);
            } finally {
                setLoadingVenues(false);
            }
        };

        fetchVenues();
    }, [selectedSport, maxPrice, minRating, onlyAvailable, selectedDate, userLat, userLng, maxDistance]);

    // Geolocation handlers
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
                    setMaxDistance("25");
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

    // Fetch Bookings history helper
    const fetchBookings = async () => {
        if (!userId) return;
        setLoadingBookings(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}/bookings`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data || []);
            }
        } catch (err) {
            console.error("Error loading bookings:", err);
        } finally {
            setLoadingBookings(false);
        }
    };

    // Fetch Joined/Hosted Activities helper
    const fetchHostedGames = async () => {
        if (!userId) return;
        setLoadingHostedGames(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}/games`);
            if (res.ok) {
                const data = await res.json();
                const mappedGames = data.map((game) => {
                    const dt = new Date(game.slot_start);
                    return {
                        id: game.id,
                        owner_id: game.host_id,
                        sport: game.sport,
                        date: dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
                        time: dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
                        location: "Venue Sports Court",
                        max_players: game.total_spots,
                        current_players: game.current_players,
                        skill_level: "All",
                        privacy_type: game.visibility,
                        status: game.status,
                        price: game.price_per_player,
                    };
                });
                setHostedGames(mappedGames);
            }
        } catch (err) {
            console.error("Error loading activities:", err);
        } finally {
            setLoadingHostedGames(false);
        }
    };

    const fetchPublicGames = async () => {
        if (!userId) return;
        setLoadingPublicGames(true);
        try {
            const res = await fetch(`${API_BASE_URL}/games`);
            if (res.ok) {
                const data = await res.json();
                // Exclude lobbies where current user is the host
                const lobbies = data.filter((g) => g.host_id !== Number(userId));
                setPublicGames(lobbies);
            }
        } catch (err) {
            console.error("Error loading games:", err);
        } finally {
            setLoadingPublicGames(false);
        }
    };

    const handleJoinGame = async (gameId) => {
        if (!userId) return;
        setJoiningGameId(gameId);
        try {
            const res = await fetch(`${API_BASE_URL}/games/${gameId}/join?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === "pending_payment") {
                    router.push(`/checkout?game_id=${gameId}`);
                } else if (data.status === "pending_approval") {
                    alert("Join request submitted to host! Waiting for approval.");
                    fetchPublicGames();
                } else {
                    alert("Match joined successfully! ⚽");
                    fetchPublicGames();
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to join game.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection error. Could not join match.");
        } finally {
            setJoiningGameId(null);
        }
    };

    const handleJoinWaitlist = async (gameId) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/games/${gameId}/waitlist?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                alert("You have joined the match waitlist.");
                fetchPublicGames();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to join waitlist.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection error. Could not join waitlist.");
        }
    };

    useEffect(() => {
        if (activeTab === "my-bookings") {
            fetchBookings();
        } else if (activeTab === "game") {
            if (gameSubTab === "joined") {
                fetchHostedGames();
            } else if (gameSubTab === "explore") {
                fetchPublicGames();
            }
        }
    }, [activeTab, gameSubTab]);

    // Live WebSockets updates for open game lobbies
    useEffect(() => {
        if (activeTab !== "game" || gameSubTab !== "explore") return;

        const ws = new WebSocket(`${WS_BASE_URL}/ws/game/all`);
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setPublicGames((prev) =>
                    prev.map((game) => {
                        if (game.id === payload.game_id) {
                            return {
                                ...game,
                                current_players:
                                    payload.current_players !== undefined
                                        ? payload.current_players
                                        : game.current_players,
                                status: payload.status || game.status,
                            };
                        }
                        return game;
                    })
                );
            } catch (err) {
                console.error("Socket parse error:", err);
            }
        };

        return () => ws.close();
    }, [activeTab, gameSubTab]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm("Are you sure you want to cancel this slot reservation?")) return;
        setCancellingId(bookingId);
        try {
            const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: "POST",
            });
            if (res.ok) {
                await fetchBookings();
            } else {
                alert("Failed to cancel booking.");
            }
        } catch (err) {
            console.error(err);
            alert("Error cancelling booking.");
        } finally {
            setCancellingId(null);
        }
    };

    // Handle Create/Host Game Form Submit
    const handleHostGameSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;
        setSubmittingGame(true);
        setGameSuccess(false);

        // Convert date and time strings into ISO datetime strings
        const slotStartStr = `${gameDate}T${gameTime}:00`;
        const slotStart = new Date(slotStartStr);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour default duration

        const payload = {
            host_id: Number(userId),
            venue_id: null,
            sport: gameSport,
            slot_start: slotStart.toISOString(),
            slot_end: slotEnd.toISOString(),
            total_spots: Number(gameMaxPlayers),
            price_per_player: Number(gamePrice),
            join_policy: "instant",
            visibility: gamePrivacy,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setGameSuccess(true);
                // Reset form fields
                setGameDate("");
                setGameTime("");
                setGameLocation("");
                setGameDescription("");
                setGamePrice(150);
                setTimeout(() => {
                    setGameSubTab("joined");
                    setGameSuccess(false);
                    fetchHostedGames();
                    fetchPublicGames();
                }, 1500);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to host game match.");
            }
        } catch (err) {
            console.error("Error hosting game:", err);
            alert("Connection error. Is the backend server running?");
        } finally {
            setSubmittingGame(false);
        }
    };

    // Cancel dynamic hosted activity
    const handleCancelHostedGame = async (gameId) => {
        if (!confirm("Are you sure you want to cancel this hosted game?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/games/${gameId}?host_id=${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchHostedGames();
                await fetchPublicGames();
            } else {
                alert("Failed to cancel game.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Filter discovery search list
    const filteredVenues = venues.filter((venue) => {
        const matchesSearch =
            venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesSport = true;
        if (selectedSport && selectedSport !== "all") {
            matchesSport =
                venue.sports_supported && venue.sports_supported.toLowerCase().includes(selectedSport.toLowerCase());
        }
        return matchesSearch && matchesSport;
    });

    const sportsList = ["football", "basketball", "tennis", "swimming"];

    // 20 Sports definition with distinct icons
    const twentySports = [
        { name: "Cricket", emoji: "🏏", color: "#f59e0b" },
        { name: "Football", emoji: "⚽", color: "#3b82f6" },
        { name: "Badminton", emoji: "🏸", color: "#ec4899" },
        { name: "Basketball", emoji: "🏀", color: "#f97316" },
        { name: "Tennis", emoji: "🎾", color: "#84cc16" },
        { name: "Swimming", emoji: "🏊", color: "#06b6d4" },
        { name: "Volleyball", emoji: "🏐", color: "#eab308" },
        { name: "Table Tennis", emoji: "🏓", color: "#ef4444" },
        { name: "Squash", emoji: "🥎", color: "#a855f7" },
        { name: "Rugby", emoji: "🏉", color: "#6366f1" },
        { name: "Hockey", emoji: "🏑", color: "#14b8a6" },
        { name: "Baseball", emoji: "⚾", color: "#eab308" },
        { name: "Golf", emoji: "⛳", color: "#22c55e" },
        { name: "Athletics", emoji: "🏃", color: "#f43f5e" },
        { name: "Boxing", emoji: "🥊", color: "#dc2626" },
        { name: "Wrestling", emoji: "🤼", color: "#8b5cf6" },
        { name: "Karate", emoji: "🥋", color: "#f43f5e" },
        { name: "Archery", emoji: "🏹", color: "#00f0ff" },
        { name: "Cycling", emoji: "🚴", color: "#06b6d4" },
        { name: "Fencing", emoji: "🤺", color: "#cbd5e1" },
    ];

    const mockTrainers = [
        { name: "Rahul Sharma", sport: "Cricket Coach", exp: "8 Yrs" },
        { name: "Priya Patel", sport: "Badminton Pro", exp: "5 Yrs" },
        { name: "David Miller", sport: "Football Instructor", exp: "10 Yrs" },
    ];

    const mockTeams = [
        { name: "Strikers FC", sport: "Football", members: "18/22" },
        { name: "Spin Wizards", sport: "Table Tennis", members: "4/6" },
        { name: "Court Kings", sport: "Basketball", members: "12/15" },
    ];

    // Get sport emoji mapping helper
    const getSportEmoji = (sportName) => {
        const found = twentySports.find((s) => s.name.toLowerCase() === sportName.toLowerCase());
        return found ? found.emoji : "🏆";
    };

    return (
        <div style={styles.dashboardContainer}>
            {/* Topbar: Same as Landing Page Header Style */}
            <header style={styles.topbar}>
                {/* Left logo */}
                <div style={styles.logoArea}>
                    <strong style={styles.logo}>Mukijo</strong>
                </div>

                {/* Center: 5 Navigation Tabs (Home, Game, Book, My Bookings, Training) */}
                <div style={styles.headerTabs}>
                    <button
                        onClick={() => setActiveTab("home")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "home" ? "#bffe00" : "rgba(241, 245, 249, 0.6)",
                            borderBottomColor: activeTab === "home" ? "#bffe00" : "transparent",
                        }}
                    >
                        <HomeIcon size={16} />
                        <span>Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("game")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "game" ? "#bffe00" : "rgba(241, 245, 249, 0.6)",
                            borderBottomColor: activeTab === "game" ? "#bffe00" : "transparent",
                        }}
                    >
                        <Trophy size={16} />
                        <span>Game</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("booking")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "booking" ? "#bffe00" : "rgba(241, 245, 249, 0.6)",
                            borderBottomColor: activeTab === "booking" ? "#bffe00" : "transparent",
                        }}
                    >
                        <Calendar size={16} />
                        <span>Book</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("my-bookings")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "my-bookings" ? "#bffe00" : "rgba(241, 245, 249, 0.6)",
                            borderBottomColor: activeTab === "my-bookings" ? "#bffe00" : "transparent",
                        }}
                    >
                        <CalendarCheck size={16} />
                        <span>My Bookings</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("training")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "training" ? "#bffe00" : "rgba(241, 245, 249, 0.6)",
                            borderBottomColor: activeTab === "training" ? "#bffe00" : "transparent",
                        }}
                    >
                        <Award size={16} />
                        <span>Training</span>
                    </button>
                </div>

                {/* Right: User Profile & Log Out Dropdown */}
                <div style={{ ...styles.userNav, position: "relative" }}>
                    <div
                        style={{ ...styles.userInfoClickable, cursor: "pointer" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen((prev) => !prev);
                        }}
                    >
                        <div style={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
                        <div style={styles.userDetails}>
                            <span style={styles.userName}>{userName}</span>
                            <span style={styles.userEmail}>{userEmail}</span>
                        </div>
                    </div>
                    {dropdownOpen && (
                        <div
                            style={{
                                position: "absolute",
                                top: "120%",
                                right: 0,
                                backgroundColor: "#0f0f1a",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                padding: "6px",
                                minWidth: "140px",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                                zIndex: 1000,
                            }}
                        >
                            <button
                                className="user-logout-btn"
                                onClick={handleLogout}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#ffffff",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    borderRadius: "4px",
                                    transition: "background 0.2s",
                                }}
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main style={styles.mainContent}>
                {activeTab === "home" && (
                    /* Home Tab: Medium Search, Games & Sports with 20 Sports, Trainers Box, Join Team */
                    <div style={styles.homeContainer}>
                        {/* Medium Search Bar */}
                        <div style={styles.homeSearchSection}>
                            <div style={styles.homeSearchWrapper}>
                                <Search style={styles.homeSearchIcon} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search sports, trainers, or teams..."
                                    style={styles.homeSearchInput}
                                />
                            </div>
                        </div>

                        {/* Games and Sports Card (20 sports grid) */}
                        <div style={styles.sportsCardContainer}>
                            <h3 style={styles.homeTitle}>Games & Sports</h3>
                            <div style={styles.sportsGrid20}>
                                {twentySports.map((sport, index) => {
                                    return (
                                        <div key={index} style={styles.sportItemBorderless}>
                                            <span style={{ fontSize: "32px", marginBottom: "8px", display: "block" }}>
                                                {sport.emoji}
                                            </span>
                                            <span style={styles.sportItemName}>{sport.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Trainers Box and Join Team Column Layout */}
                        <div style={styles.homeTwoColumns}>
                            {/* Trainers Box */}
                            <div style={styles.boxCard}>
                                <div style={styles.boxHeader}>
                                    <UserCheck size={20} style={{ color: "#00f0ff" }} />
                                    <h3 style={styles.boxTitle}>Certified Trainers</h3>
                                </div>
                                <div style={styles.trainersList}>
                                    {mockTrainers.map((trainer, idx) => (
                                        <div key={idx} style={styles.trainerItem}>
                                            <div style={styles.trainerAvatar}>{trainer.name.charAt(0)}</div>
                                            <div style={styles.trainerInfo}>
                                                <span style={styles.trainerName}>{trainer.name}</span>
                                                <span style={styles.trainerSport}>
                                                    {trainer.sport} • {trainer.exp} Exp
                                                </span>
                                            </div>
                                            <button style={styles.trainerBtn}>Book Session</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Join Team Box */}
                            <div style={styles.boxCard}>
                                <div style={styles.boxHeader}>
                                    <Users size={20} style={{ color: "#bffe00" }} />
                                    <h3 style={styles.boxTitle}>Teams Near You</h3>
                                </div>
                                <div style={styles.teamsList}>
                                    {mockTeams.map((team, idx) => (
                                        <div key={idx} style={styles.teamItem}>
                                            <div style={styles.teamAvatar}>
                                                {team.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={styles.teamInfo}>
                                                <span style={styles.teamName}>{team.name}</span>
                                                <span style={styles.teamSport}>
                                                    {team.sport} • {team.members} players
                                                </span>
                                            </div>
                                            <button style={styles.teamJoinBtn}>Join Team</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "booking" && (
                    /* Booking: Venue Discovery & Booking Module */
                    <div>
                        <section style={styles.filterSection}>
                            <div style={styles.searchWrapper}>
                                <Search style={styles.searchIcon} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search sports arenas, stadiums, fields..."
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
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

                        {/* Venue Cards Grid */}
                        {loadingVenues ? (
                            <div style={styles.loadingContainer}>
                                <Loader2 className="animate-spin" size={32} style={{ color: "#bffe00" }} />
                                <p style={{ marginTop: "16px", color: "rgba(148, 163, 184, 0.6)" }}>
                                    Searching sports arenas nearby...
                                </p>
                            </div>
                        ) : filteredVenues.length === 0 ? (
                            <div style={styles.emptyContainer}>
                                <Compass
                                    size={48}
                                    style={{ color: "rgba(148, 163, 184, 0.2)", marginBottom: "16px" }}
                                />
                                <h3>No arenas found</h3>
                                <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "14px", marginTop: "8px" }}>
                                    Try adjusting your search criteria.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.grid}>
                                {filteredVenues.map((venue) => (
                                    <div key={venue.id} style={styles.card}>
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
                                                    <MapPin size={12} style={{ color: "#00f0ff" }} />
                                                    <span>{venue.distance} km</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={styles.cardBody}>
                                            <h3 style={styles.cardName}>{venue.name}</h3>
                                            <div style={styles.cardLoc}>
                                                <MapPin size={12} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                <span>{venue.location}</span>
                                            </div>

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

                                            <div style={styles.cardFooter}>
                                                <div style={styles.priceSec}>
                                                    <span style={styles.priceVal}>
                                                        ₹{venue.base_price_per_hour || 800}
                                                    </span>
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
                )}

                {activeTab === "game" && (
                    /* Game Tab: sub-tabs for Hosting form and Joined Matches list */
                    <div style={styles.bookingsSection}>
                        <div style={styles.gameSubNav}>
                            <button
                                onClick={() => setGameSubTab("host")}
                                style={{
                                    ...styles.gameSubNavBtn,
                                    backgroundColor: gameSubTab === "host" ? "rgba(191, 254, 0, 0.1)" : "transparent",
                                    color: gameSubTab === "host" ? "#bffe00" : "rgba(241, 245, 249, 0.7)",
                                    borderColor: gameSubTab === "host" ? "#bffe00" : "rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                <PlusCircle size={14} />
                                <span>Host a Game</span>
                            </button>

                            <button
                                onClick={() => setGameSubTab("joined")}
                                style={{
                                    ...styles.gameSubNavBtn,
                                    backgroundColor: gameSubTab === "joined" ? "rgba(191, 254, 0, 0.1)" : "transparent",
                                    color: gameSubTab === "joined" ? "#bffe00" : "rgba(241, 245, 249, 0.7)",
                                    borderColor: gameSubTab === "joined" ? "#bffe00" : "rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                <Users size={14} />
                                <span>Hosted Matches</span>
                            </button>

                            <button
                                onClick={() => setGameSubTab("explore")}
                                style={{
                                    ...styles.gameSubNavBtn,
                                    backgroundColor:
                                        gameSubTab === "explore" ? "rgba(191, 254, 0, 0.1)" : "transparent",
                                    color: gameSubTab === "explore" ? "#bffe00" : "rgba(241, 245, 249, 0.7)",
                                    borderColor: gameSubTab === "explore" ? "#bffe00" : "rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                <Compass size={14} />
                                <span>Join Games</span>
                            </button>
                        </div>

                        {gameSubTab === "host" && (
                            /* Host a Game Form (Create Game Match) */
                            <div style={styles.boxCard}>
                                <div style={styles.boxHeader}>
                                    <PlusCircle size={20} style={{ color: "#bffe00" }} />
                                    <h3 style={styles.boxTitle}>Host a Sports Match</h3>
                                </div>

                                {gameSuccess ? (
                                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                                        <div
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "50%",
                                                background: "rgba(191, 254, 0, 0.1)",
                                                color: "#bffe00",
                                                fontSize: "20px",
                                                fontWeight: "bold",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 16px auto",
                                                border: "1px solid #bffe00",
                                            }}
                                        >
                                            ✓
                                        </div>
                                        <h3 style={{ color: "#ffffff" }}>Match Created Successfully!</h3>
                                        <p
                                            style={{
                                                color: "rgba(148, 163, 184, 0.6)",
                                                fontSize: "13px",
                                                marginTop: "8px",
                                            }}
                                        >
                                            Hosting lobby created. Redirecting to your hosted matches...
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleHostGameSubmit} style={styles.gameForm}>
                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Select Sport</label>
                                                <select
                                                    value={gameSport}
                                                    onChange={(e) => setGameSport(e.target.value)}
                                                    style={styles.formSelect}
                                                >
                                                    <option value="badminton">🏸 Badminton</option>
                                                    <option value="cricket">🏏 Cricket</option>
                                                    <option value="football">⚽ Football</option>
                                                    <option value="basketball">🏀 Basketball</option>
                                                    <option value="tennis">🎾 Tennis</option>
                                                    <option value="swimming">🏊 Swimming</option>
                                                    <option value="volleyball">🏐 Volleyball</option>
                                                </select>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Skill Level Required</label>
                                                <select
                                                    value={gameSkillLevel}
                                                    onChange={(e) => setGameSkillLevel(e.target.value)}
                                                    style={styles.formSelect}
                                                >
                                                    <option value="All">All Skill Levels</option>
                                                    <option value="Beginner">Beginner</option>
                                                    <option value="Intermediate">Intermediate</option>
                                                    <option value="Advanced">Advanced</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Match Date</label>
                                                <input
                                                    type="date"
                                                    value={gameDate}
                                                    onChange={(e) => setGameDate(e.target.value)}
                                                    style={styles.formInput}
                                                    required
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Start Time</label>
                                                <input
                                                    type="time"
                                                    value={gameTime}
                                                    onChange={(e) => setGameTime(e.target.value)}
                                                    style={styles.formInput}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Ground / Location / Venue Name</label>
                                                <input
                                                    type="text"
                                                    value={gameLocation}
                                                    onChange={(e) => setGameLocation(e.target.value)}
                                                    placeholder="e.g. Mukijo Sports Arena, Gachibowli"
                                                    style={styles.formInput}
                                                    required
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Max Players Wanted</label>
                                                <input
                                                    type="number"
                                                    value={gameMaxPlayers}
                                                    onChange={(e) => setGameMaxPlayers(e.target.value)}
                                                    min="2"
                                                    max="50"
                                                    style={styles.formInput}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div style={styles.formRow}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.formLabel}>Match Privacy Settings</label>
                                                <div style={styles.tabToggleContainer}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGamePrivacy("public")}
                                                        style={{
                                                            ...styles.toggleTabBtn,
                                                            backgroundColor:
                                                                gamePrivacy === "public" ? "#bffe00" : "transparent",
                                                            color:
                                                                gamePrivacy === "public"
                                                                    ? "#050508"
                                                                    : "rgba(241, 245, 249, 0.6)",
                                                        }}
                                                    >
                                                        🌍 Public Match
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGamePrivacy("private")}
                                                        style={{
                                                            ...styles.toggleTabBtn,
                                                            backgroundColor:
                                                                gamePrivacy === "private" ? "#bffe00" : "transparent",
                                                            color:
                                                                gamePrivacy === "private"
                                                                    ? "#050508"
                                                                    : "rgba(241, 245, 249, 0.6)",
                                                        }}
                                                    >
                                                        🔒 Invite-Only
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Additional Match Info / Rules</label>
                                            <textarea
                                                value={gameDescription}
                                                onChange={(e) => setGameDescription(e.target.value)}
                                                placeholder="e.g. Bring your own sports gear and rackets. We will split the court cost at the venue!"
                                                style={styles.formTextarea}
                                            />
                                        </div>

                                        <button type="submit" disabled={submittingGame} style={styles.formSubmitBtn}>
                                            {submittingGame ? "Hosting Match..." : "Host Match"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {gameSubTab === "joined" && (
                            /* List of Hosted & Joined game activities */
                            <div>
                                <h2 style={styles.sectionTitle}>My Hosted & Joined Matches</h2>
                                {loadingHostedGames ? (
                                    <div style={styles.loadingContainer}>
                                        <Loader2 className="animate-spin" size={32} style={{ color: "#bffe00" }} />
                                        <p style={{ marginTop: "16px" }}>Fetching hosted matches...</p>
                                    </div>
                                ) : hostedGames.length === 0 ? (
                                    <div style={styles.emptyContainer}>
                                        <Play
                                            size={48}
                                            style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }}
                                        />
                                        <h3>No active matches</h3>
                                        <p
                                            style={{
                                                color: "rgba(148, 163, 184, 0.4)",
                                                fontSize: "14px",
                                                marginTop: "8px",
                                            }}
                                        >
                                            You are not hosting or participating in any match lobbies.
                                        </p>
                                        <button onClick={() => setGameSubTab("host")} style={styles.exploreLinkBtn}>
                                            Host a new match now
                                        </button>
                                    </div>
                                ) : (
                                    <div style={styles.miniGameGrid}>
                                        {hostedGames.map((act) => {
                                            const isOwner = act.owner_id === Number(userId);
                                            return (
                                                <div key={act.id} style={styles.miniGameCard}>
                                                    <div style={styles.cardHeaderMini}>
                                                        <div style={styles.sportHeader}>
                                                            <span style={{ fontSize: "20px" }}>
                                                                {getSportEmoji(act.sport)}
                                                            </span>
                                                            <span style={{ ...styles.sportLabel, marginLeft: "8px" }}>
                                                                {act.sport.toUpperCase()} MATCH
                                                            </span>
                                                            {isOwner && (
                                                                <span
                                                                    style={{
                                                                        ...styles.badge,
                                                                        backgroundColor: "rgba(0, 240, 255, 0.1)",
                                                                        color: "#00f0ff",
                                                                        borderColor: "rgba(0, 240, 255, 0.2)",
                                                                        marginLeft: "10px",
                                                                    }}
                                                                >
                                                                    HOST
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                ...styles.badge,
                                                                backgroundColor:
                                                                    act.status === "cancelled"
                                                                        ? "rgba(239, 68, 68, 0.1)"
                                                                        : "rgba(16, 185, 129, 0.1)",
                                                                color:
                                                                    act.status === "cancelled" ? "#f87171" : "#34d399",
                                                                borderColor:
                                                                    act.status === "cancelled"
                                                                        ? "rgba(239, 68, 68, 0.2)"
                                                                        : "rgba(16, 185, 129, 0.2)",
                                                            }}
                                                        >
                                                            {act.status.toUpperCase()}
                                                        </div>
                                                    </div>

                                                    <div style={styles.cardDetailsMini}>
                                                        <div style={styles.detailItem}>
                                                            <Calendar
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>
                                                                {act.date} • {act.time}
                                                            </span>
                                                        </div>
                                                        <div style={styles.detailItem}>
                                                            <MapPin
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>{act.location}</span>
                                                        </div>
                                                        <div style={styles.detailItem}>
                                                            <Users
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>
                                                                Players:{" "}
                                                                <strong>
                                                                    {act.rsvps ? act.rsvps.length : 1} /{" "}
                                                                    {act.max_players}
                                                                </strong>{" "}
                                                                ({act.skill_level} Level •{" "}
                                                                {act.privacy_type === "private"
                                                                    ? "Invite-Only 🔒"
                                                                    : "Public 🌍"}
                                                                )
                                                            </span>
                                                        </div>
                                                        {act.description && (
                                                            <p
                                                                style={{
                                                                    fontSize: "13px",
                                                                    color: "rgba(241, 245, 249, 0.6)",
                                                                    fontStyle: "italic",
                                                                    marginTop: "6px",
                                                                }}
                                                            >
                                                                Notes: &quot;{act.description}&quot;
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isOwner && act.status !== "cancelled" && (
                                                        <div style={styles.cardFooterMini}>
                                                            <span
                                                                style={{
                                                                    fontSize: "11px",
                                                                    color: "rgba(148, 163, 184, 0.4)",
                                                                }}
                                                            >
                                                                Host Controls
                                                            </span>
                                                            <button
                                                                onClick={() => handleCancelHostedGame(act.id)}
                                                                style={styles.cancelBtn}
                                                            >
                                                                Cancel Game Match
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {gameSubTab === "explore" && (
                            /* Join Games Discovery feed */
                            <div>
                                <h2 style={styles.sectionTitle}>Explore Open Game Lobbies</h2>
                                {loadingPublicGames ? (
                                    <div style={styles.loadingContainer}>
                                        <Loader2 className="animate-spin" size={32} style={{ color: "#bffe00" }} />
                                        <p style={{ marginTop: "16px" }}>Searching for matches near you...</p>
                                    </div>
                                ) : publicGames.length === 0 ? (
                                    <div style={styles.emptyContainer}>
                                        <Compass
                                            size={48}
                                            style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }}
                                        />
                                        <h3>No matches found</h3>
                                        <p
                                            style={{
                                                color: "rgba(148, 163, 184, 0.4)",
                                                fontSize: "14px",
                                                marginTop: "8px",
                                            }}
                                        >
                                            There are no public game lobbies hosted by other players right now.
                                        </p>
                                        <button onClick={() => setGameSubTab("host")} style={styles.exploreLinkBtn}>
                                            Be the first to host a match
                                        </button>
                                    </div>
                                ) : (
                                    <div style={styles.miniGameGrid}>
                                        {publicGames.map((game) => {
                                            const formattedDate = new Date(game.slot_start).toLocaleDateString(
                                                undefined,
                                                {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                }
                                            );
                                            const formattedTime = new Date(game.slot_start).toLocaleTimeString(
                                                undefined,
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            );
                                            const spotsLeft = game.total_spots - game.current_players;
                                            const isFull = spotsLeft <= 0;

                                            return (
                                                <div key={game.id} style={styles.miniGameCard}>
                                                    <div style={styles.cardHeaderMini}>
                                                        <div style={styles.sportHeader}>
                                                            <span style={{ fontSize: "20px" }}>
                                                                {getSportEmoji(game.sport)}
                                                            </span>
                                                            <span style={{ ...styles.sportLabel, marginLeft: "8px" }}>
                                                                {game.sport.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span
                                                            style={{
                                                                ...styles.badge,
                                                                backgroundColor: isFull
                                                                    ? "rgba(239, 68, 68, 0.1)"
                                                                    : "rgba(191, 254, 0, 0.1)",
                                                                color: isFull ? "#f87171" : "#bffe00",
                                                                borderColor: isFull
                                                                    ? "rgba(239, 68, 68, 0.2)"
                                                                    : "rgba(191, 254, 0, 0.2)",
                                                            }}
                                                        >
                                                            {isFull ? "FULL" : "JOINABLE"}
                                                        </span>
                                                    </div>

                                                    <div style={styles.cardDetailsMini}>
                                                        <div style={styles.detailItem}>
                                                            <Calendar
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>
                                                                {formattedDate} at {formattedTime}
                                                            </span>
                                                        </div>
                                                        <div style={styles.detailItem}>
                                                            <Trophy
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>
                                                                Split Cost:{" "}
                                                                <strong style={{ color: "#bffe00" }}>
                                                                    ₹{game.price_per_player}
                                                                </strong>{" "}
                                                                per player
                                                            </span>
                                                        </div>
                                                        <div style={styles.detailItem}>
                                                            <Users
                                                                size={14}
                                                                style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                            />
                                                            <span>
                                                                Spots:{" "}
                                                                <strong>
                                                                    {game.current_players} / {game.total_spots}
                                                                </strong>
                                                            </span>
                                                        </div>

                                                        {/* Player progress-bar indicator */}
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                height: "4px",
                                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                                borderRadius: "2px",
                                                                overflow: "hidden",
                                                                margin: "12px 0 6px 0",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(game.current_players / game.total_spots) * 100}%`,
                                                                    height: "100%",
                                                                    backgroundColor: isFull ? "#f87171" : "#bffe00",
                                                                    transition: "width 0.4s ease",
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: "11px",
                                                                color: "rgba(148, 163, 184, 0.4)",
                                                            }}
                                                        >
                                                            {isFull
                                                                ? "Lobby is full. Join waitlist to get auto-promoted on cancellations."
                                                                : `Only ${spotsLeft} spots remaining.`}
                                                        </span>
                                                    </div>

                                                    <div style={styles.cardFooterMini}>
                                                        <span
                                                            style={{
                                                                fontSize: "11px",
                                                                color: "rgba(148, 163, 184, 0.4)",
                                                            }}
                                                        >
                                                            {game.join_policy === "instant"
                                                                ? "Instant Join ⚡"
                                                                : "Requires Host Approval ⏳"}
                                                        </span>
                                                        {isFull ? (
                                                            <button
                                                                onClick={() => handleJoinWaitlist(game.id)}
                                                                style={{
                                                                    ...styles.exploreLinkBtn,
                                                                    padding: "6px 12px",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                Join Waitlist
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleJoinGame(game.id)}
                                                                disabled={joiningGameId === game.id}
                                                                style={{
                                                                    ...styles.cancelBtn,
                                                                    backgroundColor: "#bffe00",
                                                                    color: "#0f172a",
                                                                    fontWeight: "bold",
                                                                    borderColor: "transparent",
                                                                }}
                                                            >
                                                                {joiningGameId === game.id
                                                                    ? "Processing..."
                                                                    : "Join Match"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "my-bookings" && (
                    /* My Bookings Tab: Display all court/venue reservations booked by the user */
                    <div style={styles.bookingsSection}>
                        <h2 style={styles.sectionTitle}>My Venue Bookings</h2>
                        {loadingBookings ? (
                            <div style={styles.loadingContainer}>
                                <Loader2 className="animate-spin" size={32} style={{ color: "#bffe00" }} />
                                <p style={{ marginTop: "16px" }}>Fetching your venue bookings...</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div style={styles.emptyContainer}>
                                <CalendarCheck
                                    size={48}
                                    style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }}
                                />
                                <h3>No venue bookings found</h3>
                                <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px", marginTop: "8px" }}>
                                    You have no active sports arena bookings.
                                </p>
                                <button onClick={() => setActiveTab("booking")} style={styles.exploreLinkBtn}>
                                    Book a sports arena slot
                                </button>
                            </div>
                        ) : (
                            <div style={styles.list}>
                                {bookings.map((booking) => {
                                    const date =
                                        booking.slots && booking.slots.length > 0
                                            ? new Date(booking.slots[0].start_time).toLocaleDateString("en-US", {
                                                  weekday: "long",
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                              })
                                            : "Unknown Date";

                                    const isCancelled = booking.status === "cancelled";
                                    const isPaid = booking.payment_status === "paid" || booking.status === "confirmed";

                                    return (
                                        <div key={booking.id} style={styles.bookingCard}>
                                            <div style={styles.cardHeader}>
                                                <div style={styles.sportHeader}>
                                                    <span style={{ fontSize: "20px" }}>
                                                        {booking.slots && booking.slots.length > 0
                                                            ? getSportEmoji(booking.slots[0].sport)
                                                            : "🏆"}
                                                    </span>
                                                    <span style={{ ...styles.sportLabel, marginLeft: "8px" }}>
                                                        {booking.slots && booking.slots.length > 0
                                                            ? booking.slots[0].sport.toUpperCase()
                                                            : "SPORTS"}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        ...styles.badge,
                                                        backgroundColor: isCancelled
                                                            ? "rgba(239, 68, 68, 0.1)"
                                                            : isPaid
                                                              ? "rgba(16, 185, 129, 0.1)"
                                                              : "rgba(234, 179, 8, 0.1)",
                                                        color: isCancelled ? "#f87171" : isPaid ? "#34d399" : "#fbbf24",
                                                        borderColor: isCancelled
                                                            ? "rgba(239, 68, 68, 0.2)"
                                                            : isPaid
                                                              ? "rgba(16, 185, 129, 0.2)"
                                                              : "rgba(234, 179, 8, 0.2)",
                                                    }}
                                                >
                                                    {isCancelled
                                                        ? "CANCELLED"
                                                        : isPaid
                                                          ? "CONFIRMED"
                                                          : "HOLDING (UNPAID)"}
                                                </div>
                                            </div>

                                            <div style={styles.cardDetails}>
                                                <div style={styles.detailItem}>
                                                    <Calendar size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                    <span>{date}</span>
                                                </div>

                                                {booking.slots &&
                                                    booking.slots.map((slot) => {
                                                        const startStr = new Date(slot.start_time).toLocaleTimeString(
                                                            [],
                                                            { hour: "2-digit", minute: "2-digit" }
                                                        );
                                                        const endStr = new Date(slot.end_time).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        });
                                                        return (
                                                            <div key={slot.id} style={styles.detailItem}>
                                                                <Clock
                                                                    size={14}
                                                                    style={{ color: "rgba(148, 163, 184, 0.6)" }}
                                                                />
                                                                <span>
                                                                    {startStr} - {endStr} (₹{slot.current_price})
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>

                                            <div style={styles.cardFooter}>
                                                <div style={styles.metaInfo}>
                                                    <span>
                                                        Booking ID: <strong>#MK-{booking.id}</strong>
                                                    </span>
                                                    {booking.payment_id && (
                                                        <span style={{ marginLeft: "16px" }}>
                                                            Ref: <strong>{booking.payment_id}</strong>
                                                        </span>
                                                    )}
                                                </div>

                                                {!isCancelled && (
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        disabled={cancellingId === booking.id}
                                                        style={styles.cancelBtn}
                                                    >
                                                        {cancellingId === booking.id
                                                            ? "Cancelling..."
                                                            : "Cancel Reservation"}
                                                    </button>
                                                )}

                                                {isCancelled && booking.cancellation_reason && (
                                                    <div style={styles.cancellationText}>
                                                        Reason: {booking.cancellation_reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "training" && (
                    /* Training: coaching sessions & workshops */
                    <div style={styles.bookingsSection}>
                        <h2 style={styles.sectionTitle}>My Training Programs</h2>
                        <div style={styles.emptyContainer}>
                            <Award size={48} style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }} />
                            <h3>No Active Training Enrolments</h3>
                            <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px", marginTop: "8px" }}>
                                You are not enrolled in any coaching academies or workshops at the moment.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const styles = {
    dashboardContainer: {
        minHeight: "100vh",
        backgroundColor: "#08080f",
        color: "#f1f5f9",
        fontFamily: "'Outfit', sans-serif",
    },
    topbar: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: "#000000",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        zIndex: 1000,
        boxSizing: "border-box",
    },
    logoArea: {
        display: "flex",
        alignItems: "center",
    },
    logo: {
        fontSize: "26px",
        fontWeight: "900",
        fontStyle: "italic",
        textTransform: "uppercase",
        letterSpacing: "-0.5px",
        color: "#ffffff",
    },
    headerTabs: {
        display: "flex",
        gap: "30px",
        alignItems: "center",
        height: "100%",
    },
    headerTabBtn: {
        background: "transparent",
        border: "none",
        borderBottom: "3px solid transparent",
        padding: "24px 8px 21px 8px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        height: "100%",
        boxSizing: "border-box",
    },
    userNav: {
        display: "flex",
        alignItems: "center",
    },
    userInfoClickable: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: "8px",
        transition: "background 0.2s ease",
    },
    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
    },
    userDetails: {
        display: "flex",
        flexDirection: "column",
    },
    userName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#f1f5f9",
    },
    userEmail: {
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.5)",
    },
    mainContent: {
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "112px 40px 40px 40px",
    },
    homeContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "40px",
    },
    homeSearchSection: {
        display: "flex",
        justifyContent: "center",
        width: "100%",
    },
    homeSearchWrapper: {
        position: "relative",
        width: "100%",
        maxWidth: "600px",
    },
    homeSearchIcon: {
        position: "absolute",
        left: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "rgba(148, 163, 184, 0.5)",
    },
    homeSearchInput: {
        width: "100%",
        padding: "14px 16px 14px 48px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        fontSize: "15px",
        color: "#f1f5f9",
        outline: "none",
        transition: "all 0.25s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    sportsCardContainer: {
        background: "rgba(15, 15, 26, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
    homeTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f1f5f9",
        marginBottom: "24px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #bffe00",
        paddingLeft: "10px",
    },
    sportsGrid20: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: "20px",
    },
    sportItemBorderless: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 8px",
        cursor: "pointer",
        transition: "transform 0.2s ease",
    },
    sportItemName: {
        fontSize: "15px",
        fontWeight: "500",
        color: "rgba(241, 245, 249, 0.9)",
        textAlign: "center",
    },
    homeTwoColumns: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "30px",
    },
    boxCard: {
        background: "rgba(15, 15, 26, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
    boxHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        paddingBottom: "12px",
    },
    boxTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
    },
    trainersList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    trainerItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.04)",
    },
    trainerAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "rgba(0, 240, 255, 0.1)",
        color: "#00f0ff",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
    },
    trainerInfo: {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
    },
    trainerName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#ffffff",
    },
    trainerSport: {
        fontSize: "12px",
        color: "rgba(148, 163, 184, 0.5)",
    },
    trainerBtn: {
        background: "rgba(0, 240, 255, 0.1)",
        border: "1px solid rgba(0, 240, 255, 0.2)",
        color: "#00f0ff",
        padding: "6px 14px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    teamsList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    teamItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.04)",
    },
    teamAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        background: "rgba(191, 254, 0, 0.1)",
        color: "#bffe00",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
    },
    teamInfo: {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
    },
    teamName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#ffffff",
    },
    teamSport: {
        fontSize: "12px",
        color: "rgba(148, 163, 184, 0.5)",
    },
    teamJoinBtn: {
        background: "rgba(191, 254, 0, 0.1)",
        border: "1px solid rgba(191, 254, 0, 0.2)",
        color: "#bffe00",
        padding: "6px 14px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    filterSection: {
        background: "linear-gradient(135deg, rgba(15, 15, 26, 0.9) 0%, rgba(20, 20, 35, 0.7) 100%)",
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
        color: "#f1f5f9",
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
        fontFamily: "'Outfit', sans-serif",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
    },
    emptyContainer: {
        textAlign: "center",
        padding: "80px 0",
    },
    exploreLinkBtn: {
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
        border: "none",
        padding: "10px 24px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        cursor: "pointer",
        marginTop: "16px",
        transform: "skewX(-6deg)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))",
        gap: "24px",
    },
    card: {
        background: "rgba(15, 15, 26, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
    cardImageWrapper: {
        position: "relative",
        height: "155px",
        overflow: "hidden",
        backgroundColor: "#0d0d16",
    },
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    ratingBadge: {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(15, 15, 26, 0.8)",
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
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
    },
    cardName: {
        fontSize: "16px",
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
        marginBottom: "12px",
    },
    cardSports: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginBottom: "15px",
    },
    cardSportChip: {
        fontSize: "10px",
        fontWeight: "700",
        color: "#00f0ff",
        background: "rgba(0, 240, 255, 0.06)",
        padding: "3px 8px",
        borderRadius: "4px",
        border: "1px solid rgba(0, 240, 255, 0.12)",
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
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
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
        boxShadow: "0 4px 12px rgba(191, 254, 0, 0.25)",
    },
    bookingsSection: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f1f5f9",
        marginBottom: "20px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #bffe00",
        paddingLeft: "10px",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    bookingCard: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "14px",
        padding: "24px",
    },
    miniGameGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
    },
    miniGameCard: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    cardHeaderMini: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    },
    cardDetailsMini: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "12px",
    },
    cardFooterMini: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "8px",
        paddingTop: "8px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px",
        paddingBottom: "12px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    },
    sportHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    sportLabel: {
        fontSize: "14px",
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: "0.03em",
    },
    badge: {
        border: "1px solid",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.02em",
    },
    cardDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
    },
    detailItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px",
        color: "rgba(241, 245, 249, 0.8)",
    },
    metaInfo: {
        fontSize: "12px",
        color: "rgba(148, 163, 184, 0.4)",
    },
    cancelBtn: {
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#f87171",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    cancellationText: {
        fontSize: "12px",
        color: "#f87171",
        fontStyle: "italic",
    },

    // --- GAME SUB-NAV STYLES ---
    gameSubNav: {
        display: "flex",
        gap: "16px",
        marginBottom: "32px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        paddingBottom: "16px",
    },
    gameSubNavBtn: {
        background: "transparent",
        border: "1px solid",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.25s ease",
        fontFamily: "'Outfit', sans-serif",
    },

    // --- HOST GAME FORM STYLES ---
    gameForm: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginTop: "10px",
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexGrow: 1,
    },
    formLabel: {
        fontSize: "13px",
        fontWeight: "700",
        color: "rgba(241, 245, 249, 0.7)",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
    },
    formInput: {
        background: "rgba(255, 255, 255, 0.04)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#ffffff",
        outline: "none",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    formSelect: {
        background: "rgba(15, 15, 26, 0.9)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#ffffff",
        outline: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    tabToggleContainer: {
        display: "flex",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "4px",
        width: "fit-content",
        gap: "4px",
    },
    toggleTabBtn: {
        padding: "10px 20px",
        border: "none",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        fontFamily: "'Outfit', sans-serif",
        transition: "all 0.2s ease",
    },
    formTextarea: {
        background: "rgba(255, 255, 255, 0.04)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#ffffff",
        outline: "none",
        minHeight: "100px",
        resize: "vertical",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    formSubmitBtn: {
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
        border: "none",
        padding: "14px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: "skewX(-6deg)",
        boxShadow: "0 4px 16px rgba(191, 254, 0, 0.25)",
        marginTop: "10px",
        width: "fit-content",
        alignSelf: "flex-start",
    },
    distanceBadge: {
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(15, 15, 26, 0.8)",
        backdropFilter: "blur(4px)",
        borderRadius: "8px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#00f0ff",
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
        color: "rgba(241, 245, 249, 0.5)",
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
        color: "#f1f5f9",
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
        background: "rgba(0, 240, 255, 0.06)",
        border: "1px solid rgba(0, 240, 255, 0.15)",
        borderRadius: "8px",
        color: "#00f0ff",
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
        color: "#f1f5f9",
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
        color: "rgba(241, 245, 249, 0.8)",
        cursor: "pointer",
        userSelect: "none",
    },
    toggleCheckbox: {
        width: "16px",
        height: "16px",
        accentColor: "#bffe00",
        cursor: "pointer",
    },
};
