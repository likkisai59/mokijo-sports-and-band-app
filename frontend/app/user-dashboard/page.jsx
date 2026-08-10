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
    Phone,
} from "lucide-react";
import NotificationBell from "../../components/dashboard/NotificationBell";

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

    // Trainer trainings (Discover + My Training tabs)
    const [trainerTrainings, setTrainerTrainings] = useState([]);
    const [loadingTrainings, setLoadingTrainings] = useState(false);
    const [myTrainings, setMyTrainings] = useState([]);
    const [loadingMyTrainings, setLoadingMyTrainings] = useState(false);

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
        const storedUserId = localStorage.getItem("userId");
        const storedName = localStorage.getItem("userName");
        const storedEmail = localStorage.getItem("userEmail");

        if (!storedUserId) {
            router.push("/login-user");
            return;
        }

        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);
    }, [router]);

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

    const fetchTrainerTrainings = async () => {
        setLoadingTrainings(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/courses/trainer-trainings`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setTrainerTrainings(Array.isArray(data) ? data : []);
            } else {
                setTrainerTrainings([]);
            }
        } catch (err) {
            console.error("Error loading trainings:", err);
            setTrainerTrainings([]);
        } finally {
            setLoadingTrainings(false);
        }
    };

    const fetchMyTrainings = async () => {
        if (!userId) return;
        setLoadingMyTrainings(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/users/${userId}/training-registrations`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setMyTrainings(Array.isArray(data) ? data : []);
            } else {
                setMyTrainings([]);
            }
        } catch (err) {
            console.error("Error loading my trainings:", err);
            setMyTrainings([]);
        } finally {
            setLoadingMyTrainings(false);
        }
    };

    const handleJoinGame = async (gameId) => {
        if (!userId) return;
        setJoiningGameId(gameId);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            const res = await fetch(`${API_BASE_URL}/games/${gameId}/join?user_id=${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
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
        if (activeTab === "home") {
            fetchBookings();
            fetchHostedGames();
        } else if (activeTab === "my-trainings") {
            fetchMyTrainings();
        } else if (activeTab === "my-bookings") {
            fetchBookings();
        } else if (activeTab === "game") {
            if (gameSubTab === "joined") {
                fetchHostedGames();
            } else if (gameSubTab === "explore") {
                fetchPublicGames();
            }
        } else if (activeTab === "training") {
            fetchTrainerTrainings();
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
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: "POST",
                headers,
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
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            const res = await fetch(`${API_BASE_URL}/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
                const detail = errData.detail;
                const message = Array.isArray(detail)
                    ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
                    : typeof detail === "string"
                        ? detail
                        : "Failed to host game match.";
                alert(message);
            }
        } catch (err) {
            console.error("Error hosting game:", err);
            alert(err?.message || "Connection error. Is the backend server running?");
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
        { name: "Football", emoji: "⚽", color: "#c6ff3d" },
        { name: "Badminton", emoji: "🏸", color: "#ff2e93" },
        { name: "Basketball", emoji: "🏀", color: "#f97316" },
        { name: "Tennis", emoji: "🎾", color: "#84cc16" },
        { name: "Swimming", emoji: "🏊", color: "#d9ff6e" },
        { name: "Volleyball", emoji: "🏐", color: "#eab308" },
        { name: "Table Tennis", emoji: "🏓", color: "#ef4444" },
        { name: "Squash", emoji: "🥎", color: "#ff2e93" },
        { name: "Rugby", emoji: "🏉", color: "#c6ff3d" },
        { name: "Hockey", emoji: "🏑", color: "#14b8a6" },
        { name: "Baseball", emoji: "⚾", color: "#eab308" },
        { name: "Golf", emoji: "⛳", color: "#22c55e" },
        { name: "Athletics", emoji: "🏃", color: "#ff2e93" },
        { name: "Boxing", emoji: "🥊", color: "#dc2626" },
        { name: "Wrestling", emoji: "🤼", color: "#c6ff3d" },
        { name: "Karate", emoji: "🥋", color: "#ff2e93" },
        { name: "Archery", emoji: "🏹", color: "#d9ff6e" },
        { name: "Cycling", emoji: "🚴", color: "#d9ff6e" },
        { name: "Fencing", emoji: "🤺", color: "#cbd5e1" },
    ];

    // Top-rated venues currently available for booking (real data, no mocks)
    const featuredVenues = venues.slice(0, 3);

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
                            color: activeTab === "home" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "home" ? "#10b981" : "transparent",
                        }}
                    >
                        <HomeIcon size={16} />
                        <span>Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("game")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "game" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "game" ? "#10b981" : "transparent",
                        }}
                    >
                        <Trophy size={16} />
                        <span>Game</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("booking")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "booking" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "booking" ? "#10b981" : "transparent",
                        }}
                    >
                        <Calendar size={16} />
                        <span>Book</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("my-trainings")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "my-trainings" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "my-trainings" ? "#10b981" : "transparent",
                        }}
                    >
                        <Award size={16} />
                        <span>My Training</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("my-bookings")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "my-bookings" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "my-bookings" ? "#10b981" : "transparent",
                        }}
                    >
                        <CalendarCheck size={16} />
                        <span>My Bookings</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("training")}
                        style={{
                            ...styles.headerTabBtn,
                            color: activeTab === "training" ? "#10b981" : "#64748b",
                            borderBottomColor: activeTab === "training" ? "#10b981" : "transparent",
                        }}
                    >
                        <Compass size={16} />
                        <span>Discover Trainings</span>
                    </button>
                </div>

                {/* Right: Notifications, User Profile & Log Out Dropdown */}
                <div style={{ ...styles.userNav, position: "relative", gap: "12px" }}>
                    <NotificationBell mode="empty" />
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
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px",
                                minWidth: "140px",
                                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.1)",
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
                                    border: "1px solid #fecaca",
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    borderRadius: "6px",
                                    fontWeight: "700",
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

                        {/* Featured Venues and Host/Join a Game Column Layout */}
                        <div style={styles.homeTwoColumns}>
                            {/* Featured Venues Box (real venues from the discovery API) */}
                            <div style={styles.boxCard}>
                                <div style={styles.boxHeader}>
                                    <UserCheck size={20} style={{ color: "#d9ff6e" }} />
                                    <h3 style={styles.boxTitle}>Featured Venues</h3>
                                </div>
                                {loadingVenues ? (
                                    <div style={{ padding: "16px 4px", color: "rgba(148,163,184,0.6)", fontSize: 13 }}>
                                        Loading venues…
                                    </div>
                                ) : featuredVenues.length === 0 ? (
                                    <div style={{ padding: "16px 4px", color: "rgba(148,163,184,0.6)", fontSize: 13 }}>
                                        No venues available yet. Check back soon!
                                    </div>
                                ) : (
                                    <div style={styles.trainersList}>
                                        {featuredVenues.map((venue) => (
                                            <div key={venue.id} style={styles.trainerItem}>
                                                <div style={styles.trainerAvatar}>{venue.name?.charAt(0) || "V"}</div>
                                                <div style={styles.trainerInfo}>
                                                    <span style={styles.trainerName}>{venue.name}</span>
                                                    <span style={styles.trainerSport}>
                                                        {venue.location} • ⭐ {venue.rating ?? "New"}
                                                    </span>
                                                </div>
                                                <button
                                                    style={styles.trainerBtn}
                                                    onClick={() => router.push(`/venues/${venue.id}`)}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Host or Join a Game Box */}
                            <div style={styles.boxCard}>
                                <div style={styles.boxHeader}>
                                    <Users size={20} style={{ color: "#10b981" }} />
                                    <h3 style={styles.boxTitle}>Host or Join a Game</h3>
                                </div>
                                <div style={{ padding: "8px 4px 4px", color: "rgba(148,163,184,0.6)", fontSize: 13 }}>
                                    Team discovery is coming soon. Meanwhile, host your own match or join an open lobby.
                                </div>
                                <button
                                    style={{ ...styles.trainerBtn, marginTop: 14 }}
                                    onClick={() => setActiveTab("game")}
                                >
                                    Go to Game Tab
                                </button>
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
                                <Loader2 className="animate-spin" size={32} style={{ color: "#10b981" }} />
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
                                                    <MapPin size={12} style={{ color: "#d9ff6e" }} />
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
                                                    <span>Book Now</span>
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
                                    backgroundColor: gameSubTab === "host" ? "#ecfdf5" : "transparent",
                                    color: gameSubTab === "host" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "host" ? "#a7f3d0" : "#cbd5e1",
                                }}
                            >
                                <PlusCircle size={14} />
                                <span>Host a Game</span>
                            </button>

                            <button
                                onClick={() => setGameSubTab("joined")}
                                style={{
                                    ...styles.gameSubNavBtn,
                                    backgroundColor: gameSubTab === "joined" ? "#ecfdf5" : "transparent",
                                    color: gameSubTab === "joined" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "joined" ? "#a7f3d0" : "#cbd5e1",
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
                                        gameSubTab === "explore" ? "#ecfdf5" : "transparent",
                                    color: gameSubTab === "explore" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "explore" ? "#a7f3d0" : "#cbd5e1",
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
                                    <PlusCircle size={20} style={{ color: "#10b981" }} />
                                    <h3 style={styles.boxTitle}>Host a Sports Match</h3>
                                </div>

                                {gameSuccess ? (
                                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                                        <div
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "50%",
                                                background: "rgba(198, 255, 61, 0.1)",
                                                color: "#10b981",
                                                fontSize: "20px",
                                                fontWeight: "bold",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 16px auto",
                                                border: "1px solid #10b981",
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
                                                                gamePrivacy === "public" ? "#10b981" : "transparent",
                                                            color:
                                                                gamePrivacy === "public"
                                                                    ? "#08080f"
                                                                    : "rgba(244, 244, 245, 0.6)",
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
                                                                gamePrivacy === "private" ? "#10b981" : "transparent",
                                                            color:
                                                                gamePrivacy === "private"
                                                                    ? "#08080f"
                                                                    : "rgba(244, 244, 245, 0.6)",
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
                                        <Loader2 className="animate-spin" size={32} style={{ color: "#10b981" }} />
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
                                                                        backgroundColor: "rgba(217, 255, 110, 0.1)",
                                                                        color: "#d9ff6e",
                                                                        borderColor: "rgba(217, 255, 110, 0.2)",
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
                                                                    color: "rgba(244, 244, 245, 0.6)",
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
                                        <Loader2 className="animate-spin" size={32} style={{ color: "#10b981" }} />
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
                                            const isHost = game.host_id === Number(userId);

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
                                                                backgroundColor: isHost
                                                                    ? "rgba(59, 130, 246, 0.1)"
                                                                    : isFull
                                                                    ? "rgba(239, 68, 68, 0.1)"
                                                                    : "rgba(198, 255, 61, 0.1)",
                                                                color: isHost ? "#60a5fa" : isFull ? "#f87171" : "#10b981",
                                                                borderColor: isHost
                                                                    ? "rgba(59, 130, 246, 0.2)"
                                                                    : isFull
                                                                    ? "rgba(239, 68, 68, 0.2)"
                                                                    : "rgba(198, 255, 61, 0.2)",
                                                            }}
                                                        >
                                                            {isHost ? "YOUR MATCH" : isFull ? "FULL" : "JOINABLE"}
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
                                                                <strong style={{ color: "#10b981" }}>
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
                                                                    backgroundColor: isFull ? "#f87171" : "#10b981",
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
                                                            {isHost
                                                                ? "You created this lobby (counted as Player 1)."
                                                                : isFull
                                                                ? "Lobby is full. Join waitlist to get auto-promoted."
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
                                                        {isHost ? (
                                                            <button
                                                                disabled
                                                                style={{
                                                                    ...styles.cancelBtn,
                                                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                                                    color: "rgba(148, 163, 184, 0.6)",
                                                                    fontWeight: "bold",
                                                                    borderColor: "transparent",
                                                                    cursor: "not-allowed",
                                                                    padding: "6px 12px",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                Hosting (Player 1)
                                                            </button>
                                                        ) : isFull ? (
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
                                                                    backgroundColor: "#10b981",
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

                {activeTab === "my-trainings" && (
                    <div style={{ ...styles.bookingsSection, maxWidth: "1100px" }}>
                        <h2 style={styles.sectionTitle}>My Training</h2>
                        <p
                            style={{
                                color: "rgba(148, 163, 184, 0.55)",
                                fontSize: "14px",
                                marginTop: "-8px",
                                marginBottom: "20px",
                            }}
                        >
                            Trainings you have registered for with platform trainers
                        </p>

                        {loadingMyTrainings ? (
                            <div style={styles.emptyContainer}>
                                <Loader2
                                    size={32}
                                    style={{ color: "#10b981", marginBottom: "12px", animation: "spin 1s linear infinite" }}
                                />
                                <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "14px" }}>
                                    Loading your trainings...
                                </p>
                            </div>
                        ) : myTrainings.length === 0 ? (
                            <div style={styles.emptyContainer}>
                                <Award size={48} style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }} />
                                <h3>No registered trainings</h3>
                                <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px", marginTop: "8px" }}>
                                    You have not registered for any trainer sessions yet.
                                </p>
                                <button onClick={() => setActiveTab("training")} style={styles.exploreLinkBtn}>
                                    Discover Trainings
                                </button>
                            </div>
                        ) : (
                            <div style={styles.list}>
                                {myTrainings.map((training) => {
                                    const payment = (training.payment_status || "unpaid").toLowerCase();
                                    const regStatus = (training.status || "registered").toLowerCase();
                                    const isPaid = payment === "paid" || payment === "waived";
                                    const paymentLabel =
                                        payment === "waived" ? "FREE" : payment === "paid" ? "PAID" : "UNPAID";
                                    const dateLabel = [training.start_date, training.end_date]
                                        .filter(Boolean)
                                        .join(" – ");
                                    const feeFormatted =
                                        Number(training.fee || 0) > 0
                                            ? `\u20B9${Number(training.fee).toLocaleString("en-IN")}`
                                            : "Free";

                                    return (
                                        <div key={training.id} style={styles.bookingCard}>
                                            <div style={styles.cardHeader}>
                                                <div style={styles.sportHeader}>
                                                    <Award size={22} style={{ color: "#10b981" }} />
                                                    <div>
                                                        <span style={styles.sportLabel}>{training.title}</span>
                                                        {training.category && (
                                                            <span
                                                                style={{
                                                                    ...styles.cardSportChip,
                                                                    marginLeft: "10px",
                                                                    verticalAlign: "middle",
                                                                }}
                                                            >
                                                                {training.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        ...styles.badge,
                                                        backgroundColor: isPaid
                                                            ? "rgba(16, 185, 129, 0.1)"
                                                            : "rgba(234, 179, 8, 0.1)",
                                                        color: isPaid ? "#34d399" : "#fbbf24",
                                                        borderColor: isPaid
                                                            ? "rgba(16, 185, 129, 0.25)"
                                                            : "rgba(234, 179, 8, 0.25)",
                                                    }}
                                                >
                                                    {paymentLabel}
                                                </div>
                                            </div>

                                            <div style={styles.cardDetails}>
                                                <div style={styles.detailItem}>
                                                    <Users size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                    <span>
                                                        {training.trainer_name
                                                            ? `Trainer: ${training.trainer_name}`
                                                            : "Trainer session"}
                                                    </span>
                                                </div>

                                                {training.trainer_phone && (
                                                    <div style={styles.detailItem}>
                                                        <Phone size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                        <span>
                                                            Contact: <strong>{training.trainer_phone}</strong>
                                                        </span>
                                                    </div>
                                                )}

                                                {(dateLabel || training.schedule) && (
                                                    <div style={styles.detailItem}>
                                                        <Calendar size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                        <span>{dateLabel || training.schedule}</span>
                                                    </div>
                                                )}

                                                {training.start_time && (
                                                    <div style={styles.detailItem}>
                                                        <Clock size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                        <span>
                                                            {training.start_time}{" "}
                                                            {training.end_time ? `\u2013 ${training.end_time}` : ""}
                                                        </span>
                                                    </div>
                                                )}

                                                {training.location && (
                                                    <div style={styles.detailItem}>
                                                        <MapPin size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                        <span>{training.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={styles.cardFooter}>
                                                <div style={styles.metaInfo}>
                                                    <span>
                                                        Fee:{" "}
                                                        <strong style={{ color: "#10b981", fontSize: "14px" }}>
                                                            {feeFormatted}
                                                        </strong>
                                                    </span>
                                                    {regStatus && (
                                                        <span style={{ marginLeft: "16px", textTransform: "capitalize" }}>
                                                            Status: <strong>{regStatus}</strong>
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/trainings/${training.course_id}`}
                                                    style={{
                                                        ...styles.bookBtn,
                                                        textDecoration: "none",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    View Training
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "my-bookings" && (
                    /* My Bookings Tab: Display all court/venue reservations booked by the user */
                    <div style={styles.bookingsSection}>
                        <h2 style={styles.sectionTitle}>My Bookings</h2>
                        {loadingBookings ? (
                            <div style={styles.loadingContainer}>
                                <Loader2 className="animate-spin" size={32} style={{ color: "#10b981" }} />
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
                    /* Training: coaching sessions & workshops from platform trainers */
                    <div style={{ ...styles.bookingsSection, maxWidth: "1100px" }}>
                        <h2 style={styles.sectionTitle}>Discover Trainings</h2>
                        <p
                            style={{
                                color: "rgba(148, 163, 184, 0.55)",
                                fontSize: "14px",
                                marginTop: "-8px",
                                marginBottom: "20px",
                            }}
                        >
                            Independent trainings created by platform trainers
                        </p>

                        {loadingTrainings ? (
                            <div style={styles.emptyContainer}>
                                <Loader2
                                    size={32}
                                    style={{ color: "#10b981", marginBottom: "12px", animation: "spin 1s linear infinite" }}
                                />
                                <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "14px" }}>Loading trainings...</p>
                            </div>
                        ) : trainerTrainings.length === 0 ? (
                            <div style={styles.emptyContainer}>
                                <Award size={48} style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }} />
                                <h3>No Trainings Available</h3>
                                <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px", marginTop: "8px" }}>
                                    Trainers have not published any sessions yet. Check back soon.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.grid}>
                                {trainerTrainings.map((training) => (
                                    <Link
                                        key={training.id}
                                        href={`/trainings/${training.id}`}
                                        style={{ ...styles.card, textDecoration: "none", color: "inherit", display: "block" }}
                                    >
                                        <div style={styles.cardImageWrapper}>
                                            <img
                                                src={
                                                    training.cover_image ||
                                                    "https://images.unsplash.com/photo-1517649763962-0c6238842e77?q=80&w=600&auto=format&fit=crop"
                                                }
                                                alt={training.title}
                                                style={styles.cardImage}
                                            />
                                            <div style={styles.ratingBadge}>
                                                <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                    {training.status || "open"}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={styles.cardBody}>
                                            <h3 style={styles.cardName}>{training.title}</h3>
                                            <div style={styles.cardLoc}>
                                                <MapPin size={12} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                <span>
                                                    {training.trainer_name
                                                        ? `Trainer · ${training.trainer_name}`
                                                        : training.instructor || "Trainer session"}
                                                </span>
                                            </div>

                                            <p
                                                style={{
                                                    margin: "0 0 12px",
                                                    fontSize: "13px",
                                                    color: "rgba(226, 232, 240, 0.7)",
                                                    lineHeight: 1.45,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {training.description || "No description added."}
                                            </p>

                                            <div style={styles.cardSports}>
                                                {training.location && (
                                                    <span style={styles.cardSportChip}>{training.location}</span>
                                                )}
                                                {training.schedule && (
                                                    <span style={styles.cardSportChip}>{training.schedule}</span>
                                                )}
                                                {training.level && (
                                                    <span style={styles.cardSportChip}>{training.level}</span>
                                                )}
                                            </div>

                                            {training.reschedule_reason && (
                                                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#fb923c" }}>
                                                    Rescheduled: {training.reschedule_reason}
                                                </p>
                                            )}

                                            <div style={styles.cardFooter}>
                                                <div style={styles.priceSec}>
                                                    <span style={styles.priceVal}>
                                                        {Number(training.fee || 0) > 0
                                                            ? `\u20B9${Number(training.fee).toLocaleString("en-IN")}`
                                                            : "Free"}
                                                    </span>
                                                    <span style={styles.priceUnit}>
                                                        {training.available_seats != null
                                                            ? `${training.available_seats} seats left`
                                                            : training.start_date || "Open enrollment"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

const styles = {
    dashboardContainer: {
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
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
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
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
        color: "#0f172a",
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
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "#ffffff",
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
        color: "#0f172a",
    },
    userEmail: {
        fontSize: "11px",
        color: "#64748b",
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
        color: "#64748b",
    },
    homeSearchInput: {
        width: "100%",
        padding: "14px 16px 14px 48px",
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "12px",
        fontSize: "15px",
        color: "#0f172a",
        outline: "none",
        transition: "all 0.25s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    sportsCardContainer: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "30px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    homeTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: "24px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #10b981",
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
        color: "#334155",
        textAlign: "center",
    },
    homeTwoColumns: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "30px",
    },
    boxCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    boxHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "12px",
    },
    boxTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
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
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
    },
    trainerAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "#ecfdf5",
        color: "#047857",
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
        color: "#0f172a",
    },
    trainerSport: {
        fontSize: "12px",
        color: "#64748b",
    },
    trainerBtn: {
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#047857",
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
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
    },
    teamAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        background: "#ecfdf5",
        color: "#047857",
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
        color: "#0f172a",
    },
    teamSport: {
        fontSize: "12px",
        color: "#64748b",
    },
    teamJoinBtn: {
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#047857",
        padding: "6px 14px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    filterSection: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
        color: "#64748b",
    },
    searchInput: {
        width: "100%",
        padding: "16px 16px 16px 48px",
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "12px",
        fontSize: "15px",
        color: "#0f172a",
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
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "#ffffff",
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
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    cardImageWrapper: {
        position: "relative",
        height: "155px",
        overflow: "hidden",
        backgroundColor: "#f1f5f9",
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
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(4px)",
        borderRadius: "8px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#d97706",
        border: "1px solid #e2e8f0",
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
        color: "#0f172a",
        marginBottom: "8px",
    },
    cardLoc: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: "#64748b",
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
        color: "#047857",
        background: "#ecfdf5",
        padding: "3px 8px",
        borderRadius: "4px",
        border: "1px solid #a7f3d0",
        textTransform: "uppercase",
    },
    cardFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: "16px",
        borderTop: "1px solid #f1f5f9",
    },
    priceSec: {
        display: "flex",
        flexDirection: "column",
    },
    priceVal: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
    },
    priceUnit: {
        fontSize: "11px",
        color: "#94a3b8",
    },
    bookBtn: {
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "#ffffff",
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
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
    },
    bookingsSection: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: "20px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #10b981",
        paddingLeft: "10px",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    bookingCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    miniGameGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
    },
    miniGameCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    cardHeaderMini: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #f1f5f9",
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
        borderTop: "1px solid #f1f5f9",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
    },
    sportHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    sportLabel: {
        fontSize: "14px",
        fontWeight: "800",
        color: "#0f172a",
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
        color: "#475569",
    },
    metaInfo: {
        fontSize: "12px",
        color: "#94a3b8",
    },
    cancelBtn: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#dc2626",
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
        color: "#dc2626",
        fontStyle: "italic",
    },

    // --- GAME SUB-NAV STYLES ---
    gameSubNav: {
        display: "flex",
        gap: "16px",
        marginBottom: "32px",
        borderBottom: "1px solid #e2e8f0",
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
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
    },
    formInput: {
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    formSelect: {
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#0f172a",
        outline: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    tabToggleContainer: {
        display: "flex",
        background: "#f1f5f9",
        border: "1px solid #cbd5e1",
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
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#0f172a",
        outline: "none",
        minHeight: "100px",
        resize: "vertical",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    formSubmitBtn: {
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "#ffffff",
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
        boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)",
        marginTop: "10px",
        width: "fit-content",
        alignSelf: "flex-start",
    },
    distanceBadge: {
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(4px)",
        borderRadius: "8px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#047857",
        border: "1px solid #a7f3d0",
    },
    filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginTop: "10px",
        borderTop: "1px solid #e2e8f0",
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
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    filterSelect: {
        width: "100%",
        padding: "10px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#0f172a",
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
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        borderRadius: "8px",
        color: "#047857",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    locationClearBtn: {
        padding: "10px 14px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        color: "#dc2626",
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
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        colorScheme: "light",
    },
    toggleLabel: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#334155",
        cursor: "pointer",
        userSelect: "none",
    },
    toggleCheckbox: {
        width: "16px",
        height: "16px",
        accentColor: "#10b981",
        cursor: "pointer",
    },
};
