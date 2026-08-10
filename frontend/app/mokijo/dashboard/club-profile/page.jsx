"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { User, Lock, Save, AlertCircle, CheckCircle2, ShieldCheck, Mail, Phone, Key, Building2, MapPin, Users, Trophy, HelpCircle, FileText } from "lucide-react";
import { countries, getStatesForCountry, indianStates, sportsOptions, memberOptions, hearAboutOptions } from "@/components/register/constants";
import "@/app/styles/profile.css";

export default function ClubAdminProfilePage() {
    const router = useRouter();

    // Form state — Registration details
    const [clubName, setClubName] = useState("");
    const [clubLogo, setClubLogo] = useState("");
    const [clubId, setClubId] = useState("");
    const [country, setCountry] = useState("India");
    const [state, setState] = useState("");
    const [memberCount, setMemberCount] = useState("");
    const [sport, setSport] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [aadharNumber, setAadharNumber] = useState("");
    const [hearAbout, setHearAbout] = useState("");
    const [password, setPassword] = useState("");
    const [approvalStatus, setApprovalStatus] = useState("");

    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    const availableStates = getStatesForCountry(country) || indianStates;

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setError("No admin session found. Please sign in as a club administrator.");
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
                const res = await fetch(`${API_BASE_URL}/profile/club-admin/${userId}`, {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setClubName(data.club_name || "");
                    setClubLogo(data.club_logo || "");
                    setClubId(data.club_id || "");
                    setCountry(data.country || "India");
                    setState(data.state || "");
                    setMemberCount(data.member_count || "");
                    setSport(data.sport || "");
                    setFirstName(data.first_name || "");
                    setLastName(data.last_name || "");
                    setEmail(data.email || "");
                    setPhone(data.phone || "");
                    setAadharNumber(data.aadhar_number || "");
                    setHearAbout(data.hear_about || "");
                    setApprovalStatus(data.approval_status || "APPROVED");
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setError(errData.detail || "Failed to load club profile.");
                }
            } catch (err) {
                console.error("Error fetching club profile:", err);
                setError("Unable to connect to server. Please check backend connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!firstName.trim()) {
            alert("First name is required.");
            return;
        }
        if (!clubName.trim()) {
            alert("Club name is required.");
            return;
        }

        const userId = localStorage.getItem("userId");
        if (!userId) {
            setError("No admin session found.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setShowSuccess(false);

        const payload = {
            club_name: clubName,
            club_logo: clubLogo,
            country: country,
            state: state,
            member_count: memberCount,
            sport: sport,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            hear_about: hearAbout,
        };

        if (password.trim()) {
            payload.password = password.trim();
        }

        try {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/profile/club-admin/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                setClubName(updated.club_name || "");
                setClubId(updated.club_id || "");
                setCountry(updated.country || "India");
                setState(updated.state || "");
                setMemberCount(updated.member_count || "");
                setSport(updated.sport || "");
                setFirstName(updated.first_name || "");
                setLastName(updated.last_name || "");
                setEmail(updated.email || "");
                setPhone(updated.phone || "");
                setAadharNumber(updated.aadhar_number || "");
                setHearAbout(updated.hear_about || "");
                setPassword("");

                // Sync localStorage & dispatch storage event for TopHeader
                const fullNewName = `${updated.first_name} ${updated.last_name}`.trim();
                localStorage.setItem("userName", fullNewName || "Admin");
                localStorage.setItem("clubName", updated.club_name);
                if (updated.club_logo) {
                    localStorage.setItem("clubLogo", updated.club_logo);
                } else {
                    localStorage.removeItem("clubLogo");
                }
                window.dispatchEvent(new Event("storage"));

                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.detail || "Failed to update club profile.");
            }
        } catch (err) {
            console.error("Error updating club profile:", err);
            setError("Could not update club profile. Server connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "A";

    if (loading) {
        return (
            <div className="profile-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ color: "#64748b" }}>Loading club profile details...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Header Banner */}
            <div className="profile-header-banner" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0" }}>
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt="Club Logo"
                        className="profile-avatar-lg"
                        style={{ objectFit: "cover", border: "2px solid #10b981" }}
                    />
                ) : (
                    <div className="profile-avatar-lg" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>{initials}</div>
                )}
                <div className="profile-title-area">
                    <h1 style={{ color: "#0f172a" }}>{clubName || "Club Administrator Profile"}</h1>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <span className="profile-role-badge" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>
                            <ShieldCheck size={14} /> Club Administrator
                        </span>
                        {clubId && (
                            <span className="profile-role-badge" style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569" }}>
                                Club ID: {clubId}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {showSuccess && (
                <div className="alert-message alert-success" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
                    <CheckCircle2 size={18} />
                    <span>Club profile details updated successfully!</span>
                </div>
            )}

            {error && (
                <div className="alert-message alert-error" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Single Unified Profile Card */}
                <div className="profile-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    {/* Section 1: Club Organization Details */}
                    <h2 className="profile-card-title" style={{ color: "#0f172a", borderBottom: "1px solid #f1f5f9" }}>
                        <Building2 size={18} style={{ color: "#10b981" }} />
                        <span>Club Organization Details</span>
                    </h2>

                    {/* Logo Upload Box */}
                    <div style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        {clubLogo ? (
                            <img src={clubLogo} alt="Club Logo" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #10b981" }} />
                        ) : (
                            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", color: "#047857", fontWeight: "900", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: "20px", border: "1px solid #a7f3d0" }}>
                                {clubName ? clubName.charAt(0).toUpperCase() : "📷"}
                            </div>
                        )}
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                                Upload Club Logo / Profile Picture
                            </label>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) {
                                                alert("Image size should be under 2MB");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => setClubLogo(reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    style={{ fontSize: "12px", color: "#475569" }}
                                />
                                {clubLogo && (
                                    <button
                                        type="button"
                                        onClick={() => setClubLogo("")}
                                        style={{ fontSize: "12px", padding: "4px 8px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer" }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-grid-2" style={{ marginBottom: "32px" }}>
                        {/* Club Name */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Club Name</span>
                            </label>
                            <input
                                type="text"
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                placeholder="Enter Club Name"
                                required
                            />
                        </div>

                        {/* Club ID (Read-only) */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>System Club ID</span>
                                <span className="lock-badge"><Lock size={10} /> Fixed</span>
                            </label>
                            <input
                                type="text"
                                className="profile-input profile-input-readonly"
                                style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
                                value={clubId}
                                readOnly
                            />
                        </div>

                        {/* Country Dropdown */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Country</span>
                            </label>
                            <select
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={country}
                                onChange={(e) => {
                                    setCountry(e.target.value);
                                    const states = getStatesForCountry(e.target.value);
                                    if (states && states.length > 0) {
                                        setState(states[0]);
                                    } else {
                                        setState("");
                                    }
                                }}
                            >
                                <option value="">Select Country</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* State Dropdown / Input */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>State / Region</span>
                            </label>
                            {availableStates && availableStates.length > 0 ? (
                                <select
                                    className="profile-input"
                                    style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {availableStates.map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="profile-input"
                                    style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="Enter State"
                                />
                            )}
                        </div>

                        {/* Member Count Dropdown */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Expected Member Count</span>
                            </label>
                            <select
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={memberCount}
                                onChange={(e) => setMemberCount(e.target.value)}
                            >
                                <option value="">Select Member Count</option>
                                {memberOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Primary Sport(s) Dropdown */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Primary Sport</span>
                            </label>
                            <select
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                            >
                                <option value="">Select Primary Sport</option>
                                {sportsOptions.map((sp) => (
                                    <option key={sp} value={sp}>{sp}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Section 2: Administrator Personal Information */}
                    <h2 className="profile-card-title" style={{ color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingTop: "12px" }}>
                        <User size={18} style={{ color: "#10b981" }} />
                        <span>Administrator Contact & Details</span>
                    </h2>

                    <div className="profile-grid-2">
                        {/* First Name */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>First Name</span>
                            </label>
                            <input
                                type="text"
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Last Name */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Last Name</span>
                            </label>
                            <input
                                type="text"
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>

                        {/* Email Address (Read-only) */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Email Address</span>
                                <span className="lock-badge"><Lock size={10} /> Cannot change</span>
                            </label>
                            <input
                                type="email"
                                className="profile-input profile-input-readonly"
                                style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
                                value={email}
                                readOnly
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Phone Number</span>
                            </label>
                            <input
                                type="tel"
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Aadhaar / Govt ID (Read-only) */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>Aadhaar / National ID</span>
                                <span className="lock-badge"><Lock size={10} /> Secured</span>
                            </label>
                            <input
                                type="text"
                                className="profile-input profile-input-readonly"
                                style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
                                value={aadharNumber ? `•••• •••• ${aadharNumber.slice(-4)}` : "Not provided"}
                                readOnly
                            />
                        </div>

                        {/* How did you hear about us Dropdown */}
                        <div className="profile-form-group">
                            <label style={{ color: "#475569" }}>
                                <span>How did you hear about Mukijo?</span>
                            </label>
                            <select
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={hearAbout}
                                onChange={(e) => setHearAbout(e.target.value)}
                            >
                                <option value="">Select option</option>
                                {hearAboutOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Password Reset (Optional) */}
                        <div className="profile-form-group" style={{ gridColumn: "1 / -1" }}>
                            <label style={{ color: "#475569" }}>
                                <span>Change Password</span>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Leave blank to keep existing password</span>
                            </label>
                            <input
                                type="password"
                                className="profile-input"
                                style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Submit Button */}
                <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="submit"
                        className="profile-save-btn"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)" }}
                        disabled={isSubmitting}
                    >
                        <Save size={16} />
                        <span>{isSubmitting ? "Saving Changes..." : "Save Profile Details"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
