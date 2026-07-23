"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import "../styles/venue-register.css";
import {
    digitsOnly,
    isValidPhone,
    isValidAadhaar,
    formatDobInput,
    isValidDob,
    AADHAAR_MESSAGE,
    DOB_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

// ─── Constants ───────────────────────────────────────────────────────
const SPORTS = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Badminton",
    "Volleyball",
    "Swimming",
    "Table Tennis",
    "Boxing",
    "Kabaddi",
    "Gym",
    "Squash",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AMENITIES = [
    "Parking",
    "Changing Rooms",
    "Showers",
    "Cafeteria",
    "First Aid",
    "CCTV",
    "Floodlights",
    "WiFi",
    "Drinking Water",
    "Washrooms",
    "Scoreboard",
    "Seating",
];

// ─── Empty venue template ─────────────────────────────────────────────
const emptyVenue = () => ({
    name: "",
    location: "",
    landmark: "",
    sports: [], // array of sport strings
    coverImage: null, // base64 or null
    photos: [], // array of base64
    openingTime: "06:00",
    closingTime: "22:00",
    daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    slotDuration: 60,
    amenities: [],
});

// ─── Helpers ──────────────────────────────────────────────────────────
function toggle(arr, val) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// ─── Venue Form Block ─────────────────────────────────────────────────
function VenueBlock({ venue, index, onChange, onRemove, showRemove }) {
    const update = (field, val) => onChange(index, { ...venue, [field]: val });

    const handleCoverImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const b64 = await fileToBase64(file);
        update("coverImage", b64);
    };

    const handlePhotos = async (e) => {
        const files = Array.from(e.target.files);
        const b64s = await Promise.all(files.map(fileToBase64));
        update("photos", [...venue.photos, ...b64s]);
    };

    return (
        <div className="vr-venue-block">
            <div className="vr-venue-block-header">
                <span className="vr-venue-label">Venue {index + 1}</span>
                {showRemove && (
                    <button type="button" className="vr-remove-btn" onClick={() => onRemove(index)}>
                        Remove
                    </button>
                )}
            </div>

            {/* Basic Info */}
            <div className="vr-grid">
                <div className="vr-field">
                    <label className="vr-label">Venue / Court Name *</label>
                    <input
                        className="vr-input"
                        required
                        placeholder="e.g. Green Field Arena"
                        value={venue.name}
                        onChange={(e) => update("name", e.target.value)}
                    />
                </div>
                <div className="vr-field">
                    <label className="vr-label">Location / City *</label>
                    <input
                        className="vr-input"
                        required
                        placeholder="e.g. Bengaluru, Karnataka"
                        value={venue.location}
                        onChange={(e) => update("location", e.target.value)}
                    />
                </div>
            </div>

            <div className="vr-grid cols-1" style={{ marginTop: 18 }}>
                <div className="vr-field">
                    <label className="vr-label">Landmark</label>
                    <input
                        className="vr-input"
                        placeholder="e.g. Near City Mall, Opposite Metro Station"
                        value={venue.landmark}
                        onChange={(e) => update("landmark", e.target.value)}
                    />
                </div>
            </div>

            {/* Sports */}
            <div className="vr-section-title">Sports Offered</div>
            <div className="vr-sports-grid">
                {SPORTS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={`vr-sport-chip ${venue.sports.includes(s) ? "selected" : ""}`}
                        onClick={() => update("sports", toggle(venue.sports, s))}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Photos */}
            <div className="vr-section-title">Cover Photo &amp; Gallery</div>
            <div className="vr-grid">
                <div className="vr-field">
                    <label className="vr-label">Cover Photo (shown in venue card)</label>
                    <div className="vr-upload">
                        <input type="file" accept="image/*" onChange={handleCoverImage} />
                        {venue.coverImage ? (
                            <img
                                src={venue.coverImage}
                                alt="cover"
                                style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                            />
                        ) : (
                            <>
                                <div className="vr-upload-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="32"
                                        height="32"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth="1.5"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </div>
                                <div className="vr-upload-text">Click to upload cover photo</div>
                                <div className="vr-upload-hint">JPG, PNG — will appear in venue cards</div>
                            </>
                        )}
                    </div>
                </div>
                <div className="vr-field">
                    <label className="vr-label">Additional Photos</label>
                    <div className="vr-upload">
                        <input type="file" accept="image/jpeg,image/jpg,image/png" multiple onChange={handlePhotos} />
                        <div className="vr-upload-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="32"
                                height="32"
                                fill="none"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1.5"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </div>
                        <div className="vr-upload-text">Click to add photos (.jpg)</div>
                        <div className="vr-upload-hint">Multiple files allowed</div>
                    </div>
                    {venue.photos.length > 0 && (
                        <div className="vr-preview-list">
                            {venue.photos.map((p, i) => (
                                <div key={i} className="vr-preview-item">
                                    <img src={p} alt="" />
                                    <button
                                        className="vr-preview-remove"
                                        type="button"
                                        onClick={() =>
                                            update(
                                                "photos",
                                                venue.photos.filter((_, j) => j !== i)
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Timings */}
            <div className="vr-section-title">Opening Hours &amp; Slots</div>
            <div className="vr-grid cols-3">
                <div className="vr-field">
                    <label className="vr-label">Opening Time</label>
                    <input
                        type="time"
                        className="vr-input"
                        value={venue.openingTime}
                        onChange={(e) => update("openingTime", e.target.value)}
                    />
                </div>
                <div className="vr-field">
                    <label className="vr-label">Closing Time</label>
                    <input
                        type="time"
                        className="vr-input"
                        value={venue.closingTime}
                        onChange={(e) => update("closingTime", e.target.value)}
                    />
                </div>
                <div className="vr-field">
                    <label className="vr-label">Slot Duration</label>
                    <select
                        className="vr-select"
                        value={venue.slotDuration}
                        onChange={(e) => update("slotDuration", Number(e.target.value))}
                    >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>
                </div>
            </div>

            {/* Days open */}
            <div className="vr-section-title">Days Open</div>
            <div className="vr-days-grid">
                {DAYS.map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={`vr-day-chip ${venue.daysOpen.includes(d) ? "selected" : ""}`}
                        onClick={() => update("daysOpen", toggle(venue.daysOpen, d))}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* Amenities */}
            <div className="vr-section-title">Amenities</div>
            <div className="vr-amenities-grid">
                {AMENITIES.map((a) => {
                    const checked = venue.amenities.includes(a);
                    return (
                        <label
                            key={a}
                            className={`vr-amenity-check ${checked ? "checked" : ""}`}
                            onClick={() => update("amenities", toggle(venue.amenities, a))}
                        >
                            <span className="vr-amenity-box" />
                            <span className="vr-amenity-label">{a}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function RegisterVenuePage() {
    const [step, setStep] = useState(1); // 1 = venues, 2 = owner, 3 = success
    const [venues, setVenues] = useState([emptyVenue()]);
    const [owner, setOwner] = useState({
        fullName: "",
        dob: "",
        email: "",
        phone: "",
        aadhar: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Venue handlers
    const handleVenueChange = (index, updated) => {
        setVenues((prev) => prev.map((v, i) => (i === index ? updated : v)));
    };
    const addVenue = () => setVenues((prev) => [...prev, emptyVenue()]);
    const removeVenue = (index) => setVenues((prev) => prev.filter((_, i) => i !== index));

    // Step 1 validation
    const validateStep1 = () => {
        for (const v of venues) {
            if (!v.name.trim() || !v.location.trim()) {
                setError("Every venue must have a name and location.");
                return false;
            }
            if (v.sports.length === 0) {
                setError(`Please select at least one sport for "${v.name || "a venue"}".`);
                return false;
            }
        }
        setError("");
        return true;
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidPhone(owner.phone, "+91")) {
            setError(phoneLengthMessage("+91"));
            return;
        }
        if (owner.dob && !isValidDob(owner.dob)) {
            setError(DOB_MESSAGE);
            return;
        }
        if (owner.aadhar && !isValidAadhaar(owner.aadhar)) {
            setError(AADHAAR_MESSAGE);
            return;
        }
        if (owner.password !== owner.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        setError("");

        const payload = {
            owner: {
                full_name: owner.fullName,
                dob: owner.dob || null,
                email: owner.email,
                phone: owner.phone,
                aadhar_number: owner.aadhar || null,
                password: owner.password,
            },
            venues: venues.map((v) => ({
                name: v.name,
                location: v.location,
                landmark: v.landmark || null,
                sports_supported: JSON.stringify(v.sports),
                amenities: JSON.stringify(v.amenities),
                cover_image: v.coverImage || null,
                venue_images: JSON.stringify(v.photos),
                opening_time: v.openingTime,
                closing_time: v.closingTime,
                days_open: JSON.stringify(v.daysOpen),
                slot_duration: v.slotDuration,
            })),
        };

        try {
            const res = await fetch(`${API_BASE_URL}/venue-owner/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setStep(3);
            } else {
                setError(data.detail || "Registration failed. Please try again.");
            }
        } catch {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    // ─── Success Screen ───────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="vr-page">
                <div className="vr-header">
                    <Link href="/" className="vr-logo">
                        Mukijo
                    </Link>
                </div>
                <div className="vr-card">
                    <div className="vr-success">
                        <div className="vr-success-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="42"
                                height="42"
                                fill="none"
                                stroke="#c6ff3d"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Venue Registered Successfully!</h2>
                        <p>
                            Your {venues.length > 1 ? `${venues.length} venues have` : "venue has"} been listed on
                            Mukijo. You can now log in and manage your venue bookings.
                        </p>
                        <Link href="/login-venue" className="vr-success-link">
                            Sign In as Venue Owner →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vr-page">
            {/* Header */}
            <div className="vr-header">
                <Link href="/" className="vr-logo">
                    Mukijo
                </Link>
                <Link href="/login-venue" className="vr-back">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Already registered? Sign in
                </Link>
            </div>

            {/* Stepper */}
            <div className="vr-stepper">
                <div className={`vr-step ${step === 1 ? "active" : "done"}`}>
                    <span className="vr-step-circle">{step > 1 ? "✓" : "1"}</span>
                    Venue Details
                </div>
                <div className={`vr-step-line ${step > 1 ? "done" : ""}`} />
                <div className={`vr-step ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>
                    <span className="vr-step-circle">{step > 2 ? "✓" : "2"}</span>
                    Owner Details
                </div>
            </div>

            {/* ── STEP 1: Venue(s) ── */}
            {step === 1 && (
                <div className="vr-card">
                    <h2 className="vr-card-title">Tell us about your venue</h2>
                    <p className="vr-card-sub">
                        You can add multiple venues at once. All venues will be listed under your account.
                    </p>

                    {venues.map((v, i) => (
                        <VenueBlock
                            key={i}
                            venue={v}
                            index={i}
                            onChange={handleVenueChange}
                            onRemove={removeVenue}
                            showRemove={venues.length > 1}
                        />
                    ))}

                    <button type="button" className="vr-add-btn" onClick={addVenue}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Another Venue
                    </button>

                    {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16 }}>{error}</p>}

                    <div className="vr-actions">
                        <button
                            type="button"
                            className="vr-btn-primary"
                            onClick={() => {
                                if (validateStep1()) setStep(2);
                            }}
                        >
                            Next: Owner Details →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Owner details ── */}
            {step === 2 && (
                <form className="vr-card" onSubmit={handleSubmit}>
                    <h2 className="vr-card-title">Venue Owner Details</h2>
                    <p className="vr-card-sub">These details will be used to create your Mukijo venue owner account.</p>

                    <div className="vr-grid">
                        <div className="vr-field">
                            <label className="vr-label">Full Name *</label>
                            <input
                                className="vr-input"
                                required
                                placeholder="e.g. Rahul Sharma"
                                value={owner.fullName}
                                onChange={(e) => setOwner((p) => ({ ...p, fullName: e.target.value }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Date of Birth (DD/MM/YYYY)</label>
                            <input
                                type="text"
                                className="vr-input"
                                placeholder="DD/MM/YYYY"
                                maxLength={10}
                                value={owner.dob}
                                onChange={(e) => setOwner((p) => ({ ...p, dob: formatDobInput(e.target.value) }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Email Address *</label>
                            <input
                                type="email"
                                className="vr-input"
                                required
                                placeholder="owner@example.com"
                                value={owner.email}
                                onChange={(e) => setOwner((p) => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Phone Number *</label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                className="vr-input"
                                required
                                placeholder="10-digit mobile number"
                                value={owner.phone}
                                onChange={(e) => setOwner((p) => ({ ...p, phone: digitsOnly(e.target.value).slice(0, 15) }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Aadhar Number</label>
                            <input
                                className="vr-input"
                                inputMode="numeric"
                                placeholder="12-digit Aadhar"
                                value={owner.aadhar}
                                onChange={(e) => setOwner((p) => ({ ...p, aadhar: digitsOnly(e.target.value).slice(0, 12) }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Password *</label>
                            <input
                                type="password"
                                className="vr-input"
                                required
                                placeholder="Min 8 characters"
                                value={owner.password}
                                onChange={(e) => setOwner((p) => ({ ...p, password: e.target.value }))}
                            />
                        </div>
                        <div className="vr-field">
                            <label className="vr-label">Confirm Password *</label>
                            <input
                                type="password"
                                className="vr-input"
                                required
                                placeholder="Re-enter password"
                                value={owner.confirmPassword}
                                onChange={(e) => setOwner((p) => ({ ...p, confirmPassword: e.target.value }))}
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16 }}>{error}</p>}

                    <div className="vr-actions">
                        <button
                            type="button"
                            className="vr-btn-secondary"
                            onClick={() => {
                                setError("");
                                setStep(1);
                            }}
                        >
                            ← Back
                        </button>
                        <button type="submit" className="vr-btn-primary" disabled={loading}>
                            {loading ? "Registering…" : "Register Venue"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
