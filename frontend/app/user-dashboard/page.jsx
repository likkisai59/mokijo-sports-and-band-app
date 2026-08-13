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
    ArrowRight,
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
    const [joinedGamesFilter, setJoinedGamesFilter] = useState("all"); // "all" | "joined" | "hosted"
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
                    fetchHostedGames();
                    setGameSubTab("joined");
                } else {
                    alert("Match joined successfully! ⚽ View your match in Joined Games.");
                    fetchPublicGames();
                    fetchHostedGames();
                    setGameSubTab("joined");
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
                    /* Home Tab: Light Mode Premium User Dashboard Hub (Senior UI/UX Designer Skill) */
                    <div style={styles.homeContainer}>

                        {/* Light Mode Hero Banner & Quick Stats */}
                        <div style={styles.homeHeroBannerLight}>
                            <div style={styles.heroMainTextGroup}>
                                <div style={styles.userGreetingHeader}>
                                    <div style={styles.userAvatarCircle}>
                                        {userName?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <h1 style={styles.heroTitleLight}>
                                            Welcome back, {userName}! <span style={{ display: "inline-block" }}>👋</span>
                                        </h1>
                                        <p style={styles.heroSubtitleLight}>
                                            Book top-rated sports arenas, host custom matches, or join open game lobbies.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Metric Pills */}
                            <div style={styles.heroStatsGridLight}>
                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#ecfdf5", color: "#059669" }}>
                                        <CalendarCheck size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>{bookings ? bookings.length : 0}</div>
                                        <div style={styles.statLblLight}>Active Bookings</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>{hostedGames ? hostedGames.length : 0}</div>
                                        <div style={styles.statLblLight}>Joined Games</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#fef3c7", color: "#d97706" }}>
                                        <Trophy size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>Pro Athlete</div>
                                        <div style={styles.statLblLight}>Member Tier</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Shortcuts Grid */}
                        <div style={styles.quickActionGridLight}>
                            <div
                                style={styles.quickActionCardLight}
                                onClick={() => setActiveTab("booking")}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={{ ...styles.quickActionIconLight, backgroundColor: "#ecfdf5", color: "#059669" }}>
                                    <MapPin size={22} />
                                </div>
                                <div style={styles.quickActionInfo}>
                                    <h4 style={styles.quickActionTitleLight}>Book an Arena</h4>
                                    <p style={styles.quickActionSubLight}>Find &amp; reserve turf, courts, fields nearby</p>
                                </div>
                            </div>

                            <div
                                style={styles.quickActionCardLight}
                                onClick={() => {
                                    setActiveTab("game");
                                    setGameSubTab("host");
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={{ ...styles.quickActionIconLight, backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                                    <PlusCircle size={22} />
                                </div>
                                <div style={styles.quickActionInfo}>
                                    <h4 style={styles.quickActionTitleLight}>Host a Match</h4>
                                    <p style={styles.quickActionSubLight}>Create custom match lobby &amp; split costs</p>
                                </div>
                            </div>

                            <div
                                style={styles.quickActionCardLight}
                                onClick={() => {
                                    setActiveTab("game");
                                    setGameSubTab("explore");
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={{ ...styles.quickActionIconLight, backgroundColor: "#fef3c7", color: "#d97706" }}>
                                    <Compass size={22} />
                                </div>
                                <div style={styles.quickActionInfo}>
                                    <h4 style={styles.quickActionTitleLight}>Join Open Games</h4>
                                    <p style={styles.quickActionSubLight}>Discover active lobbies looking for players</p>
                                </div>
                            </div>

                            <div
                                style={styles.quickActionCardLight}
                                onClick={() => setActiveTab("training")}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={{ ...styles.quickActionIconLight, backgroundColor: "#ffe4e6", color: "#e11d48" }}>
                                    <Dumbbell size={22} />
                                </div>
                                <div style={styles.quickActionInfo}>
                                    <h4 style={styles.quickActionTitleLight}>Find Trainers</h4>
                                    <p style={styles.quickActionSubLight}>Book certified sports trainers &amp; sessions</p>
                                </div>
                            </div>
                        </div>

                        {/* Games and Sports Showcase (20 sports light grid) */}
                        <div style={styles.sportsCardContainerLight}>
                            <div style={styles.sectionHeaderLight}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Gamepad2 size={20} style={{ color: "#059669" }} />
                                    <h3 style={styles.homeTitleLight}>Explore Sports &amp; Activities</h3>
                                </div>
                                <span style={styles.badgeLightEmerald}>20 Sports Available</span>
                            </div>

                            <div style={styles.sportsGrid20Light}>
                                {twentySports.map((sport, index) => {
                                    return (
                                        <div
                                            key={index}
                                            style={styles.sportItemLight}
                                            onClick={() => {
                                                setSelectedSport(sport.id);
                                                setActiveTab("booking");
                                            }}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span style={{ fontSize: "32px", marginBottom: "6px", display: "block" }}>
                                                {sport.emoji}
                                            </span>
                                            <span style={styles.sportItemNameLight}>{sport.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Featured Venues and Live Game Lobbies (Two Column Section) */}
                        <div style={styles.homeTwoColumns}>
                            {/* Featured Venues Box */}
                            <div style={styles.boxCardLight}>
                                <div style={styles.boxHeaderLight}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <MapPin size={20} style={{ color: "#059669" }} />
                                        <h3 style={styles.boxTitleLight}>Featured Arenas &amp; Venues</h3>
                                    </div>
                                    <button
                                        style={styles.viewAllBtnLight}
                                        onClick={() => setActiveTab("booking")}
                                    >
                                        View All
                                    </button>
                                </div>

                                {loadingVenues ? (
                                    <div style={styles.loadingBoxLight}>
                                        <Loader2 className="animate-spin" size={24} style={{ color: "#059669" }} />
                                        <span>Discovering sports venues nearby...</span>
                                    </div>
                                ) : featuredVenues.length === 0 ? (
                                    <div style={styles.emptyBoxLight}>
                                        <MapPin size={32} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
                                        <p>No featured venues available right now.</p>
                                    </div>
                                ) : (
                                    <div style={styles.venueListLight}>
                                        {featuredVenues.slice(0, 4).map((venue) => (
                                            <div key={venue.id} style={styles.venueCardItemLight}>
                                                <div style={styles.venueAvatarLight}>
                                                    {venue.name?.charAt(0)?.toUpperCase() || "V"}
                                                </div>
                                                <div style={styles.venueInfoLight}>
                                                    <div style={styles.venueNameLight}>{venue.name}</div>
                                                    <div style={styles.venueSubLight}>
                                                        📍 {venue.location || "City Arena"} • ⭐ {venue.rating ?? "5.0"}
                                                    </div>
                                                </div>
                                                <div style={styles.venueActionLight}>
                                                    <span style={styles.venuePriceTagLight}>
                                                        ₹{venue.base_price_per_hour || 800}/hr
                                                    </span>
                                                    <button
                                                        style={styles.venueBookBtnLight}
                                                        onClick={() => router.push(`/venues/${venue.id}`)}
                                                    >
                                                        Book
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Live Matches & Game Lobbies Box */}
                            <div style={styles.boxCardLight}>
                                <div style={styles.boxHeaderLight}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Sparkles size={20} style={{ color: "#4f46e5" }} />
                                        <h3 style={styles.boxTitleLight}>Live Game Lobbies</h3>
                                    </div>
                                    <button
                                        style={styles.viewAllBtnLight}
                                        onClick={() => {
                                            setActiveTab("game");
                                            setGameSubTab("explore");
                                        }}
                                    >
                                        Explore Lobbies
                                    </button>
                                </div>

                                {loadingPublicGames ? (
                                    <div style={styles.loadingBoxLight}>
                                        <Loader2 className="animate-spin" size={24} style={{ color: "#4f46e5" }} />
                                        <span>Loading open game lobbies...</span>
                                    </div>
                                ) : publicGames.length === 0 ? (
                                    <div style={styles.emptyBoxLight}>
                                        <Users size={32} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
                                        <p style={{ fontWeight: 600, color: "#334155" }}>No open lobbies active right now</p>
                                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                            Host your own match and invite fellow players!
                                        </p>
                                        <button
                                            style={styles.hostLobbyBtnLight}
                                            onClick={() => {
                                                setActiveTab("game");
                                                setGameSubTab("host");
                                            }}
                                        >
                                            <PlusCircle size={14} />
                                            Host a Game
                                        </button>
                                    </div>
                                ) : (
                                    <div style={styles.lobbyListLight}>
                                        {publicGames.slice(0, 3).map((game) => {
                                            const spotsLeft = (game.max_players || 4) - (game.rsvps ? game.rsvps.length : 1);
                                            return (
                                                <div key={game.id} style={styles.lobbyCardItemLight}>
                                                    <div style={styles.lobbyHeaderLight}>
                                                        <span style={styles.lobbySportTagLight}>
                                                            {getSportEmoji(game.sport)} {game.sport?.toUpperCase()}
                                                        </span>
                                                        <span style={styles.lobbyPrivacyBadgeLight}>
                                                            {game.privacy_type === "private" ? "Invite Only 🔒" : "Public 🌍"}
                                                        </span>
                                                    </div>

                                                    <div style={styles.lobbyMetaLight}>
                                                        <div>📅 {game.date} at {game.time}</div>
                                                        <div>📍 {game.location}</div>
                                                    </div>

                                                    <div style={styles.lobbyFooterLight}>
                                                        <div style={styles.lobbySpotsLight}>
                                                            <span>Players: <strong>{game.rsvps ? game.rsvps.length : 1} / {game.max_players || 4}</strong></span>
                                                            <span style={{ fontSize: "11px", color: "#059669" }}>
                                                                {spotsLeft > 0 ? `${spotsLeft} spots left` : "Lobby Full"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            style={styles.lobbyJoinBtnLight}
                                                            onClick={() => handleJoinGame(game.id)}
                                                        >
                                                            Join Match
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                    /* Game Tab: Light Mode Match Center & Lobby Hub (Senior UI/UX Designer Skill) */
                    <div style={styles.homeContainer}>

                        {/* Light Mode Games Hero Banner */}
                        <div style={styles.homeHeroBannerLight}>
                            <div style={styles.heroMainTextGroup}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "28px" }}>🎮</span>
                                    <h1 style={styles.heroTitleLight}>Game Lobbies &amp; Match Center</h1>
                                </div>
                                <p style={styles.heroSubtitleLight}>
                                    Host custom sports matches, split ground costs with players, or join open game lobbies near you.
                                </p>
                            </div>

                            {/* Games Summary Stats */}
                            <div style={styles.heroStatsGridLight}>
                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#ecfdf5", color: "#059669" }}>
                                        <Trophy size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>
                                            {hostedGames.filter((g) => g.owner_id === Number(userId)).length}
                                        </div>
                                        <div style={styles.statLblLight}>Hosted Lobbies</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>
                                            {hostedGames.filter((g) => g.owner_id !== Number(userId)).length}
                                        </div>
                                        <div style={styles.statLblLight}>Joined Matches</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#fef3c7", color: "#d97706" }}>
                                        <Compass size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>{publicGames ? publicGames.length : 0}</div>
                                        <div style={styles.statLblLight}>Open Lobbies</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sub-Navigation Pill Bar */}
                        <div style={styles.gameSubNavLight}>
                            <button
                                onClick={() => setGameSubTab("host")}
                                style={{
                                    ...styles.gameSubNavBtnLight,
                                    backgroundColor: gameSubTab === "host" ? "#ecfdf5" : "#ffffff",
                                    color: gameSubTab === "host" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "host" ? "#a7f3d0" : "#cbd5e1",
                                    boxShadow: gameSubTab === "host" ? "0 2px 8px rgba(5, 150, 105, 0.12)" : "none",
                                }}
                            >
                                <PlusCircle size={15} />
                                <span>Host a Game</span>
                            </button>

                            <button
                                onClick={() => setGameSubTab("joined")}
                                style={{
                                    ...styles.gameSubNavBtnLight,
                                    backgroundColor: gameSubTab === "joined" ? "#ecfdf5" : "#ffffff",
                                    color: gameSubTab === "joined" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "joined" ? "#a7f3d0" : "#cbd5e1",
                                    boxShadow: gameSubTab === "joined" ? "0 2px 8px rgba(5, 150, 105, 0.12)" : "none",
                                }}
                            >
                                <Users size={15} />
                                <span>Joined Games ({hostedGames.length})</span>
                            </button>

                            <button
                                onClick={() => setGameSubTab("explore")}
                                style={{
                                    ...styles.gameSubNavBtnLight,
                                    backgroundColor: gameSubTab === "explore" ? "#ecfdf5" : "#ffffff",
                                    color: gameSubTab === "explore" ? "#047857" : "#475569",
                                    borderColor: gameSubTab === "explore" ? "#a7f3d0" : "#cbd5e1",
                                    boxShadow: gameSubTab === "explore" ? "0 2px 8px rgba(5, 150, 105, 0.12)" : "none",
                                }}
                            >
                                <Compass size={15} />
                                <span>Join Games ({publicGames.length})</span>
                            </button>
                        </div>

                        {/* SUB-TAB 1: HOST A GAME FORM (PREMIUM LIGHT THEME) */}
                        {gameSubTab === "host" && (
                            <div style={styles.boxCardLight}>
                                <div style={styles.boxHeaderLight}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #a7f3d0" }}>
                                            <PlusCircle size={22} />
                                        </div>
                                        <div>
                                            <h3 style={styles.boxTitleLight}>Host a Sports Match</h3>
                                            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                                Create a match lobby, invite fellow players, and split venue ground costs.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {gameSuccess ? (
                                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                        <div
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                background: "#ecfdf5",
                                                color: "#059669",
                                                fontSize: "26px",
                                                fontWeight: "bold",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 16px auto",
                                                border: "2px solid #a7f3d0",
                                                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
                                            }}
                                        >
                                            ✓
                                        </div>
                                        <h3 style={{ color: "#0f172a", fontSize: "22px", fontWeight: "800" }}>
                                            Match Created Successfully!
                                        </h3>
                                        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                                            Hosting lobby is live. Redirecting to your joined games list...
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleHostGameSubmit} style={styles.gameFormLight}>

                                        {/* SECTION 1: MATCH ESSENTIALS */}
                                        <div style={{ marginBottom: "8px" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#059669", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <Activity size={15} />
                                                <span>1. Match Essentials</span>
                                            </div>
                                            <div style={styles.formRowLight}>
                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Select Sport</label>
                                                    <select
                                                        value={gameSport}
                                                        onChange={(e) => setGameSport(e.target.value)}
                                                        style={styles.formSelectLight}
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

                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Skill Level Required</label>
                                                    <select
                                                        value={gameSkillLevel}
                                                        onChange={(e) => setGameSkillLevel(e.target.value)}
                                                        style={styles.formSelectLight}
                                                    >
                                                        <option value="All">All Skill Levels</option>
                                                        <option value="Beginner">Beginner</option>
                                                        <option value="Intermediate">Intermediate</option>
                                                        <option value="Advanced">Advanced</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 2: SCHEDULE & LOCATION */}
                                        <div style={{ marginBottom: "8px" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#059669", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <Calendar size={15} />
                                                <span>2. Schedule &amp; Venue Details</span>
                                            </div>
                                            <div style={styles.formRowLight}>
                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Match Date</label>
                                                    <input
                                                        type="date"
                                                        value={gameDate}
                                                        onChange={(e) => setGameDate(e.target.value)}
                                                        style={styles.formInputLight}
                                                        required
                                                    />
                                                </div>

                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={gameTime}
                                                        onChange={(e) => setGameTime(e.target.value)}
                                                        style={styles.formInputLight}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ ...styles.formRowLight, marginTop: "16px" }}>
                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Ground / Venue / Arena Name</label>
                                                    <input
                                                        type="text"
                                                        value={gameLocation}
                                                        onChange={(e) => setGameLocation(e.target.value)}
                                                        placeholder="e.g. Mukijo Sports Arena, Gachibowli"
                                                        style={styles.formInputLight}
                                                        required
                                                    />
                                                </div>

                                                <div style={styles.formGroupLight}>
                                                    <label style={styles.formLabelLight}>Max Players Wanted</label>
                                                    <input
                                                        type="number"
                                                        value={gameMaxPlayers}
                                                        onChange={(e) => setGameMaxPlayers(e.target.value)}
                                                        min="2"
                                                        max="50"
                                                        style={styles.formInputLight}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 3: PRIVACY & RULES */}
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#059669", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <Shield size={15} />
                                                <span>3. Privacy &amp; Match Rules</span>
                                            </div>
                                            <div style={styles.formGroupLight}>
                                                <label style={styles.formLabelLight}>Match Privacy Access</label>
                                                <div style={styles.privacyToggleGroupLight}>
                                                    <div
                                                        onClick={() => setGamePrivacy("public")}
                                                        style={{
                                                            ...styles.privacyBtnLight,
                                                            backgroundColor: gamePrivacy === "public" ? "#ecfdf5" : "#ffffff",
                                                            color: gamePrivacy === "public" ? "#047857" : "#475569",
                                                            borderColor: gamePrivacy === "public" ? "#059669" : "#cbd5e1",
                                                            boxShadow: gamePrivacy === "public" ? "0 2px 8px rgba(5,150,105,0.12)" : "none",
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <div style={{ fontWeight: "700", fontSize: "14px" }}>🌍 Public Match</div>
                                                        <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
                                                            Listed on open match discovery feed for anyone to join
                                                        </div>
                                                    </div>

                                                    <div
                                                        onClick={() => setGamePrivacy("private")}
                                                        style={{
                                                            ...styles.privacyBtnLight,
                                                            backgroundColor: gamePrivacy === "private" ? "#ecfdf5" : "#ffffff",
                                                            color: gamePrivacy === "private" ? "#047857" : "#475569",
                                                            borderColor: gamePrivacy === "private" ? "#059669" : "#cbd5e1",
                                                            boxShadow: gamePrivacy === "private" ? "0 2px 8px rgba(5,150,105,0.12)" : "none",
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <div style={{ fontWeight: "700", fontSize: "14px" }}>🔒 Invite-Only</div>
                                                        <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
                                                            Private match. Requires host invite code or approval
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ ...styles.formGroupLight, marginTop: "16px" }}>
                                                <label style={styles.formLabelLight}>Additional Match Rules &amp; Notes</label>
                                                <textarea
                                                    value={gameDescription}
                                                    onChange={(e) => setGameDescription(e.target.value)}
                                                    placeholder="e.g. Bring your own rackets. Court cost will be split evenly among players at venue check-in!"
                                                    style={styles.formTextareaLight}
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={submittingGame} style={styles.formSubmitBtnLight}>
                                            {submittingGame ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={18} />
                                                    <span>Hosting Match...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle size={18} />
                                                    <span>Host Match Now</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* SUB-TAB 2: JOINED & HOSTED GAMES LIST (PREMIUM LIGHT THEME) */}
                        {gameSubTab === "joined" && (
                            <div style={styles.boxCardLight}>
                                <div style={styles.sectionHeaderLight}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyCenter: "center", border: "1px solid #a7f3d0" }}>
                                            <Users size={22} />
                                        </div>
                                        <div>
                                            <h3 style={styles.boxTitleLight}>Your Joined &amp; Hosted Matches</h3>
                                            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                                Track upcoming matches, view player RSVPs, and manage your lobbies.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Filter Pills */}
                                    <div style={styles.filterPillGroupLight}>
                                        <button
                                            type="button"
                                            onClick={() => setJoinedGamesFilter("all")}
                                            style={{
                                                ...styles.filterPillBtnLight,
                                                backgroundColor: joinedGamesFilter === "all" ? "#059669" : "#f1f5f9",
                                                color: joinedGamesFilter === "all" ? "#ffffff" : "#475569",
                                            }}
                                        >
                                            All ({hostedGames.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJoinedGamesFilter("joined")}
                                            style={{
                                                ...styles.filterPillBtnLight,
                                                backgroundColor: joinedGamesFilter === "joined" ? "#059669" : "#f1f5f9",
                                                color: joinedGamesFilter === "joined" ? "#ffffff" : "#475569",
                                            }}
                                        >
                                            ⚽ Joined ({hostedGames.filter((g) => g.owner_id !== Number(userId)).length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJoinedGamesFilter("hosted")}
                                            style={{
                                                ...styles.filterPillBtnLight,
                                                backgroundColor: joinedGamesFilter === "hosted" ? "#059669" : "#f1f5f9",
                                                color: joinedGamesFilter === "hosted" ? "#ffffff" : "#475569",
                                            }}
                                        >
                                            🏆 Hosted ({hostedGames.filter((g) => g.owner_id === Number(userId)).length})
                                        </button>
                                    </div>
                                </div>

                                {loadingHostedGames ? (
                                    <div style={styles.loadingBoxLight}>
                                        <Loader2 className="animate-spin" size={28} style={{ color: "#059669" }} />
                                        <span>Fetching your joined game matches...</span>
                                    </div>
                                ) : hostedGames.length === 0 ? (
                                    <div style={styles.emptyBoxLight}>
                                        <Play size={40} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                                        <h4 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
                                            No matches joined yet
                                        </h4>
                                        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                                            You haven&apos;t joined or hosted any matches yet. Discover active lobbies!
                                        </p>
                                        <button
                                            onClick={() => setGameSubTab("explore")}
                                            style={styles.hostLobbyBtnLight}
                                        >
                                            <Compass size={14} />
                                            Explore &amp; Join Games
                                        </button>
                                    </div>
                                ) : (
                                    <div style={styles.miniGameGridLight}>
                                        {hostedGames
                                            .filter((act) => {
                                                const isOwner = act.owner_id === Number(userId);
                                                if (joinedGamesFilter === "joined") return !isOwner;
                                                if (joinedGamesFilter === "hosted") return isOwner;
                                                return true;
                                            })
                                            .map((act) => {
                                                const isOwner = act.owner_id === Number(userId);
                                                return (
                                                    <div key={act.id} style={styles.joinedMatchCardLight}>
                                                        <div style={styles.joinedCardHeaderLight}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span style={{ fontSize: "24px" }}>
                                                                    {getSportEmoji(act.sport)}
                                                                </span>
                                                                <span style={styles.joinedSportTitleLight}>
                                                                    {act.sport?.toUpperCase()} MATCH
                                                                </span>
                                                            </div>

                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                {isOwner ? (
                                                                    <span style={styles.badgeOwnerHostLight}>HOST</span>
                                                                ) : (
                                                                    <span style={styles.badgePlayerJoinedLight}>PLAYER</span>
                                                                )}
                                                                <span
                                                                    style={
                                                                        act.status === "cancelled"
                                                                            ? styles.badgeCancelledLight
                                                                            : styles.badgeConfirmedLight
                                                                    }
                                                                >
                                                                    {act.status?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div style={styles.joinedCardBodyLight}>
                                                            <div style={styles.joinedDetailRowLight}>
                                                                <Calendar size={14} style={{ color: "#059669" }} />
                                                                <span>{act.date} • {act.time}</span>
                                                            </div>
                                                            <div style={styles.joinedDetailRowLight}>
                                                                <MapPin size={14} style={{ color: "#059669" }} />
                                                                <span>{act.location}</span>
                                                            </div>
                                                            <div style={styles.joinedDetailRowLight}>
                                                                <Users size={14} style={{ color: "#059669" }} />
                                                                <span>
                                                                    Players: <strong>{act.rsvps ? act.rsvps.length : 1} / {act.max_players}</strong> ({act.skill_level || "All"} Level)
                                                                </span>
                                                            </div>
                                                            {act.description && (
                                                                <p style={styles.joinedNotesLight}>
                                                                    &quot;{act.description}&quot;
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div style={styles.joinedCardFooterLight}>
                                                            {isOwner && act.status !== "cancelled" ? (
                                                                <button
                                                                    onClick={() => handleCancelHostedGame(act.id)}
                                                                    style={styles.cancelGameBtnLight}
                                                                >
                                                                    Cancel Game Match
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                                                                    ✓ Confirmed Player
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-TAB 3: JOIN GAMES DISCOVERY FEED (PREMIUM LIGHT THEME) */}
                        {gameSubTab === "explore" && (
                            <div style={styles.boxCardLight}>
                                <div style={styles.sectionHeaderLight}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #a7f3d0" }}>
                                            <Compass size={22} />
                                        </div>
                                        <div>
                                            <h3 style={styles.boxTitleLight}>Explore Open Game Lobbies</h3>
                                            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                                Discover active lobbies hosted by other players and RSVP to join.
                                            </p>
                                        </div>
                                    </div>
                                    <span style={styles.badgeLightEmerald}>{publicGames.length} Lobbies Available</span>
                                </div>

                                {loadingPublicGames ? (
                                    <div style={styles.loadingBoxLight}>
                                        <Loader2 className="animate-spin" size={28} style={{ color: "#059669" }} />
                                        <span>Searching open game lobbies near you...</span>
                                    </div>
                                ) : publicGames.length === 0 ? (
                                    <div style={styles.emptyBoxLight}>
                                        <Compass size={40} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                                        <h4 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
                                            No open lobbies right now
                                        </h4>
                                        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                                            Be the first to host a sports match and invite other players!
                                        </p>
                                        <button
                                            onClick={() => setGameSubTab("host")}
                                            style={styles.hostLobbyBtnLight}
                                        >
                                            <PlusCircle size={14} />
                                            Host a Game Match
                                        </button>
                                    </div>
                                ) : (
                                    <div style={styles.miniGameGridLight}>
                                        {publicGames.map((game) => {
                                            const formattedDate = new Date(game.slot_start || game.date).toLocaleDateString(
                                                undefined,
                                                { weekday: "short", month: "short", day: "numeric" }
                                            );
                                            const formattedTime = new Date(game.slot_start || `${game.date}T${game.time}`).toLocaleTimeString(
                                                undefined,
                                                { hour: "2-digit", minute: "2-digit" }
                                            );
                                            const spotsLeft = (game.total_spots || game.max_players) - (game.current_players || (game.rsvps ? game.rsvps.length : 1));
                                            const isFull = spotsLeft <= 0;
                                            const isHost = (game.host_id || game.owner_id) === Number(userId);

                                            return (
                                                <div key={game.id} style={styles.exploreMatchCardLight}>
                                                    <div style={styles.joinedCardHeaderLight}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <span style={{ fontSize: "24px" }}>
                                                                {getSportEmoji(game.sport)}
                                                            </span>
                                                            <span style={styles.joinedSportTitleLight}>
                                                                {game.sport?.toUpperCase()} MATCH
                                                            </span>
                                                        </div>
                                                        <span
                                                            style={
                                                                isHost
                                                                    ? styles.badgeOwnerHostLight
                                                                    : isFull
                                                                    ? styles.badgeCancelledLight
                                                                    : styles.badgeConfirmedLight
                                                            }
                                                        >
                                                            {isHost ? "YOUR LOBBY" : isFull ? "FULL" : "JOINABLE"}
                                                        </span>
                                                    </div>

                                                    <div style={styles.joinedCardBodyLight}>
                                                        <div style={styles.joinedDetailRowLight}>
                                                            <Calendar size={14} style={{ color: "#059669" }} />
                                                            <span>{formattedDate !== "Invalid Date" ? formattedDate : game.date} at {formattedTime !== "Invalid Date" ? formattedTime : game.time}</span>
                                                        </div>
                                                        <div style={styles.joinedDetailRowLight}>
                                                            <MapPin size={14} style={{ color: "#059669" }} />
                                                            <span>{game.location}</span>
                                                        </div>
                                                        <div style={styles.joinedDetailRowLight}>
                                                            <Trophy size={14} style={{ color: "#d97706" }} />
                                                            <span>Split Cost: <strong style={{ color: "#059669" }}>₹{game.price_per_player || 150}</strong> / player</span>
                                                        </div>

                                                        {/* Player Capacity Bar */}
                                                        <div style={styles.capacityBarWrapperLight}>
                                                            <div style={styles.capacityBarMetaLight}>
                                                                <span>Players: <strong>{game.current_players || (game.rsvps ? game.rsvps.length : 1)} / {game.total_spots || game.max_players || 4}</strong></span>
                                                                <span style={{ color: isFull ? "#dc2626" : "#059669", fontWeight: "700" }}>
                                                                    {isFull ? "Lobby Full" : `${spotsLeft} spots remaining`}
                                                                </span>
                                                            </div>
                                                            <div style={styles.capacityBarTrackLight}>
                                                                <div
                                                                    style={{
                                                                        width: `${Math.min(100, (((game.current_players || (game.rsvps ? game.rsvps.length : 1)) / (game.total_spots || game.max_players || 4)) * 100))}%`,
                                                                        height: "100%",
                                                                        backgroundColor: isFull ? "#ef4444" : "#059669",
                                                                        borderRadius: "3px",
                                                                        transition: "width 0.3s ease",
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={styles.joinedCardFooterLight}>
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            {game.join_policy === "instant" ? "Instant Join ⚡" : "Public Match 🌍"}
                                                        </span>

                                                        {isHost ? (
                                                            <span style={{ fontSize: "12px", color: "#d97706", fontWeight: "700" }}>
                                                                Hosting (Player 1)
                                                            </span>
                                                        ) : isFull ? (
                                                            <button
                                                                onClick={() => handleJoinWaitlist(game.id)}
                                                                style={styles.waitlistBtnLight}
                                                            >
                                                                Join Waitlist
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleJoinGame(game.id)}
                                                                disabled={joiningGameId === game.id}
                                                                style={styles.joinMatchBtnLight}
                                                            >
                                                                {joiningGameId === game.id ? "Joining..." : "Join Match"}
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
                    <div style={styles.homeContainer}>
                        {/* Premium Light Hero Banner */}
                        <div style={styles.homeHeroBannerLight}>
                            <div style={styles.heroMainTextGroup}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "28px" }}>🎖️</span>
                                    <h1 style={styles.heroTitleLight}>My Registered Trainings</h1>
                                </div>
                                <p style={styles.heroSubtitleLight}>
                                    Track your active sports coaching programs, view coach contact info, schedules, and training passes.
                                </p>
                            </div>

                            {/* My Trainings Summary Stats */}
                            <div style={styles.heroStatsGridLight}>
                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#ecfdf5", color: "#059669" }}>
                                        <Award size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>{myTrainings.length}</div>
                                        <div style={styles.statLblLight}>Enrolled Courses</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>
                                            {myTrainings.filter((t) => (t.payment_status || "").toLowerCase() === "paid" || (t.payment_status || "").toLowerCase() === "waived").length}
                                        </div>
                                        <div style={styles.statLblLight}>Paid Sessions</div>
                                    </div>
                                </div>

                                <div style={styles.heroStatCardLight}>
                                    <div style={{ ...styles.statIconBox, backgroundColor: "#fef3c7", color: "#d97706" }}>
                                        <Dumbbell size={18} />
                                    </div>
                                    <div>
                                        <div style={styles.statValLight}>Pro Tier</div>
                                        <div style={styles.statLblLight}>Training Status</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Container Card */}
                        <div style={styles.boxCardLight}>
                            <div style={styles.sectionHeaderLight}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #a7f3d0" }}>
                                        <Award size={22} />
                                    </div>
                                    <div>
                                        <h3 style={styles.boxTitleLight}>Your Training Registrations</h3>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                            Trainings you have registered for with certified platform trainers.
                                        </p>
                                    </div>
                                </div>
                                <span style={styles.badgeLightEmerald}>{myTrainings.length} Active Courses</span>
                            </div>

                            {loadingMyTrainings ? (
                                <div style={styles.loadingBoxLight}>
                                    <Loader2 className="animate-spin" size={28} style={{ color: "#059669" }} />
                                    <span>Fetching your registered training courses...</span>
                                </div>
                            ) : myTrainings.length === 0 ? (
                                <div style={styles.emptyBoxLight}>
                                    <Award size={44} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                                    <h4 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
                                        No registered trainings yet
                                    </h4>
                                    <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                                        You haven&apos;t enrolled in any trainer sessions yet. Explore available training courses!
                                    </p>
                                    <button onClick={() => setActiveTab("training")} style={styles.hostLobbyBtnLight}>
                                        <Dumbbell size={15} />
                                        <span>Discover &amp; Book Trainings</span>
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {myTrainings.map((training) => {
                                        const payment = (training.payment_status || "unpaid").toLowerCase();
                                        const regStatus = (training.status || "registered").toLowerCase();
                                        const isPaid = payment === "paid" || payment === "waived";
                                        const paymentLabel =
                                            payment === "waived" ? "FREE PASS" : payment === "paid" ? "PAID" : "UNPAID";
                                        const dateLabel = [training.start_date, training.end_date]
                                            .filter(Boolean)
                                            .join(" – ");
                                        const feeFormatted =
                                            Number(training.fee || 0) > 0
                                                ? `\u20B9${Number(training.fee).toLocaleString("en-IN")}`
                                                : "Free";

                                        return (
                                            <div key={training.id} style={styles.myTrainingCardLight}>
                                                {/* Header */}
                                                <div style={styles.myTrainingCardHeaderLight}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <Award size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 style={styles.myTrainingTitleLight}>{training.title}</h4>
                                                            {training.category && (
                                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: "12px", border: "1px solid #a7f3d0", marginTop: "4px", display: "inline-block" }}>
                                                                    {training.category?.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span
                                                        style={
                                                            isPaid
                                                                ? styles.badgeConfirmedLight
                                                                : styles.badgeCancelledLight
                                                        }
                                                    >
                                                        ✓ {paymentLabel}
                                                    </span>
                                                </div>

                                                {/* Organized Detail Grid */}
                                                <div style={styles.myTrainingGridLight}>
                                                    <div style={styles.myTrainingDetailItemLight}>
                                                        <Users size={15} style={{ color: "#059669" }} />
                                                        <span>
                                                            Coach: <strong>{training.trainer_name || "Certified Trainer"}</strong>
                                                        </span>
                                                    </div>

                                                    {training.trainer_phone && (
                                                        <div style={styles.myTrainingDetailItemLight}>
                                                            <Phone size={15} style={{ color: "#059669" }} />
                                                            <span>
                                                                Contact: <a href={`tel:${training.trainer_phone}`} style={{ color: "#059669", fontWeight: "700", textDecoration: "none" }}>{training.trainer_phone}</a>
                                                            </span>
                                                        </div>
                                                    )}

                                                    {(dateLabel || training.schedule) && (
                                                        <div style={styles.myTrainingDetailItemLight}>
                                                            <Calendar size={15} style={{ color: "#059669" }} />
                                                            <span>{dateLabel || training.schedule}</span>
                                                        </div>
                                                    )}

                                                    {training.start_time && (
                                                        <div style={styles.myTrainingDetailItemLight}>
                                                            <Clock size={15} style={{ color: "#059669" }} />
                                                            <span>
                                                                {training.start_time}{" "}
                                                                {training.end_time ? `\u2013 ${training.end_time}` : ""}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {training.location && (
                                                        <div style={styles.myTrainingDetailItemLight}>
                                                            <MapPin size={15} style={{ color: "#059669" }} />
                                                            <span>{training.location}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div style={styles.myTrainingFooterLight}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                        <span style={{ fontSize: "13px", color: "#475569" }}>
                                                            Course Fee: <strong style={{ color: "#059669", fontSize: "15px", fontWeight: "800" }}>{feeFormatted}</strong>
                                                        </span>
                                                        {regStatus && (
                                                            <span style={{ fontSize: "12px", color: "#64748b", textTransform: "capitalize" }}>
                                                                Status: <strong style={{ color: "#0f172a" }}>{regStatus}</strong>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={`/trainings/${training.course_id}`}
                                                        style={styles.myTrainingViewBtnLight}
                                                    >
                                                        <span>View Training Pass</span>
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
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
                    <div style={styles.homeContainer}>
                        {/* Premium Light Hero Banner */}
                        <div style={styles.homeHeroBannerLight}>
                            <div style={styles.heroMainTextGroup}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "28px" }}>⚡</span>
                                    <h1 style={styles.heroTitleLight}>Discover Sports Trainings &amp; Bootcamps</h1>
                                </div>
                                <p style={styles.heroSubtitleLight}>
                                    Explore certified coaching sessions, academy training bootcamps, and skill workshops published by top platform trainers.
                                </p>
                            </div>
                        </div>

                        {/* Main Container Card */}
                        <div style={styles.boxCardLight}>
                            <div style={styles.sectionHeaderLight}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #a7f3d0" }}>
                                        <Dumbbell size={22} />
                                    </div>
                                    <div>
                                        <h3 style={styles.boxTitleLight}>Available Training Sessions</h3>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                            Browse active coaching programs, check schedules, and reserve your training spot.
                                        </p>
                                    </div>
                                </div>
                                <span style={styles.badgeLightEmerald}>{trainerTrainings.length} Programs Open</span>
                            </div>

                            {loadingTrainings ? (
                                <div style={styles.loadingBoxLight}>
                                    <Loader2 className="animate-spin" size={28} style={{ color: "#059669" }} />
                                    <span>Loading sports training sessions...</span>
                                </div>
                            ) : trainerTrainings.length === 0 ? (
                                <div style={styles.emptyBoxLight}>
                                    <Award size={44} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                                    <h4 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
                                        No trainings available right now
                                    </h4>
                                    <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                                        Trainers have not published any new bootcamps yet. Check back soon!
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.rectangularGridLight}>
                                    {trainerTrainings.map((training) => {
                                        const feeFormatted =
                                            Number(training.fee || 0) > 0
                                                ? `\u20B9${Number(training.fee).toLocaleString("en-IN")}`
                                                : "Free";

                                        return (
                                            <Link
                                                key={training.id}
                                                href={`/trainings/${training.id}`}
                                                style={styles.rectangularTrainingCardLight}
                                            >
                                                {/* Rectangular Image Banner */}
                                                <div style={styles.rectangularImageWrapperLight}>
                                                    <img
                                                        src={
                                                            training.cover_image ||
                                                            "https://images.unsplash.com/photo-1517649763962-0c6238842e77?q=80&w=600&auto=format&fit=crop"
                                                        }
                                                        alt={training.title}
                                                        style={styles.rectangularImageLight}
                                                    />
                                                    <div style={styles.rectangularStatusBadgeLight}>
                                                        ⚡ {(training.status || "OPEN ENROLLMENT").toUpperCase()}
                                                    </div>
                                                </div>

                                                {/* Rectangular Content Body */}
                                                <div style={styles.rectangularCardBodyLight}>
                                                    <h3 style={styles.rectangularTitleLight}>{training.title}</h3>

                                                    <div style={styles.rectangularCoachRowLight}>
                                                        <Users size={15} style={{ color: "#059669" }} />
                                                        <span>
                                                            Coach: <strong>{training.trainer_name || training.instructor || "Certified Platform Trainer"}</strong>
                                                        </span>
                                                    </div>

                                                    <div style={styles.rectangularMetaRowLight}>
                                                        {training.location && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <MapPin size={13} style={{ color: "#059669" }} />
                                                                <span>{training.location}</span>
                                                            </div>
                                                        )}
                                                        {training.schedule && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <Calendar size={13} style={{ color: "#059669" }} />
                                                                <span>{training.schedule}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {training.description && (
                                                        <p style={styles.rectangularDescLight}>
                                                            {training.description}
                                                        </p>
                                                    )}

                                                    {/* Category & Level Chips */}
                                                    <div style={styles.rectangularChipGroupLight}>
                                                        {training.level && (
                                                            <span style={styles.rectangularChipLight}>Level: {training.level}</span>
                                                        )}
                                                        {training.available_seats != null && (
                                                            <span style={{ ...styles.rectangularChipLight, background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                                                                🔥 {training.available_seats} seats left
                                                            </span>
                                                        )}
                                                    </div>

                                                    {training.reschedule_reason && (
                                                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#d97706", fontWeight: "600" }}>
                                                            ⚠️ Rescheduled: {training.reschedule_reason}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Rectangular Card Footer */}
                                                <div style={styles.rectangularCardFooterLight}>
                                                    <div>
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>Fee per trainee</div>
                                                        <div style={styles.rectangularPriceTagLight}>{feeFormatted}</div>
                                                    </div>

                                                    <div style={styles.rectangularEnrollBtnLight}>
                                                        <span>View Details</span>
                                                        <ArrowRight size={14} />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
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

    // --- LIGHT MODE USER DASHBOARD HOME STYLES (Senior UI/UX Designer Skill) ---
    homeHeroBannerLight: {
        background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0f9ff 100%)",
        border: "1px solid #d1fae5",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "28px",
        boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    userGreetingHeader: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    userAvatarCircle: {
        width: "54px",
        height: "54px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        fontSize: "24px",
        fontWeight: "800",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
        flexShrink: 0,
    },
    heroTitleLight: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
        letterSpacing: "-0.02em",
    },
    heroSubtitleLight: {
        fontSize: "14px",
        color: "#475569",
        marginTop: "4px",
        margin: 0,
    },
    heroStatsGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
    },
    heroStatCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
    },
    statIconBox: {
        width: "42px",
        height: "42px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    statValLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        lineHeight: 1.2,
    },
    statLblLight: {
        fontSize: "12px",
        color: "#64748b",
        fontWeight: "500",
    },

    // --- QUICK ACTIONS HUB (LIGHT THEME) ---
    quickActionGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "28px",
    },
    quickActionCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
    },
    quickActionIconLight: {
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    quickActionInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    quickActionTitleLight: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
    },
    quickActionSubLight: {
        fontSize: "12px",
        color: "#64748b",
        margin: 0,
        lineHeight: 1.3,
    },

    // --- 20 SPORTS LIGHT SHOWCASE ---
    sportsCardContainerLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "28px",
        boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.04)",
    },
    sectionHeaderLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    homeTitleLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },
    badgeLightEmerald: {
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "12px",
        fontWeight: "700",
    },
    sportsGrid20Light: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
        gap: "12px",
    },
    sportItemLight: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px 10px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    sportItemNameLight: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#1e293b",
        display: "block",
    },

    // --- LIGHT TWO COLUMN BOXES (VENUES & LOBBIES) ---
    boxCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.04)",
    },
    boxHeaderLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
    },
    boxTitleLight: {
        fontSize: "16px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },
    viewAllBtnLight: {
        background: "transparent",
        border: "none",
        color: "#059669",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
    },
    loadingBoxLight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "24px 0",
        color: "#64748b",
        fontSize: "14px",
    },
    emptyBoxLight: {
        textAlign: "center",
        padding: "28px 16px",
        color: "#64748b",
        fontSize: "13px",
    },
    venueListLight: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    venueCardItemLight: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 14px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        transition: "all 0.2s ease",
    },
    venueAvatarLight: {
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: "#ecfdf5",
        color: "#059669",
        fontSize: "18px",
        fontWeight: "800",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #a7f3d0",
        flexShrink: 0,
    },
    venueInfoLight: {
        flexGrow: 1,
    },
    venueNameLight: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#0f172a",
    },
    venueSubLight: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "2px",
    },
    venueActionLight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
    },
    venuePriceTagLight: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#059669",
    },
    venueBookBtnLight: {
        background: "#059669",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "background 0.2s ease",
    },
    hostLobbyBtnLight: {
        marginTop: "12px",
        background: "#4f46e5",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
    },
    lobbyListLight: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    lobbyCardItemLight: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    lobbyHeaderLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    lobbySportTagLight: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#0f172a",
    },
    lobbyPrivacyBadgeLight: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#64748b",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "12px",
        padding: "2px 8px",
    },
    lobbyMetaLight: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        fontSize: "12px",
        color: "#475569",
    },
    lobbyFooterLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "4px",
        paddingTop: "8px",
        borderTop: "1px solid #e2e8f0",
    },
    lobbySpotsLight: {
        display: "flex",
        flexDirection: "column",
        fontSize: "12px",
        color: "#334155",
    },
    lobbyJoinBtnLight: {
        background: "#059669",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },

    // --- GAMES TAB LIGHT THEME STYLES (Senior UI/UX Designer Skill) ---
    gameSubNavLight: {
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
        flexWrap: "wrap",
    },
    gameSubNavBtnLight: {
        border: "1px solid",
        padding: "10px 20px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    gameFormLight: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginTop: "16px",
    },
    formRowLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
    },
    formGroupLight: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    formLabelLight: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#0f172a",
    },
    formSelectLight: {
        width: "100%",
        padding: "11px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
    },
    formInputLight: {
        width: "100%",
        padding: "11px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
    },
    privacyToggleGroupLight: {
        display: "flex",
        gap: "10px",
    },
    privacyBtnLight: {
        flex: 1,
        padding: "10px 14px",
        border: "1px solid",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    formTextareaLight: {
        width: "100%",
        padding: "12px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        minHeight: "90px",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        resize: "vertical",
    },
    formSubmitBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "12px",
        padding: "14px 24px",
        fontSize: "14px",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
        transition: "all 0.2s ease",
    },
    filterPillGroupLight: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    filterPillBtnLight: {
        border: "none",
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    miniGameGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
        marginTop: "16px",
    },
    joinedMatchCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 4px 14px -2px rgba(0, 0, 0, 0.03)",
        transition: "all 0.2s ease",
    },
    joinedCardHeaderLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    joinedSportTitleLight: {
        fontSize: "14px",
        fontWeight: "800",
        color: "#0f172a",
    },
    badgeOwnerHostLight: {
        background: "#fef3c7",
        color: "#d97706",
        border: "1px solid #fde68a",
        borderRadius: "12px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "700",
    },
    badgePlayerJoinedLight: {
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "12px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "700",
    },
    badgeConfirmedLight: {
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "12px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "700",
    },
    badgeCancelledLight: {
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: "12px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "700",
    },
    joinedCardBodyLight: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    joinedDetailRowLight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "#334155",
    },
    joinedNotesLight: {
        fontSize: "12px",
        color: "#64748b",
        fontStyle: "italic",
        marginTop: "4px",
        margin: 0,
    },
    joinedCardFooterLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "4px",
        paddingTop: "12px",
        borderTop: "1px solid #f1f5f9",
    },
    cancelGameBtnLight: {
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },
    exploreMatchCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 4px 14px -2px rgba(0, 0, 0, 0.03)",
        transition: "all 0.2s ease",
    },
    capacityBarWrapperLight: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginTop: "6px",
    },
    capacityBarMetaLight: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        color: "#334155",
    },
    capacityBarTrackLight: {
        width: "100%",
        height: "6px",
        backgroundColor: "#e2e8f0",
        borderRadius: "3px",
        overflow: "hidden",
    },
    joinMatchBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
    },
    waitlistBtnLight: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },

    // --- MY TRAINING TAB LIGHT THEME STYLES (Senior UI/UX Designer Skill) ---
    myTrainingHeroLight: {
        background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%, #ecfdf5 100%)",
        border: "1px solid #a7f3d0",
        borderRadius: "20px",
        padding: "24px 28px",
        marginBottom: "24px",
        boxShadow: "0 4px 20px -2px rgba(5, 150, 105, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
    },
    myTrainingCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        padding: "22px 26px",
        marginBottom: "18px",
        boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    myTrainingCardHeaderLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "14px",
        marginBottom: "16px",
        borderBottom: "1px solid #f1f5f9",
    },
    myTrainingTitleLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        fontFamily: "'Outfit', sans-serif",
    },
    myTrainingGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "16px",
        background: "#f8fafc",
        padding: "16px",
        borderRadius: "14px",
        border: "1px solid #f1f5f9",
    },
    myTrainingDetailItemLight: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "13px",
        color: "#334155",
    },
    myTrainingFooterLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "14px",
        borderTop: "1px solid #f1f5f9",
    },
    myTrainingViewBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 22px",
        fontSize: "13px",
        fontWeight: "800",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.22)",
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
    },

    // --- DISCOVER TRAININGS TAB LIGHT THEME RECTANGULAR STYLES (Senior UI/UX Designer Skill) ---
    rectangularGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "22px",
        marginTop: "20px",
    },
    rectangularTrainingCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
    },
    rectangularImageWrapperLight: {
        position: "relative",
        width: "100%",
        height: "190px",
        backgroundColor: "#f1f5f9",
        overflow: "hidden",
    },
    rectangularImageLight: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform 0.3s ease",
    },
    rectangularStatusBadgeLight: {
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.04em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    rectangularCardBodyLight: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flex: 1,
    },
    rectangularTitleLight: {
        fontSize: "17px",
        fontWeight: "800",
        color: "#0f172a",
        fontFamily: "'Outfit', sans-serif",
        lineHeight: "1.3",
        margin: 0,
    },
    rectangularCoachRowLight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "#334155",
        fontWeight: "600",
    },
    rectangularMetaRowLight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "12px",
        color: "#64748b",
        flexWrap: "wrap",
    },
    rectangularDescLight: {
        fontSize: "13px",
        color: "#475569",
        lineHeight: "1.5",
        margin: "2px 0 0 0",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },
    rectangularChipGroupLight: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
        marginTop: "4px",
    },
    rectangularChipLight: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "3px 9px",
        fontSize: "11px",
        fontWeight: "700",
    },
    rectangularCardFooterLight: {
        padding: "16px 20px",
        background: "#f8fafc",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
    },
    rectangularPriceTagLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#059669",
        fontFamily: "'Outfit', sans-serif",
    },
    rectangularEnrollBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        padding: "9px 18px",
        fontSize: "12px",
        fontWeight: "800",
        boxShadow: "0 3px 10px rgba(16, 185, 129, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
};



