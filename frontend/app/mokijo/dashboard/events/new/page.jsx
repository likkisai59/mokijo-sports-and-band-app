"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    Sparkles,
    Shield,
    Bell,
    UserCheck,
    Globe,
    UserPlus,
    Hourglass,
    DollarSign,
    PlusCircle,
    Image as ImageIcon,
    Activity,
} from "lucide-react";
import "@/app/styles/events.css";

export default function NewEventPage() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);

    // Core event fields
    const [name, setName] = useState("");
    const [type, setType] = useState("Match");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [groupId, setGroupId] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [eventFee, setEventFee] = useState("");
    const [registrationDeadline, setRegistrationDeadline] = useState("");

    // Settings
    const [autoReminder, setAutoReminder] = useState(false);
    const [attendanceTracking, setAttendanceTracking] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [allowGuest, setAllowGuest] = useState(false);
    const [allowWaitingList, setAllowWaitingList] = useState(false);

    // Cover image preset state
    const [selectedCover, setSelectedCover] = useState("Match");
    const [customCoverUrl, setCustomCoverUrl] = useState("");

    // Gradients mapping
    const coverPresets = {
        Match: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        Training: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        Meeting: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
        Social: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
        Tournament: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        Ceremony: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    };

    useEffect(() => {
        const fetchGroups = async () => {
            const userId = localStorage.getItem("userId");
            const token = localStorage.getItem("accessToken");
            if (!userId) {
                router.push("/login");
                return;
            }
            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${API_BASE_URL}/groups?owner_id=${userId}`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setGroups(data);
                    if (data.length > 0) setGroupId(data[0].id.toString());
                }
            } catch (error) {
                console.error("Error loading groups:", error);
            }
        };

        fetchGroups();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem("userId");
        if (!userId) return;

        if (!groupId) {
            alert("Please create a club group before planning an event.");
            return;
        }

        // Prepare cover image
        const finalCover = customCoverUrl || coverPresets[selectedCover] || coverPresets["Match"];

        const eventData = {
            name,
            type,
            date,
            time: startTime && endTime ? `${startTime} - ${endTime}` : startTime,
            start_time: startTime,
            end_time: endTime,
            location,
            description,
            group_id: parseInt(groupId),
            owner_id: parseInt(userId),
            cover_image: finalCover,
            registration_deadline: registrationDeadline || null,
            max_participants: maxParticipants ? parseInt(maxParticipants) : null,
            fee: eventFee ? parseInt(eventFee) : 0,
            auto_reminder: autoReminder,
            attendance_tracking: attendanceTracking,
            is_public: isPublic,
            allow_guest: allowGuest,
            allow_waiting_list: allowWaitingList,
            rules_pdf: null,
            schedule_file: null,
            permission_forms: null,
            match_fixtures: null,
            event_posters: null,
        };

        try {
            const token = localStorage.getItem("accessToken");
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/events?owner_id=${userId}`, {
                method: "POST",
                headers,
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                router.push("/dashboard/events");
            } else {
                const err = await response.json();
                alert(`Error: ${err.detail || "Failed to create event"}`);
            }
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error sending request to server.");
        }
    };

    const currentBannerBackground = customCoverUrl
        ? `url(${customCoverUrl}) center/cover no-repeat`
        : coverPresets[selectedCover] || coverPresets["Match"];

    return (
        <div style={styles.pageContainer}>
            {/* Back Navigation Bar */}
            <div style={{ marginBottom: "24px" }}>
                <Link href="/dashboard/events" style={styles.backBtnLight}>
                    <ArrowLeft size={16} />
                    <span>Back to Events List</span>
                </Link>
            </div>

            {/* Main Form Container Card */}
            <div style={styles.mainCardLight}>
                {/* Header Title Section */}
                <div style={styles.headerBoxLight}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={styles.headerIconBoxLight}>
                            <PlusCircle size={24} />
                        </div>
                        <div>
                            <h1 style={styles.pageTitleLight}>Schedule New Club Event</h1>
                            <p style={styles.pageSubtitleLight}>
                                Fill out event details, choose a banner theme, and configure registration settings.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                    {/* SECTION 1: EVENT DETAILS & LOCATION */}
                    <div>
                        <div style={styles.sectionHeaderLight}>
                            <Activity size={16} style={{ color: "#059669" }} />
                            <span>1. Basic Event Details &amp; Location</span>
                        </div>

                        <div style={styles.formRowLight}>
                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Event Title / Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Annual Club Championship / Training Camp"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={styles.inputLight}
                                    required
                                />
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Target Club Group *</label>
                                <select
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value)}
                                    style={styles.selectLight}
                                    required
                                >
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.group_name} ({g.activity})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ ...styles.formRowLight, marginTop: "18px" }}>
                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Event Category *</label>
                                <select
                                    value={type}
                                    onChange={(e) => {
                                        setType(e.target.value);
                                        setSelectedCover(e.target.value);
                                    }}
                                    style={styles.selectLight}
                                    required
                                >
                                    <option value="Match">🏆 Match / Fixture</option>
                                    <option value="Training">🏋️ Training Session</option>
                                    <option value="Meeting">👥 Meeting</option>
                                    <option value="Social">🎉 Social Gathering</option>
                                    <option value="Tournament">🥇 Tournament</option>
                                    <option value="Ceremony">🎖️ Ceremony / Presentation</option>
                                </select>
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Event Date *</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={styles.inputLight}
                                    required
                                />
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Venue / Ground Location *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Main Turf Court A / Stadium"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    style={styles.inputLight}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ ...styles.formRowLight, marginTop: "18px" }}>
                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Start Time *</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={styles.inputLight}
                                    required
                                />
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>End Time *</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    style={styles.inputLight}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ ...styles.formGroupLight, marginTop: "18px" }}>
                            <label style={styles.labelLight}>Event Description &amp; Information</label>
                            <textarea
                                rows="4"
                                placeholder="Provide details about the matches, rules, equipment requirements, and expectations..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={styles.textareaLight}
                            />
                        </div>
                    </div>

                    {/* SECTION 2: COVER DESIGN & LIVE PREVIEW */}
                    <div>
                        <div style={styles.sectionHeaderLight}>
                            <ImageIcon size={16} style={{ color: "#059669" }} />
                            <span>2. Event Cover Banner Theme</span>
                        </div>

                        {/* Live Banner Preview Box */}
                        <div style={{ ...styles.livePreviewCardLight, background: currentBannerBackground }}>
                            <div style={styles.livePreviewContentLight}>
                                <span style={styles.liveBadgeLight}>{type.toUpperCase()}</span>
                                <h3 style={styles.liveTitleLight}>{name || "Event Title Preview"}</h3>
                                <div style={styles.liveMetaLight}>
                                    <span>📅 {date || "YYYY-MM-DD"} • {startTime || "00:00"}</span>
                                    <span>📍 {location || "Venue Location"}</span>
                                </div>
                            </div>
                        </div>

                        <label style={{ ...styles.labelLight, marginTop: "16px", display: "block" }}>
                            Select Preset Theme Cover
                        </label>
                        <div style={styles.coverGridLight}>
                            {Object.entries(coverPresets).map(([key, gradient]) => {
                                const isSelected = selectedCover === key && !customCoverUrl;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => {
                                            setSelectedCover(key);
                                            setCustomCoverUrl("");
                                        }}
                                        style={{
                                            ...styles.coverPresetCardLight,
                                            background: gradient,
                                            border: isSelected ? "2px solid #059669" : "2px solid transparent",
                                            boxShadow: isSelected ? "0 4px 14px rgba(5, 150, 105, 0.3)" : "none",
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <span style={styles.coverPresetTextLight}>{key}</span>
                                        {isSelected && (
                                            <div style={styles.coverCheckBadgeLight}>
                                                <CheckCircle2 size={14} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ ...styles.formGroupLight, marginTop: "16px" }}>
                            <label style={styles.labelLight}>Or Paste Custom Cover Image URL</label>
                            <input
                                type="url"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={customCoverUrl}
                                onChange={(e) => {
                                    setCustomCoverUrl(e.target.value);
                                    setSelectedCover("");
                                }}
                                style={styles.inputLight}
                            />
                        </div>
                    </div>

                    {/* SECTION 3: CAPACITY, PRICING & SETTINGS */}
                    <div>
                        <div style={styles.sectionHeaderLight}>
                            <Shield size={16} style={{ color: "#059669" }} />
                            <span>3. Capacity, Pricing &amp; Registration Rules</span>
                        </div>

                        <div style={styles.formRowLight}>
                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Registration Deadline</label>
                                <input
                                    type="date"
                                    value={registrationDeadline}
                                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                                    style={styles.inputLight}
                                />
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Maximum Participants</label>
                                <input
                                    type="number"
                                    placeholder="No limit (leave blank)"
                                    value={maxParticipants}
                                    onChange={(e) => setMaxParticipants(e.target.value)}
                                    style={styles.inputLight}
                                />
                            </div>

                            <div style={styles.formGroupLight}>
                                <label style={styles.labelLight}>Event Fee (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0 for free event"
                                    value={eventFee}
                                    onChange={(e) => setEventFee(e.target.value)}
                                    style={styles.inputLight}
                                />
                            </div>
                        </div>

                        {/* Interactive Toggle Cards */}
                        <div style={styles.toggleGridLight}>
                            <div
                                style={{
                                    ...styles.toggleCardLight,
                                    backgroundColor: autoReminder ? "#ecfdf5" : "#ffffff",
                                    borderColor: autoReminder ? "#a7f3d0" : "#e2e8f0",
                                }}
                                onClick={() => setAutoReminder(!autoReminder)}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={styles.toggleTextGroupLight}>
                                    <div style={styles.toggleTitleLight}>
                                        <Bell size={16} style={{ color: "#059669" }} />
                                        <span>Automatic Reminder</span>
                                    </div>
                                    <p style={styles.toggleSubLight}>Notify members before start time</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={autoReminder}
                                    onChange={(e) => setAutoReminder(e.target.checked)}
                                    style={styles.checkboxLight}
                                />
                            </div>

                            <div
                                style={{
                                    ...styles.toggleCardLight,
                                    backgroundColor: attendanceTracking ? "#ecfdf5" : "#ffffff",
                                    borderColor: attendanceTracking ? "#a7f3d0" : "#e2e8f0",
                                }}
                                onClick={() => setAttendanceTracking(!attendanceTracking)}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={styles.toggleTextGroupLight}>
                                    <div style={styles.toggleTitleLight}>
                                        <UserCheck size={16} style={{ color: "#059669" }} />
                                        <span>Attendance Tracking</span>
                                    </div>
                                    <p style={styles.toggleSubLight}>Enable event-day check-in panel</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={attendanceTracking}
                                    onChange={(e) => setAttendanceTracking(e.target.checked)}
                                    style={styles.checkboxLight}
                                />
                            </div>

                            <div
                                style={{
                                    ...styles.toggleCardLight,
                                    backgroundColor: isPublic ? "#ecfdf5" : "#ffffff",
                                    borderColor: isPublic ? "#a7f3d0" : "#e2e8f0",
                                }}
                                onClick={() => setIsPublic(!isPublic)}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={styles.toggleTextGroupLight}>
                                    <div style={styles.toggleTitleLight}>
                                        <Globe size={16} style={{ color: "#059669" }} />
                                        <span>Public Visibility</span>
                                    </div>
                                    <p style={styles.toggleSubLight}>Make visible outside club members</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    style={styles.checkboxLight}
                                />
                            </div>

                            <div
                                style={{
                                    ...styles.toggleCardLight,
                                    backgroundColor: allowGuest ? "#ecfdf5" : "#ffffff",
                                    borderColor: allowGuest ? "#a7f3d0" : "#e2e8f0",
                                }}
                                onClick={() => setAllowGuest(!allowGuest)}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={styles.toggleTextGroupLight}>
                                    <div style={styles.toggleTitleLight}>
                                        <UserPlus size={16} style={{ color: "#059669" }} />
                                        <span>Allow Guest Registration</span>
                                    </div>
                                    <p style={styles.toggleSubLight}>Allow non-members to sign up</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allowGuest}
                                    onChange={(e) => setAllowGuest(e.target.checked)}
                                    style={styles.checkboxLight}
                                />
                            </div>

                            <div
                                style={{
                                    ...styles.toggleCardLight,
                                    backgroundColor: allowWaitingList ? "#ecfdf5" : "#ffffff",
                                    borderColor: allowWaitingList ? "#a7f3d0" : "#e2e8f0",
                                }}
                                onClick={() => setAllowWaitingList(!allowWaitingList)}
                                role="button"
                                tabIndex={0}
                            >
                                <div style={styles.toggleTextGroupLight}>
                                    <div style={styles.toggleTitleLight}>
                                        <Hourglass size={16} style={{ color: "#059669" }} />
                                        <span>Allow Waiting List</span>
                                    </div>
                                    <p style={styles.toggleSubLight}>Queue members if event is full</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allowWaitingList}
                                    onChange={(e) => setAllowWaitingList(e.target.checked)}
                                    style={styles.checkboxLight}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer Bar */}
                    <div style={styles.actionFooterLight}>
                        <Link href="/dashboard/events" style={styles.cancelBtnLight}>
                            Cancel
                        </Link>
                        <button type="submit" style={styles.submitBtnLight}>
                            <PlusCircle size={18} />
                            <span>Save &amp; Publish Event</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Inline Style Definitions (Senior UI/UX Designer Skill)
const styles = {
    pageContainer: {
        maxWidth: "960px",
        margin: "0 auto",
        padding: "32px 20px 60px 20px",
        fontFamily: "'Outfit', sans-serif",
        color: "#0f172a",
    },
    backBtnLight: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "20px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        color: "#475569",
        fontWeight: "700",
        fontSize: "13px",
        textDecoration: "none",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    },
    mainCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
    },
    headerBoxLight: {
        marginBottom: "28px",
        paddingBottom: "20px",
        borderBottom: "1px solid #f1f5f9",
    },
    headerIconBoxLight: {
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: "#ecfdf5",
        color: "#059669",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #a7f3d0",
    },
    pageTitleLight: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
        letterSpacing: "-0.01em",
    },
    pageSubtitleLight: {
        fontSize: "13px",
        color: "#64748b",
        margin: "4px 0 0 0",
    },
    sectionHeaderLight: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#059669",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    formRowLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
    },
    formGroupLight: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: 1,
    },
    labelLight: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#0f172a",
    },
    inputLight: {
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
    selectLight: {
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
    textareaLight: {
        width: "100%",
        padding: "12px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        minHeight: "100px",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        resize: "vertical",
    },
    livePreviewCardLight: {
        width: "100%",
        minHeight: "140px",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        color: "#ffffff",
        boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "flex-end",
    },
    livePreviewContentLight: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    liveBadgeLight: {
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "0.05em",
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(6px)",
        padding: "2px 8px",
        borderRadius: "12px",
        width: "fit-content",
    },
    liveTitleLight: {
        fontSize: "20px",
        fontWeight: "800",
        margin: 0,
        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
    liveMetaLight: {
        display: "flex",
        gap: "14px",
        fontSize: "12px",
        opacity: 0.9,
    },
    coverGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
    },
    coverPresetCardLight: {
        height: "56px",
        borderRadius: "12px",
        padding: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
    },
    coverPresetTextLight: {
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "12px",
        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
    },
    coverCheckBadgeLight: {
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
    },
    toggleGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "14px",
        marginTop: "16px",
    },
    toggleCardLight: {
        border: "1px solid",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    toggleTextGroupLight: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    toggleTitleLight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: "700",
        color: "#0f172a",
    },
    toggleSubLight: {
        fontSize: "11px",
        color: "#64748b",
        margin: 0,
    },
    checkboxLight: {
        width: "18px",
        height: "18px",
        accentColor: "#059669",
        cursor: "pointer",
    },
    actionFooterLight: {
        marginTop: "12px",
        paddingTop: "24px",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "14px",
    },
    cancelBtnLight: {
        padding: "11px 22px",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        color: "#475569",
        fontWeight: "700",
        fontSize: "13px",
        textDecoration: "none",
        cursor: "pointer",
    },
    submitBtnLight: {
        padding: "12px 26px",
        borderRadius: "10px",
        border: "none",
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
        transition: "all 0.2s ease",
    },
};

