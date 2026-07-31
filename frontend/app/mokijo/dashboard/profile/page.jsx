"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { User, Lock, Save, AlertCircle, CheckCircle2, ShieldCheck, Mail, Phone, Key } from "lucide-react";
import "@/app/styles/profile.css";

export default function MemberProfilePage() {
    const router = useRouter();

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [groupName, setGroupName] = useState("");
    const [clubName, setClubName] = useState("");
    const [role, setRole] = useState("Member");

    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const memberId = localStorage.getItem("memberId");
            if (!memberId) {
                setError("No member session found. Please sign in as a club member.");
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(`${API_BASE_URL}/profile/member/${memberId}`, {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setFirstName(data.first_name || "");
                    setLastName(data.last_name || "");
                    setEmail(data.email || "");
                    setPhone(data.phone || "");
                    setRole(data.role || "Member");
                    setGroupName(data.group_name || "Assigned Group");
                    setClubName(data.club_name || "Assigned Club");
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setError(errData.detail || "Failed to load member profile.");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Unable to connect to server. Please check backend connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            alert("First name and Last name are required.");
            return;
        }
        if (!email.trim()) {
            alert("Email address is required.");
            return;
        }
        if (!phone.trim()) {
            alert("Phone number is required.");
            return;
        }

        const memberId = localStorage.getItem("memberId");
        if (!memberId) {
            setError("No member session found.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setShowSuccess(false);

        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            club_name: clubName,
            group_name: groupName,
            role: role,
        };

        if (password.trim()) {
            payload.password = password.trim();
        }

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/profile/member/${memberId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                setFirstName(updated.first_name || "");
                setLastName(updated.last_name || "");
                setEmail(updated.email || "");
                setPhone(updated.phone || "");
                setRole(updated.role || "Member");
                setGroupName(updated.group_name || "");
                setClubName(updated.club_name || "");
                setPassword("");

                // Sync localStorage & dispatch storage event for TopHeader
                const fullNewName = `${updated.first_name} ${updated.last_name}`.trim();
                localStorage.setItem("userName", fullNewName);
                localStorage.setItem("userEmail", updated.email);
                localStorage.setItem("userPhone", updated.phone);
                localStorage.setItem("clubName", updated.club_name);
                window.dispatchEvent(new Event("storage"));

                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.detail || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Could not update profile. Server connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "M";

    if (loading) {
        return (
            <div className="profile-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ color: "#94a3b8" }}>Loading profile details...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Notifications */}
            {showSuccess && (
                <div className="alert-message alert-success">
                    <CheckCircle2 size={18} />
                    <span>Profile successfully updated! Header details have been synced.</span>
                </div>
            )}
            {error && (
                <div className="alert-message alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="profile-card">
                    {/* Header Banner Inside Form Card */}
                    <div className="profile-header-banner" style={{ marginBottom: "20px" }}>
                        <div className="profile-avatar-lg">{initials}</div>
                        <div className="profile-title-area">
                            <h1>{firstName} {lastName}</h1>
                            <div className="profile-role-badge">
                                <ShieldCheck size={14} />
                                <span>Club Member ({role})</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-grid-2">
                        <div className="profile-form-group">
                            <label>Club Name</label>
                            <input
                                type="text"
                                className="profile-input profile-input-readonly"
                                value={clubName}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>Group Name</label>
                            <input
                                type="text"
                                className="profile-input profile-input-readonly"
                                value={groupName}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>Role</label>
                            <input
                                type="text"
                                className="profile-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Enter member role (e.g. Player, Coach, Member)"
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                className="profile-input"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Enter first name"
                                required
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                className="profile-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Enter last name"
                                required
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>
                                <span>Email Address</span>
                                <Mail size={14} style={{ color: "#64748b" }} />
                            </label>
                            <input
                                type="email"
                                className="profile-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                        <div className="profile-form-group">
                            <label>
                                <span>Phone Number</span>
                                <Phone size={14} style={{ color: "#64748b" }} />
                            </label>
                            <input
                                type="tel"
                                className="profile-input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                        <div className="profile-form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>
                                <span>New Password</span>
                                <Key size={14} style={{ color: "#64748b" }} />
                            </label>
                            <input
                                type="password"
                                className="profile-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button type="submit" className="profile-save-btn" disabled={isSubmitting}>
                            <Save size={18} />
                            <span>{isSubmitting ? "Saving..." : "Save Profile"}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
