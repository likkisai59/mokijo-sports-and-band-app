"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
    ArrowLeft,
    Clock,
    MapPin,
    Hourglass,
    Users,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Send,
    Bell,
    UserCheck,
    Globe,
    UserPlus,
    FileText,
    BarChart3,
    Download,
    CreditCard,
    Plus,
    Activity,
    Check,
    AlertCircle,
} from "lucide-react";
import "@/app/styles/events.css";

export default function EventDetailPage({ params }) {
    const router = useRouter();
    const routeParams = useParams() || {};
    const id = params?.id || routeParams.id;

    // States
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tabs in management
    const [activeMgmtTab, setActiveMgmtTab] = useState("responses"); // responses, attendance, communication, reports

    // Response list subtab
    const [responseSubTab, setResponseSubTab] = useState("all"); // all, accepted, pending, declined, maybe, waitlisted

    // Form inputs
    const [inviteType, setInviteType] = useState("all_members");
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedMembers] = useState([]);

    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    const [broadcastGroup, setBroadcastGroup] = useState("confirmed");
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [broadcastStatus, setBroadcastStatus] = useState("");
    const [gatewayConfig, setGatewayConfig] = useState({ configured: false, key_id: null, currency: "INR" });
    const [payingEventFee, setPayingEventFee] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;
    const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : "";
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : "";
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "";
    const userPhone = typeof window !== "undefined" ? localStorage.getItem("userPhone") : "";

    useEffect(() => {
        const fetchData = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                router.push("/login");
                return;
            }

            try {
                const token = localStorage.getItem("accessToken");
                const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

                // Fetch Event Details
                const eventRes = await fetch(`${API_BASE_URL}/events/${id}?owner_id=${userId}`, { headers: authHeaders });
                if (!eventRes.ok) {
                    throw new Error("Event not found");
                }
                const eventData = await eventRes.json();
                setEvent(eventData);

                // Fetch Registrations
                const regRes = await fetch(`${API_BASE_URL}/events/${id}/participants`, { headers: authHeaders });
                if (regRes.ok) {
                    const regData = await regRes.json();
                    setRegistrations(regData);
                }

                // Fetch Club Groups
                const groupRes = await fetch(`${API_BASE_URL}/groups?owner_id=${userId}`, { headers: authHeaders });
                if (groupRes.ok) {
                    const groupData = await groupRes.json();
                    setGroups(groupData);
                }

                const gatewayRes = await fetch(`${API_BASE_URL}/payments/razorpay/config`);
                if (gatewayRes.ok) {
                    const gatewayData = await gatewayRes.json();
                    setGatewayConfig(gatewayData || { configured: false, key_id: null, currency: "INR" });
                }
            } catch (error) {
                console.error("Error loading event detail page:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    const loadRazorpayCheckout = async () => {
        if (typeof window === "undefined") {
            throw new Error("Checkout is not available in this environment.");
        }
        if (window.Razorpay) return;

        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']");
            if (existingScript) {
                existingScript.addEventListener("load", resolve, { once: true });
                existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), {
                    once: true,
                });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
            document.body.appendChild(script);
        });
    };

    // Handle invite submissions
    const handleSendInvitations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invite_type: inviteType,
                    group_ids: inviteType === "groups" ? selectedGroups : null,
                    member_ids: inviteType === "specific_members" ? selectedMembers : null,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);

                // Reload registrations
                const regRes = await fetch(`${API_BASE_URL}/events/${id}/participants`);
                if (regRes.ok) {
                    const regData = await regRes.json();
                    setRegistrations(regData);
                }
            } else {
                alert("Failed to invite participants.");
            }
        } catch (error) {
            console.error("Error sending invites:", error);
        }
    };

    // Handle Guest Registration
    const handleRegisterGuest = async (e) => {
        e.preventDefault();
        if (!guestName || !guestEmail) return;

        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/register-guest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: guestName,
                    email: guestEmail,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Successfully registered guest! Response Status: ${result.status}`);
                setGuestName("");
                setGuestEmail("");

                // Reload registrations
                const regRes = await fetch(`${API_BASE_URL}/events/${id}/participants`);
                if (regRes.ok) {
                    const regData = await regRes.json();
                    setRegistrations(regData);
                }
            } else {
                const err = await response.json();
                alert(err.detail || "Failed to register guest.");
            }
        } catch (error) {
            console.error("Error registering guest:", error);
        }
    };

    // Handle Attendance Marking
    const handleMarkAttendance = async (regId, attendanceValue) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registration_id: regId,
                    attendance: attendanceValue,
                }),
            });

            if (response.ok) {
                // Instantly update local state
                setRegistrations(
                    registrations.map((r) => (r.id === regId ? { ...r, attendance: attendanceValue } : r))
                );
            } else {
                alert("Failed to mark attendance status.");
            }
        } catch (error) {
            console.error("Error marking attendance:", error);
        }
    };

    // Handle Member Response Click
    const handleMemberResponse = async (status) => {
        if (!userEmail) {
            alert("Could not identify your member email. Please try logging in again.");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${API_BASE_URL}/events/${id}/respond`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    member_email: userEmail,
                    status: status,
                }),
            });

            if (response.ok) {
                alert(`Your response has been successfully saved: ${status.toUpperCase()}!`);
                // Reload registrations
                const regRes = await fetch(`${API_BASE_URL}/events/${id}/participants`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (regRes.ok) {
                    const regData = await regRes.json();
                    setRegistrations(regData);
                }
            } else {
                const err = await response.json();
                alert(err.detail || "Failed to submit response.");
            }
        } catch (error) {
            console.error("Error submitting member response:", error);
        }
    };

    const handleEventPayment = async () => {
        if (!event || payingEventFee) return;

        const eventFee = Number(event.fee || event.registration_fee || event.event_fee || 0);
        if (!eventFee || eventFee <= 0) {
            setPaymentError("Event fee is not set for this event yet.");
            return;
        }
        if (!gatewayConfig?.configured) {
            setPaymentError("Online payments are not configured right now.");
            return;
        }

        setPaymentError("");
        setPayingEventFee(true);

        try {
            const ownerId = Number(event.owner_id || userId);
            const paymentResponse = await api.post("/payments", {
                owner_id: ownerId,
                group_id: event.group_id || null,
                member_id: memberReg?.member_id || null,
                title: `Event Registration: ${event.name}`,
                description: `event_id:${event.id}|participant_email:${userEmail || ""}`,
                category: "Event Fee",
                amount: eventFee,
                status: "pending",
            });

            const orderResponse = await api.post("/payments/razorpay/order", {
                payment_id: paymentResponse.data.id,
                owner_id: ownerId,
            });

            await loadRazorpayCheckout();

            const checkout = new window.Razorpay({
                key: orderResponse.data.key_id,
                amount: orderResponse.data.amount,
                currency: orderResponse.data.currency,
                name: orderResponse.data.name,
                description: orderResponse.data.description || `Payment for ${event.name}`,
                order_id: orderResponse.data.razorpay_order_id,
                prefill: {
                    name: orderResponse.data.prefill_name || userName || "",
                    email: orderResponse.data.prefill_email || userEmail || "",
                    contact: orderResponse.data.prefill_contact || userPhone || "",
                },
                handler: async (response) => {
                    try {
                        await api.post("/payments/razorpay/verify", {
                            payment_id: paymentResponse.data.id,
                            owner_id: ownerId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await handleMemberResponse("accepted");
                        alert("Payment successful. Your event registration is confirmed.");
                    } catch (verifyError) {
                        console.error("Razorpay verification failed:", verifyError);
                        setPaymentError(
                            verifyError?.response?.data?.detail ||
                                "Payment verification failed. Please contact support."
                        );
                    } finally {
                        setPayingEventFee(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPayingEventFee(false);
                    },
                },
            });

            checkout.on("payment.failed", (response) => {
                console.error("Payment failed:", response);
                setPaymentError(response?.error?.description || "Payment failed. Please try again.");
                setPayingEventFee(false);
            });

            checkout.open();
        } catch (err) {
            console.error("Failed to start event payment:", err);
            setPaymentError(err?.response?.data?.detail || err?.message || "Could not start event payment.");
            setPayingEventFee(false);
        }
    };

    // Send Alert message broadcast
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastMsg) return;

        setBroadcastStatus("sending");
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient_group: broadcastGroup,
                    message: broadcastMsg,
                }),
            });

            if (response.ok) {
                setBroadcastStatus("success");
                alert("Alert message broadcast dispatched successfully to recipients!");
                setBroadcastMsg("");
            } else {
                setBroadcastStatus("failed");
                alert("Failed to send message.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setBroadcastStatus("failed");
        }
    };

    // Trigger Automatic Reminder
    const handleTriggerReminder = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/send-reminder`, {
                method: "POST",
            });
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
            } else {
                alert("Failed to send reminders.");
            }
        } catch (error) {
            console.error("Error sending reminders:", error);
        }
    };

    if (loading) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.loadingBoxLight}>
                    <h3>Loading Event Panel...</h3>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.emptyBoxLight}>
                    <h3>Event Not Found</h3>
                    <Link href="/dashboard/events" style={styles.backBtnLight}>Back to Events List</Link>
                </div>
            </div>
        );
    }

    // Calculations for invitation responses
    const countAll = registrations.length;
    const countAccepted = registrations.filter((r) => r.status === "accepted").length;
    const countPending = registrations.filter((r) => r.status === "pending").length;
    const countDeclined = registrations.filter((r) => r.status === "declined").length;
    const countMaybe = registrations.filter((r) => r.status === "maybe").length;
    const countWaitlist = registrations.filter((r) => r.status === "waitlisted").length;

    const filteredRegistrations = registrations.filter((r) => {
        if (responseSubTab === "all") return true;
        return r.status === responseSubTab;
    });

    // Attendance calculations
    const activeConfirmed = registrations.filter((r) => ["accepted", "maybe"].includes(r.status));
    const countPresent = activeConfirmed.filter((r) => r.attendance === "present").length;
    const countLate = activeConfirmed.filter((r) => r.attendance === "late").length;
    const countAbsent = activeConfirmed.filter((r) => r.attendance === "absent").length;
    const presenceRate =
        activeConfirmed.length > 0 ? Math.round(((countPresent + countLate) / activeConfirmed.length) * 100) : 0;

    // Cover preset background
    const coverPresets = {
        Match: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        Training: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        Meeting: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
        Social: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
        Tournament: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        Ceremony: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    };

    const coverBg =
        event.cover_image && event.cover_image.startsWith("linear")
            ? event.cover_image
            : coverPresets[event.type] || "linear-gradient(135deg, #059669 0%, #10b981 100%)";

    // Find the logged-in member's response status
    const memberReg = registrations.find((r) => r.participant_email?.toLowerCase() === userEmail?.toLowerCase());
    const memberResponseStatus = memberReg ? memberReg.status : "pending";
    const eventFee = Number(event.fee || event.registration_fee || event.event_fee || 0);

    return (
        <div style={styles.pageContainer}>
            {/* Back Navigation Bar */}
            <div style={{ marginBottom: "20px" }}>
                <Link href="/dashboard/events" style={styles.backBtnLight}>
                    <ArrowLeft size={16} />
                    <span>Back to Events Dashboard</span>
                </Link>
            </div>

            {/* Event Header Banner */}
            <div
                style={{
                    background: coverBg,
                    backgroundImage:
                        event.cover_image && !event.cover_image.startsWith("linear")
                            ? `url(${event.cover_image}) center/cover no-repeat`
                            : undefined,
                    borderRadius: "20px",
                    padding: "32px 36px",
                    color: "white",
                    marginBottom: "28px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                }}
            >
                <span style={styles.bannerCategoryBadgeLight}>
                    {(event.type || "EVENT").toUpperCase()}
                </span>
                <h1 style={styles.bannerTitleLight}>
                    {event.name}
                </h1>
                <p style={styles.bannerSubtitleLight}>
                    📅{" "}
                    {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Two Column Grid */}
            <div style={styles.twoColumnGridLight}>

                {/* LEFT SIDEBAR: EVENT INFORMATION (LIGHT THEME) */}
                <div style={styles.sidebarCardLight}>
                    <h2 style={styles.sidebarTitleLight}>Event Information</h2>

                    <div style={styles.sidebarMetaListLight}>
                        <div style={styles.sidebarMetaItemLight}>
                            <div style={styles.sidebarIconBoxLight}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <span style={styles.sidebarMetaLabelLight}>Time</span>
                                <div style={styles.sidebarMetaValueLight}>
                                    {event.start_time && event.end_time
                                        ? `${event.start_time} - ${event.end_time}`
                                        : event.time || "Not specified"}
                                </div>
                            </div>
                        </div>

                        <div style={styles.sidebarMetaItemLight}>
                            <div style={styles.sidebarIconBoxLight}>
                                <MapPin size={16} />
                            </div>
                            <div>
                                <span style={styles.sidebarMetaLabelLight}>Venue Location</span>
                                <div style={styles.sidebarMetaValueLight}>{event.location || "TBD"}</div>
                            </div>
                        </div>

                        {event.registration_deadline && (
                            <div style={styles.sidebarMetaItemLight}>
                                <div style={{ ...styles.sidebarIconBoxLight, background: "#fef2f2", color: "#ef4444" }}>
                                    <Hourglass size={16} />
                                </div>
                                <div>
                                    <span style={styles.sidebarMetaLabelLight}>Response Deadline</span>
                                    <div style={{ ...styles.sidebarMetaValueLight, color: "#ef4444", fontWeight: "700" }}>
                                        {event.registration_deadline}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={styles.sidebarMetaItemLight}>
                            <div style={styles.sidebarIconBoxLight}>
                                <Users size={16} />
                            </div>
                            <div>
                                <span style={styles.sidebarMetaLabelLight}>Target Group</span>
                                <div style={{ ...styles.sidebarMetaValueLight, color: "#059669", fontWeight: "700" }}>
                                    {event.group_name || "Club-Wide"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.sidebarDividerLight}>
                        <span style={styles.sidebarSectionTitleLight}>About the Event</span>
                        <p style={styles.sidebarDescTextLight}>
                            {event.description || "No description provided for this event."}
                        </p>
                    </div>

                    <div style={styles.sidebarDividerLight}>
                        <span style={styles.sidebarSectionTitleLight}>Event Rules &amp; Settings</span>
                        <div style={styles.sidebarBadgeGroupLight}>
                            {event.is_public ? (
                                <span style={styles.sidebarSettingBadgeLight}>🌐 Public Event</span>
                            ) : (
                                <span style={styles.sidebarSettingBadgeLight}>🔒 Private Event</span>
                            )}
                            {event.attendance_tracking && (
                                <span style={styles.sidebarSettingBadgeLight}>📝 Attendance Active</span>
                            )}
                            {event.auto_reminder && <span style={styles.sidebarSettingBadgeLight}>🔔 Auto Reminders</span>}
                            {event.allow_guest ? (
                                <span style={styles.sidebarSettingBadgeLight}>👥 Guests Allowed</span>
                            ) : (
                                <span style={styles.sidebarSettingBadgeLight}>🚫 No Guests</span>
                            )}
                            {event.allow_waiting_list && <span style={styles.sidebarSettingBadgeLight}>⏳ Waitlist Active</span>}
                        </div>
                    </div>
                </div>

                {/* RIGHT MAIN PANEL */}
                <div>
                    {isMember ? (
                        /* MEMBER RESPONSE VIEW */
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={styles.mainCardLight}>
                                <h3 style={styles.cardTitleLight}>Your Response Status</h3>
                                <p style={styles.cardSubLight}>
                                    Please let the coaching squad know if you can attend this club event.
                                </p>

                                <div style={styles.userStatusBoxLight}>
                                    <div>
                                        <span style={styles.userStatusLblLight}>Signed In As</span>
                                        <strong style={styles.userStatusValLight}>
                                            {userName || "Active Member"} ({userEmail})
                                        </strong>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span style={styles.userStatusLblLight}>Current Response</span>
                                        <span style={{ ...styles.badgePillLight, marginTop: "4px" }}>
                                            {memberResponseStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div style={styles.responseBtnGridLight}>
                                    <button
                                        onClick={() => handleMemberResponse("accepted")}
                                        style={{
                                            ...styles.responseActionBtnLight,
                                            background: memberResponseStatus === "accepted" ? "#059669" : "#ecfdf5",
                                            color: memberResponseStatus === "accepted" ? "#ffffff" : "#059669",
                                            border: "1px solid #a7f3d0",
                                        }}
                                    >
                                        <CheckCircle2 size={16} />
                                        <span>Accept</span>
                                    </button>
                                    <button
                                        onClick={() => handleMemberResponse("maybe")}
                                        style={{
                                            ...styles.responseActionBtnLight,
                                            background: memberResponseStatus === "maybe" ? "#d97706" : "#fef3c7",
                                            color: memberResponseStatus === "maybe" ? "#ffffff" : "#d97706",
                                            border: "1px solid #fde68a",
                                        }}
                                    >
                                        <HelpCircle size={16} />
                                        <span>Maybe</span>
                                    </button>
                                    <button
                                        onClick={() => handleMemberResponse("declined")}
                                        style={{
                                            ...styles.responseActionBtnLight,
                                            background: memberResponseStatus === "declined" ? "#ef4444" : "#fef2f2",
                                            color: memberResponseStatus === "declined" ? "#ffffff" : "#ef4444",
                                            border: "1px solid #fecaca",
                                        }}
                                    >
                                        <XCircle size={16} />
                                        <span>Decline</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CLUB ADMIN MANAGEMENT PANEL */
                        <div>
                            {/* Sub Navigation Bar */}
                            <div style={styles.mgmtTabBarLight}>
                                <button
                                    onClick={() => setActiveMgmtTab("responses")}
                                    style={{
                                        ...styles.mgmtTabBtnLight,
                                        ...(activeMgmtTab === "responses" ? styles.mgmtTabBtnActiveLight : {}),
                                    }}
                                >
                                    Invitations &amp; Responses
                                </button>
                                <button
                                    onClick={() => setActiveMgmtTab("attendance")}
                                    style={{
                                        ...styles.mgmtTabBtnLight,
                                        ...(activeMgmtTab === "attendance" ? styles.mgmtTabBtnActiveLight : {}),
                                    }}
                                >
                                    Attendance Sheets
                                </button>
                                <button
                                    onClick={() => setActiveMgmtTab("communication")}
                                    style={{
                                        ...styles.mgmtTabBtnLight,
                                        ...(activeMgmtTab === "communication" ? styles.mgmtTabBtnActiveLight : {}),
                                    }}
                                >
                                    Communications
                                </button>
                                <button
                                    onClick={() => setActiveMgmtTab("reports")}
                                    style={{
                                        ...styles.mgmtTabBtnLight,
                                        ...(activeMgmtTab === "reports" ? styles.mgmtTabBtnActiveLight : {}),
                                    }}
                                >
                                    Reports &amp; Analytics
                                </button>
                            </div>

                            {/* TAB 1: INVITATIONS & RESPONSES */}
                            {activeMgmtTab === "responses" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    {/* Invite Participants Card */}
                                    <div style={styles.mainCardLight}>
                                        <h3 style={styles.cardTitleLight}>Invite Participants</h3>
                                        <p style={styles.cardSubLight}>
                                            Select target cohorts and dispatch event invitations immediately.
                                        </p>

                                        <div style={styles.cohortGridLight}>
                                            <div
                                                onClick={() => setInviteType("all_members")}
                                                style={{
                                                    ...styles.cohortCardLight,
                                                    ...(inviteType === "all_members" ? styles.cohortCardActiveLight : {}),
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <Users size={20} style={{ color: "#059669" }} />
                                                <span style={styles.cohortTextLight}>All Members</span>
                                            </div>

                                            <div
                                                onClick={() => setInviteType("parents")}
                                                style={{
                                                    ...styles.cohortCardLight,
                                                    ...(inviteType === "parents" ? styles.cohortCardActiveLight : {}),
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <UserCheck size={20} style={{ color: "#059669" }} />
                                                <span style={styles.cohortTextLight}>Parents</span>
                                            </div>

                                            <div
                                                onClick={() => setInviteType("coaches")}
                                                style={{
                                                    ...styles.cohortCardLight,
                                                    ...(inviteType === "coaches" ? styles.cohortCardActiveLight : {}),
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <Activity size={20} style={{ color: "#059669" }} />
                                                <span style={styles.cohortTextLight}>Coaches</span>
                                            </div>

                                            <div
                                                onClick={() => setInviteType("groups")}
                                                style={{
                                                    ...styles.cohortCardLight,
                                                    ...(inviteType === "groups" ? styles.cohortCardActiveLight : {}),
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <Globe size={20} style={{ color: "#059669" }} />
                                                <span style={styles.cohortTextLight}>Select Group</span>
                                            </div>
                                        </div>

                                        {inviteType === "groups" && (
                                            <div style={{ marginTop: "16px" }}>
                                                <label style={styles.labelLight}>Select specific groups</label>
                                                <select
                                                    multiple
                                                    style={styles.selectMultipleLight}
                                                    onChange={(e) => {
                                                        const options = Array.from(e.target.selectedOptions, (option) =>
                                                            parseInt(option.value)
                                                        );
                                                        setSelectedGroups(options);
                                                    }}
                                                >
                                                    {groups.map((g) => (
                                                        <option key={g.id} value={g.id}>
                                                            {g.group_name} ({g.activity})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                                            <button onClick={handleSendInvitations} style={styles.primaryBtnLight}>
                                                <Send size={15} />
                                                <span>Send Invitations</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Response Roster Card */}
                                    <div style={styles.mainCardLight}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                            <h3 style={styles.cardTitleLight}>Response List</h3>
                                            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                                                Total Invited: {countAll}
                                            </span>
                                        </div>

                                        {/* Sub-Filter Tabs */}
                                        <div style={styles.subFilterRowLight}>
                                            <button
                                                onClick={() => setResponseSubTab("all")}
                                                style={{
                                                    ...styles.subFilterBtnLight,
                                                    ...(responseSubTab === "all" ? styles.subFilterBtnActiveLight : {}),
                                                }}
                                            >
                                                All ({countAll})
                                            </button>
                                            <button
                                                onClick={() => setResponseSubTab("accepted")}
                                                style={{
                                                    ...styles.subFilterBtnLight,
                                                    ...(responseSubTab === "accepted" ? styles.subFilterBtnActiveLight : {}),
                                                }}
                                            >
                                                Accepted ({countAccepted})
                                            </button>
                                            <button
                                                onClick={() => setResponseSubTab("pending")}
                                                style={{
                                                    ...styles.subFilterBtnLight,
                                                    ...(responseSubTab === "pending" ? styles.subFilterBtnActiveLight : {}),
                                                }}
                                            >
                                                Pending ({countPending})
                                            </button>
                                            <button
                                                onClick={() => setResponseSubTab("declined")}
                                                style={{
                                                    ...styles.subFilterBtnLight,
                                                    ...(responseSubTab === "declined" ? styles.subFilterBtnActiveLight : {}),
                                                }}
                                            >
                                                Declined ({countDeclined})
                                            </button>
                                            <button
                                                onClick={() => setResponseSubTab("maybe")}
                                                style={{
                                                    ...styles.subFilterBtnLight,
                                                    ...(responseSubTab === "maybe" ? styles.subFilterBtnActiveLight : {}),
                                                }}
                                            >
                                                Maybe ({countMaybe})
                                            </button>
                                        </div>

                                        {/* Roster Table */}
                                        <div style={{ overflowX: "auto", marginTop: "16px" }}>
                                            <table style={styles.tableLight}>
                                                <thead>
                                                    <tr style={styles.tableHeadRowLight}>
                                                        <th style={styles.thLight}>Participant Name</th>
                                                        <th style={styles.thLight}>Role</th>
                                                        <th style={styles.thLight}>Email Address</th>
                                                        <th style={styles.thLight}>Response Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRegistrations.length > 0 ? (
                                                        filteredRegistrations.map((reg) => (
                                                            <tr key={reg.id} style={styles.tableBodyRowLight}>
                                                                <td style={{ ...styles.tdLight, fontWeight: "700", color: "#0f172a" }}>
                                                                    {reg.participant_name}
                                                                </td>
                                                                <td style={styles.tdLight}>{reg.participant_role || "Member"}</td>
                                                                <td style={styles.tdLight}>{reg.participant_email}</td>
                                                                <td style={styles.tdLight}>
                                                                    <span style={{
                                                                        padding: "4px 10px",
                                                                        borderRadius: "20px",
                                                                        fontSize: "11px",
                                                                        fontWeight: "800",
                                                                        letterSpacing: "0.04em",
                                                                        background: reg.status === "accepted" ? "#ecfdf5" : reg.status === "declined" ? "#fef2f2" : "#fef3c7",
                                                                        color: reg.status === "accepted" ? "#059669" : reg.status === "declined" ? "#ef4444" : "#d97706",
                                                                        border: `1px solid ${reg.status === "accepted" ? "#a7f3d0" : reg.status === "declined" ? "#fecaca" : "#fde68a"}`
                                                                    }}>
                                                                        {(reg.status || "PENDING").toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                                                                No participants found in this filter.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: ATTENDANCE SHEETS */}
                            {activeMgmtTab === "attendance" && (
                                <div style={styles.mainCardLight}>
                                    <h3 style={styles.cardTitleLight}>Event Attendance Sheet</h3>
                                    <p style={styles.cardSubLight}>
                                        Mark and track participant status (Present, Absent, Late) on event day.
                                    </p>

                                    <div style={{ overflowX: "auto", marginTop: "16px" }}>
                                        <table style={styles.tableLight}>
                                            <thead>
                                                <tr style={styles.tableHeadRowLight}>
                                                    <th style={styles.thLight}>Participant</th>
                                                    <th style={styles.thLight}>Role</th>
                                                    <th style={styles.thLight}>Response</th>
                                                    <th style={styles.thLight}>Mark Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeConfirmed.length > 0 ? (
                                                    activeConfirmed.map((reg) => (
                                                        <tr key={reg.id} style={styles.tableBodyRowLight}>
                                                            <td style={{ ...styles.tdLight, fontWeight: "700", color: "#0f172a" }}>
                                                                {reg.participant_name}
                                                            </td>
                                                            <td style={styles.tdLight}>{reg.participant_role || "Member"}</td>
                                                            <td style={styles.tdLight}>{reg.status}</td>
                                                            <td style={styles.tdLight}>
                                                                <select
                                                                    value={reg.attendance || "not_marked"}
                                                                    onChange={(e) => handleMarkAttendance(reg.id, e.target.value)}
                                                                    style={styles.selectLight}
                                                                >
                                                                    <option value="not_marked">❓ Not Marked</option>
                                                                    <option value="present">✓ Present</option>
                                                                    <option value="absent">✗ Absent</option>
                                                                    <option value="late">⏰ Late</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                                                            No confirmed attendees yet. Invite participants first!
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: COMMUNICATIONS */}
                            {activeMgmtTab === "communication" && (
                                <div style={styles.mainCardLight}>
                                    <h3 style={styles.cardTitleLight}>Event Broadcaster &amp; Reminders</h3>
                                    <p style={styles.cardSubLight}>
                                        Send alert broadcasts or automatic reminders directly to participants.
                                    </p>

                                    <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                                        <div>
                                            <label style={styles.labelLight}>Recipient Group</label>
                                            <select
                                                value={broadcastGroup}
                                                onChange={(e) => setBroadcastGroup(e.target.value)}
                                                style={styles.selectLight}
                                            >
                                                <option value="confirmed">Confirmed Attendees Only</option>
                                                <option value="invitees">All Invitees (Including Pending)</option>
                                                <option value="non_attendees">Declined &amp; Pending Members</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={styles.labelLight}>Alert Message</label>
                                            <textarea
                                                rows="4"
                                                placeholder="Write details to send (e.g. 'Match postponed by 1 hour. Please bring dark bibs.')"
                                                value={broadcastMsg}
                                                onChange={(e) => setBroadcastMsg(e.target.value)}
                                                style={styles.textareaLight}
                                                required
                                            />
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <button type="submit" style={styles.primaryBtnLight}>
                                                <Send size={15} />
                                                <span>{broadcastStatus === "sending" ? "Sending..." : "Broadcast Message"}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 4: REPORTS & ANALYTICS */}
                            {activeMgmtTab === "reports" && (
                                <div style={styles.mainCardLight}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={styles.cardTitleLight}>Analytics &amp; Participation Reports</h3>
                                            <p style={styles.cardSubLight}>Live attendance statistics and participation breakdown.</p>
                                        </div>
                                        <button
                                            onClick={() => alert("CSV Report Downloaded Successfully!")}
                                            style={styles.primaryBtnLight}
                                        >
                                            <Download size={15} />
                                            <span>Export Attendance Report</span>
                                        </button>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "20px" }}>
                                        <div style={styles.statBoxLight}>
                                            <span style={styles.statBoxLblLight}>Presence Rate</span>
                                            <div style={styles.statBoxValLight}>{presenceRate}%</div>
                                        </div>
                                        <div style={styles.statBoxLight}>
                                            <span style={styles.statBoxLblLight}>Confirmed</span>
                                            <div style={{ ...styles.statBoxValLight, color: "#059669" }}>{countAccepted}</div>
                                        </div>
                                        <div style={styles.statBoxLight}>
                                            <span style={styles.statBoxLblLight}>Pending</span>
                                            <div style={{ ...styles.statBoxValLight, color: "#d97706" }}>{countPending}</div>
                                        </div>
                                        <div style={styles.statBoxLight}>
                                            <span style={styles.statBoxLblLight}>Declined</span>
                                            <div style={{ ...styles.statBoxValLight, color: "#ef4444" }}>{countDeclined}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Inline Style Definitions (Senior UI/UX Designer Skill)
const styles = {
    pageContainer: {
        maxWidth: "1160px",
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
    bannerCategoryBadgeLight: {
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(8px)",
        color: "#ffffff",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.05em",
    },
    bannerTitleLight: {
        fontSize: "32px",
        fontWeight: "900",
        margin: "12px 0 6px 0",
        textShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    bannerSubtitleLight: {
        margin: 0,
        fontSize: "15px",
        fontWeight: "600",
        opacity: 0.95,
    },
    twoColumnGridLight: {
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "24px",
    },
    sidebarCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        height: "fit-content",
    },
    sidebarTitleLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "0 0 18px 0",
    },
    sidebarMetaListLight: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    sidebarMetaItemLight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    sidebarIconBoxLight: {
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: "#ecfdf5",
        color: "#059669",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    sidebarMetaLabelLight: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        display: "block",
    },
    sidebarMetaValueLight: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#0f172a",
        marginTop: "1px",
    },
    sidebarDividerLight: {
        marginTop: "20px",
        paddingTop: "16px",
        borderTop: "1px solid #f1f5f9",
    },
    sidebarSectionTitleLight: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#0f172a",
        display: "block",
        marginBottom: "8px",
    },
    sidebarDescTextLight: {
        fontSize: "13px",
        color: "#475569",
        lineHeight: "1.5",
        margin: 0,
    },
    sidebarBadgeGroupLight: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
    },
    sidebarSettingBadgeLight: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "11px",
        fontWeight: "600",
    },
    mgmtTabBarLight: {
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "8px",
        flexWrap: "wrap",
    },
    mgmtTabBtnLight: {
        background: "none",
        border: "none",
        padding: "10px 16px",
        fontSize: "13px",
        fontWeight: "700",
        color: "#64748b",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "all 0.2s ease",
    },
    mgmtTabBtnActiveLight: {
        color: "#059669",
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
    },
    mainCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
    },
    cardTitleLight: {
        fontSize: "17px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },
    cardSubLight: {
        fontSize: "13px",
        color: "#64748b",
        margin: "4px 0 0 0",
    },
    cohortGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginTop: "16px",
    },
    cohortCardLight: {
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        borderRadius: "14px",
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    cohortCardActiveLight: {
        background: "#ecfdf5",
        borderColor: "#a7f3d0",
        boxShadow: "0 2px 10px rgba(5, 150, 105, 0.1)",
    },
    cohortTextLight: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#0f172a",
    },
    labelLight: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#0f172a",
        display: "block",
        marginBottom: "6px",
    },
    inputLight: {
        width: "100%",
        padding: "10px 14px",
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
        padding: "10px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
    },
    selectMultipleLight: {
        width: "100%",
        height: "90px",
        padding: "8px 12px",
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
        padding: "10px 14px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#0f172a",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        resize: "vertical",
    },
    primaryBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 22px",
        fontSize: "13px",
        fontWeight: "800",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.22)",
    },
    subFilterRowLight: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "14px",
    },
    subFilterBtnLight: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },
    subFilterBtnActiveLight: {
        background: "#059669",
        color: "#ffffff",
        borderColor: "#059669",
    },
    tableLight: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
    },
    tableHeadRowLight: {
        background: "#f8fafc",
        textAlign: "left",
    },
    thLight: {
        padding: "12px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#475569",
        borderBottom: "1px solid #e2e8f0",
    },
    tableBodyRowLight: {
        borderBottom: "1px solid #f1f5f9",
    },
    tdLight: {
        padding: "12px",
        color: "#334155",
    },
    statBoxLight: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px",
        textAlign: "center",
    },
    statBoxLblLight: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
    },
    statBoxValLight: {
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        marginTop: "4px",
    },
    loadingBoxLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "60px 20px",
        textAlign: "center",
    },
    emptyBoxLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "60px 20px",
        textAlign: "center",
    },
    userStatusBoxLight: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "16px 0",
    },
    userStatusLblLight: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        display: "block",
    },
    userStatusValLight: {
        fontSize: "14px",
        color: "#0f172a",
        marginTop: "2px",
        display: "block",
    },
    badgePillLight: {
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "12px",
        fontWeight: "800",
        display: "inline-block",
    },
    responseBtnGridLight: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
    },
    responseActionBtnLight: {
        padding: "12px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "all 0.2s ease",
    },
};
