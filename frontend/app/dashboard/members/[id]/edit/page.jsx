"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./edit-member.module.css";

const ROLES = ["Player", "Coach", "Parent", "Referee", "Member"];

export default function EditMemberPage() {
    const params = useParams();
    const router = useRouter();
    const id     = params?.id;

    const [member, setMember]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [globalSaving, setGlobalSaving] = useState(false);
    const [globalSuccess, setGlobalSuccess] = useState(false);

    // Form inputs state
    const [draft, setDraft] = useState({
        first_name: "",
        last_name:  "",
        email:      "",
        phone:      "",
        role:       "Member",
        password:   "",
    });

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/members/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMember(data);
                    setDraft({
                        first_name: data.first_name || "",
                        last_name:  data.last_name  || "",
                        email:      data.email      || "",
                        phone:      data.phone      || "",
                        role:       data.role       || "Member",
                        password:   data.password   || "",
                    });
                } else {
                    const err = await res.json().catch(() => ({}));
                    setError(err.detail || "Member not found or has been deleted.");
                }
            } catch {
                setError("Cannot connect to the backend. Please ensure the server is running on port 8001.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMember();
    }, [id]);

    const handleInputChange = (field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAll = async (e) => {
        if (e) e.preventDefault();
        setGlobalSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/members/${id}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(draft),
            });
            if (res.ok) {
                const updated = await res.json();
                setMember(updated);
                setGlobalSuccess(true);
                setTimeout(() => {
                    router.push("/dashboard/members");
                }, 1600);
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || "Update failed. Please check your inputs.");
            }
        } catch {
            alert("Connection error. Please try again.");
        } finally {
            setGlobalSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingCard}>
                    <div className={styles.loadingSpinner} />
                    <p className={styles.loadingText}>Loading member profile…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorScreen}>
                <div className={styles.errorCard}>
                    <div className={styles.errorIcon}>
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#EF4444" strokeWidth="1.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <h2 className={styles.errorTitle}>Profile Load Error</h2>
                    <p className={styles.errorMsg}>{error}</p>
                    <button className={styles.errorBtn} onClick={() => router.push("/dashboard/members")}>
                        ← Back to Team Members
                    </button>
                </div>
            </div>
        );
    }

    if (globalSuccess) {
        return (
            <div className={styles.successScreen}>
                <div className={styles.successCard}>
                    <div className={styles.successRing}>
                        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#bffe00" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h2 className={styles.successTitle}>Profile Updated!</h2>
                    <p className={styles.successMsg}>All changes have been saved. Redirecting to members list…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* ── Top Nav Bar ────────────────────────────────────────────── */}
            <div className={styles.navBar}>
                <button className={styles.backBtn} onClick={() => router.push("/dashboard/members")}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Back to Team Members
                </button>
                <div className={styles.navBreadcrumb}>
                    <span>Team Members</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    <span className={styles.breadcrumbActive}>Edit Profile</span>
                </div>
            </div>

            <div className={styles.layout}>
                {/* ── Unified Fields Form ───────────────────────────── */}
                <main className={styles.fieldsPanel}>
                    <form onSubmit={handleSaveAll} className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon} style={{ background: "rgba(191, 254, 0, 0.1)" }}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#bffe00" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </div>
                            <div>
                                <h3 className={styles.sectionTitle}>Edit Team Member Profile</h3>
                                <p className={styles.sectionSub}>Update the profile fields below and click Save at the bottom.</p>
                            </div>
                        </div>

                        {/* First Name */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>First Name</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="text"
                                    value={draft.first_name}
                                    onChange={e => handleInputChange("first_name", e.target.value)}
                                    className={styles.fieldInput}
                                    placeholder="Enter first name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Last Name</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="text"
                                    value={draft.last_name}
                                    onChange={e => handleInputChange("last_name", e.target.value)}
                                    className={styles.fieldInput}
                                    placeholder="Enter last name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Email Address</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="email"
                                    value={draft.email}
                                    onChange={e => handleInputChange("email", e.target.value)}
                                    className={styles.fieldInput}
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Phone Number</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="tel"
                                    value={draft.phone}
                                    onChange={e => handleInputChange("phone", e.target.value)}
                                    className={styles.fieldInput}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        {/* Member Role */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Team Member Role</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <select
                                    value={draft.role}
                                    onChange={e => handleInputChange("role", e.target.value)}
                                    className={styles.fieldInput}
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Password</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="password"
                                    value={draft.password}
                                    onChange={e => handleInputChange("password", e.target.value)}
                                    className={styles.fieldInput}
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        {/* Group / Club (Read-Only) */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldMeta}>
                                <span className={styles.fieldIcon}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748B" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </span>
                                <span className={styles.fieldLabel}>Group / Club</span>
                            </div>
                            <div className={styles.fieldContent}>
                                <input
                                    type="text"
                                    value={member?.group_name || "No Group"}
                                    disabled
                                    className={`${styles.fieldInput} ${styles.disabledInput}`}
                                />
                            </div>
                        </div>

                        {/* Bottom action bar */}
                        <div className={styles.bottomBar}>
                            <button
                                type="button"
                                className={styles.btnCancelAll}
                                onClick={() => router.push("/dashboard/members")}
                            >
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={styles.btnSaveAll}
                                disabled={globalSaving}
                            >
                                {globalSaving ? (
                                    <><span className={styles.spinner} /> Saving…</>
                                ) : (
                                    <><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
