"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "@/components/ui/PhoneInput";
import PasswordField from "@/components/ui/PasswordField";
import SuccessScreen from "@/components/register/SuccessScreen";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthErrorBanner,
    getAuthClasses,
} from "@/components/auth";
import {
    digitsOnly,
    isValidPhone,
    isValidAadhaar,
    isValidPersonName,
    isValidEmail,
    isValidDob,
    isValidClubName,
    isValidCityOrState,
    isStrongPassword,
    applyNameInput,
    applyEmailInput,
    applyClubNameInput,
    applyCityOrStateInput,
    composePhone,
    isoToDob,
    dobToIso,
    AADHAAR_MESSAGE,
    DOB_MESSAGE,
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    CLUB_NAME_MESSAGE,
    CITY_STATE_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

const c = getAuthClasses("light");
const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

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

const emptyVenue = () => ({
    name: "",
    location: "",
    landmark: "",
    sports: [],
    sportPrices: {},
    coverImage: null,
    photos: [],
    openingTime: "06:00",
    closingTime: "22:00",
    daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    slotDuration: 60,
    amenities: [],
});

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

function VenueBlock({ venue, index, onChange, onRemove, showRemove }) {
    const update = (field, val) => onChange(index, { ...venue, [field]: val });

    const handleCoverImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const b64 = await fileToBase64(file);
        update("coverImage", b64);
    };

    return (
        <div className="flex flex-col gap-6 w-full items-center">
            {showRemove ? (
                <div className="flex justify-between items-center w-full max-w-[380px] mx-auto">
                    <span className="text-sm font-black text-black">Venue #{index + 1}</span>
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                        Remove Venue
                    </button>
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[380px] mx-auto text-left">
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Venue / Court Name *</label>
                    <input
                        type="text"
                        className={c.input}
                        placeholder="e.g. Green Field Arena"
                        value={venue.name}
                        onChange={(e) => {
                            const { sanitized } = applyClubNameInput(e.target.value);
                            update("name", sanitized);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Location / City *</label>
                    <input
                        type="text"
                        className={c.input}
                        placeholder="e.g. Bengaluru"
                        value={venue.location}
                        onChange={(e) => {
                            const { sanitized } = applyCityOrStateInput(e.target.value);
                            update("location", sanitized);
                        }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Landmark</label>
                <input
                    type="text"
                    className={c.input}
                    placeholder="e.g. Near City Mall, Opposite Metro Station"
                    value={venue.landmark}
                    onChange={(e) => update("landmark", e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Sports Offered * (Select all that apply)</label>
                <div className="max-h-[180px] overflow-y-auto border-2 border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                    {SPORTS.map((s) => {
                        const isChecked = venue.sports.includes(s);
                        return (
                            <label
                                key={s}
                                className="flex items-center gap-2.5 cursor-pointer text-sm text-black font-bold"
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                        const nextSports = toggle(venue.sports, s);
                                        const nextPrices = { ...(venue.sportPrices || {}) };
                                        if (nextSports.includes(s)) {
                                            if (nextPrices[s] === undefined) nextPrices[s] = "";
                                        } else {
                                            delete nextPrices[s];
                                        }
                                        onChange(index, { ...venue, sports: nextSports, sportPrices: nextPrices });
                                    }}
                                    className="w-4 h-4 accent-black cursor-pointer"
                                />
                                <span>{s}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>
                    Upload Cover Photo <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                    {venue.coverImage ? (
                        <img
                            src={venue.coverImage}
                            alt="Cover Preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-base border border-emerald-300">
                            📷
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImage}
                        className="text-xs text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[380px] mx-auto text-left">
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Opening Time</label>
                    <input
                        type="time"
                        className={c.input}
                        value={venue.openingTime}
                        onChange={(e) => update("openingTime", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Closing Time</label>
                    <input
                        type="time"
                        className={c.input}
                        value={venue.closingTime}
                        onChange={(e) => update("closingTime", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Slot Duration</label>
                    <select
                        className={c.select}
                        value={venue.slotDuration}
                        onChange={(e) => update("slotDuration", Number(e.target.value))}
                    >
                        <option value={30}>30 mins</option>
                        <option value={60}>1 hour</option>
                    </select>
                </div>
            </div>

            {venue.sports.length > 0 ? (
                <div className="flex flex-col gap-4 w-full max-w-[380px] mx-auto text-left">
                    {venue.sports.map((sport) => (
                        <div key={sport} className="flex flex-col gap-2 text-left">
                            <label className={c.label}>{sport} Price / hour (₹) *</label>
                            <input
                                type="number"
                                className={c.input}
                                min={1}
                                placeholder="e.g. 800"
                                value={venue.sportPrices?.[sport] ?? ""}
                                onChange={(e) =>
                                    update("sportPrices", {
                                        ...(venue.sportPrices || {}),
                                        [sport]: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Days Open</label>
                <div className="flex flex-wrap gap-2 pt-1">
                    {DAYS.map((d) => {
                        const isChecked = venue.daysOpen.includes(d);
                        return (
                            <button
                                key={d}
                                type="button"
                                onClick={() => update("daysOpen", toggle(venue.daysOpen, d))}
                                className={`h-9 px-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${isChecked ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:border-black"
                                    }`}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Amenities</label>
                <div className="max-h-[160px] overflow-y-auto border-2 border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                    {AMENITIES.map((a) => {
                        const checked = venue.amenities.includes(a);
                        return (
                            <label
                                key={a}
                                className="flex items-center gap-2.5 cursor-pointer text-sm text-black font-bold"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => update("amenities", toggle(venue.amenities, a))}
                                    className="w-4 h-4 accent-black cursor-pointer"
                                />
                                <span>{a}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function RegisterVenuePage() {
    const [step, setStep] = useState(1);
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
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const handleVenueChange = (index, updated) => {
        setVenues((prev) => prev.map((v, i) => (i === index ? updated : v)));
    };
    const addVenue = () => setVenues((prev) => [...prev, emptyVenue()]);
    const removeVenue = (index) => setVenues((prev) => prev.filter((_, i) => i !== index));

    const setOwnerField = (patch, errorPatch = {}) => {
        setOwner((p) => ({ ...p, ...patch }));
        setFieldErrors((prev) => ({ ...prev, ...errorPatch }));
        setError("");
    };

    const syncOwnerPhone = (code, digits) => {
        setPhoneCode(code);
        setPhoneDigits(digits);
        setOwnerField(
            { phone: composePhone(code, digits) },
            {
                phone: digits && !isValidPhone(digits, code) ? phoneLengthMessage(code) : "",
            }
        );
    };

    const validateStep1 = () => {
        for (const v of venues) {
            if (!v.name.trim() || !v.location.trim()) {
                setError("Every venue must have a name and location.");
                return false;
            }
            if (!isValidClubName(v.name)) {
                setError(CLUB_NAME_MESSAGE);
                return false;
            }
            if (!isValidCityOrState(v.location)) {
                setError(CITY_STATE_MESSAGE);
                return false;
            }
            if (v.sports.length === 0) {
                setError(`Please select at least one sport for "${v.name || "a venue"}".`);
                return false;
            }
            for (const sport of v.sports) {
                const price = Number(v.sportPrices?.[sport]);
                if (!Number.isFinite(price) || price < 1) {
                    setError(`Enter a valid price per hour for ${sport} at "${v.name || "a venue"}".`);
                    return false;
                }
            }
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {};
        if (!owner.fullName?.trim()) {
            nextErrors.fullName = "Full name is required.";
        } else if (!isValidPersonName(owner.fullName)) {
            nextErrors.fullName = PERSON_NAME_MESSAGE;
        }
        if (!owner.email?.trim()) {
            nextErrors.email = "Email is required.";
        } else if (!isValidEmail(owner.email)) {
            nextErrors.email = EMAIL_MESSAGE;
        }
        if (!phoneDigits) {
            nextErrors.phone = "Phone number is required.";
        } else if (!isValidPhone(phoneDigits, phoneCode)) {
            nextErrors.phone = phoneLengthMessage(phoneCode);
        }
        if (owner.dob && !isValidDob(owner.dob)) {
            nextErrors.dob = DOB_MESSAGE;
        }
        if (owner.aadhar && !isValidAadhaar(owner.aadhar)) {
            nextErrors.aadhar = AADHAAR_MESSAGE;
        }
        if (!owner.password?.trim()) {
            nextErrors.password = "Password is required.";
        } else if (!isStrongPassword(owner.password)) {
            nextErrors.password = STRONG_PASSWORD_MESSAGE;
        }
        if (owner.password !== owner.confirmPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
        }
        if (Object.keys(nextErrors).length) {
            setFieldErrors(nextErrors);
            setError("");
            return;
        }
        setLoading(true);
        setError("");
        setFieldErrors({});

        const payload = {
            owner: {
                full_name: owner.fullName,
                dob: owner.dob || null,
                email: owner.email,
                phone: composePhone(phoneCode, phoneDigits),
                aadhar_number: owner.aadhar || null,
                password: owner.password,
            },
            venues: venues.map((v) => {
                const sportPricesAsNumbers = {};
                for (const sport of v.sports) {
                    sportPricesAsNumbers[sport] = Number(v.sportPrices?.[sport]) || 0;
                }
                const priceValues = Object.values(sportPricesAsNumbers).filter((p) => p > 0);
                return {
                    name: v.name,
                    location: v.location,
                    landmark: v.landmark || null,
                    sports_supported: JSON.stringify(v.sports),
                    sport_prices: JSON.stringify(sportPricesAsNumbers),
                    base_price_per_hour: priceValues.length ? Math.min(...priceValues) : 0,
                    amenities: JSON.stringify(v.amenities),
                    cover_image: v.coverImage || null,
                    venue_images: JSON.stringify(v.photos),
                    opening_time: v.openingTime,
                    closing_time: v.closingTime,
                    days_open: JSON.stringify(v.daysOpen),
                    slot_duration: v.slotDuration,
                };
            }),
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

    return (
        <AuthShell variant="light">
            <AuthCard size="register" variant="light">
                {step !== 3 ? (
                    <Link href="/" className={c.backLink}>
                        ← Back to Home
                    </Link>
                ) : null}

                <AuthBrand
                    variant="light"
                    align="center"
                    title="Venue Owner Sign Up"
                    subtitle={step === 3 ? undefined : `Step ${step} of 2`}
                />

                {step === 3 ? (
                    <SuccessScreen role="venue" />
                ) : step === 1 ? (
                    <div className="flex flex-col gap-6 w-full items-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-black text-white">1</div>
                            <div className="flex-1 h-px bg-gray-200 max-w-[60px]"></div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 border border-gray-300 text-gray-500">2</div>
                        </div>

                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-black text-black tracking-tight">Venue Information</h2>
                            <p className="text-sm font-medium text-gray-600 mt-1">Tell us about your venue or sports facility</p>
                        </div>

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

                        {error ? <AuthErrorBanner variant="light">{error}</AuthErrorBanner> : null}

                        <div className="flex justify-between items-center mt-6 gap-3 w-full max-w-[380px] mx-auto">
                            <button
                                type="button"
                                onClick={addVenue}
                                className="h-10 px-5 bg-white border-2 border-gray-300 text-black font-bold text-sm rounded-xl transition-all duration-200 hover:border-black hover:bg-gray-50 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                + Add Venue
                            </button>
                            <button
                                type="button"
                                className="h-10 px-6 bg-black text-white font-bold text-sm rounded-xl transition-all duration-200 hover:bg-gray-800 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                onClick={() => {
                                    if (validateStep1()) setStep(2);
                                }}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="flex flex-col gap-6 w-full items-center" onSubmit={handleSubmit}>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 border border-gray-300 text-gray-500">1</div>
                            <div className="flex-1 h-px bg-gray-200 max-w-[60px]"></div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-black text-white">2</div>
                        </div>

                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-black text-black tracking-tight">Owner Details</h2>
                            <p className="text-sm font-medium text-gray-600 mt-1">Tell us about the venue owner</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Full Name *</label>
                            <input
                                type="text"
                                className={c.input}
                                placeholder="e.g. Rahul Sharma"
                                value={owner.fullName}
                                onChange={(e) => {
                                    const { sanitized, error: nameErr } = applyNameInput(e.target.value);
                                    setOwnerField({ fullName: sanitized }, { fullName: nameErr });
                                }}
                                disabled={loading}
                            />
                            {fieldErrors.fullName ? <p style={fieldErrorStyle}>{fieldErrors.fullName}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Date of Birth</label>
                            <input
                                type="date"
                                className={c.input}
                                min="1900-01-01"
                                max={new Date().toISOString().slice(0, 10)}
                                value={dobToIso(owner.dob)}
                                onChange={(e) => setOwnerField({ dob: isoToDob(e.target.value) }, { dob: "" })}
                                disabled={loading}
                            />
                            {fieldErrors.dob ? <p style={fieldErrorStyle}>{fieldErrors.dob}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Venue Owner Email *</label>
                            <input
                                type="email"
                                className={c.input}
                                placeholder="owner@example.com"
                                value={owner.email}
                                onChange={(e) => {
                                    const { value, error: emailErr } = applyEmailInput(e.target.value);
                                    setOwnerField({ email: value }, { email: emailErr });
                                }}
                                disabled={loading}
                            />
                            {fieldErrors.email ? <p style={fieldErrorStyle}>{fieldErrors.email}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-[#380px] mx-auto text-left">
                            <label className={c.label}>Venue Owner Phone Number *</label>
                            <PhoneInput
                                id="venue-owner-phone"
                                className={c.input}
                                selectClassName={c.select}
                                countryCode={phoneCode}
                                digits={phoneDigits}
                                onCountryCodeChange={(code) => syncOwnerPhone(code, phoneDigits)}
                                onDigitsChange={(digits) => syncOwnerPhone(phoneCode, digits)}
                                disabled={loading}
                            />
                            {fieldErrors.phone ? <p style={fieldErrorStyle}>{fieldErrors.phone}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Venue Owner Aadhar Number</label>
                            <input
                                type="text"
                                className={c.input}
                                inputMode="numeric"
                                maxLength={12}
                                placeholder="12-digit Aadhar Number"
                                value={owner.aadhar}
                                onChange={(e) => {
                                    const aadhar = digitsOnly(e.target.value).slice(0, 12);
                                    setOwnerField(
                                        { aadhar },
                                        {
                                            aadhar: aadhar && aadhar.length !== 12 ? AADHAAR_MESSAGE : "",
                                        }
                                    );
                                }}
                                disabled={loading}
                            />
                            {fieldErrors.aadhar ? <p style={fieldErrorStyle}>{fieldErrors.aadhar}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Password *</label>
                            <PasswordField
                                tone="light"
                                className={c.input}
                                placeholder="Create a strong password"
                                value={owner.password}
                                onChange={(e) =>
                                    setOwnerField(
                                        { password: e.target.value },
                                        {
                                            password:
                                                e.target.value && !isStrongPassword(e.target.value)
                                                    ? STRONG_PASSWORD_MESSAGE
                                                    : "",
                                        }
                                    )
                                }
                                disabled={loading}
                            />
                            {fieldErrors.password ? <p style={fieldErrorStyle}>{fieldErrors.password}</p> : null}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                            <label className={c.label}>Confirm Password *</label>
                            <PasswordField
                                tone="light"
                                className={c.input}
                                placeholder="Re-enter password"
                                value={owner.confirmPassword}
                                onChange={(e) =>
                                    setOwnerField(
                                        { confirmPassword: e.target.value },
                                        { confirmPassword: "" }
                                    )
                                }
                                disabled={loading}
                            />
                            {fieldErrors.confirmPassword ? <p style={fieldErrorStyle}>{fieldErrors.confirmPassword}</p> : null}
                        </div>

                        {error ? <AuthErrorBanner variant="light">{error}</AuthErrorBanner> : null}

                        <div className="flex justify-between items-center mt-6 gap-3 w-full max-w-[380px] mx-auto">
                            <button
                                type="button"
                                className="h-10 px-5 bg-white border-2 border-gray-300 text-black font-bold text-sm rounded-xl transition-all duration-200 hover:border-black hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                                onClick={() => setStep(1)}
                                disabled={loading}
                            >
                                ← Previous
                            </button>
                            <button
                                type="submit"
                                className="h-10 px-6 bg-black text-white font-bold text-sm rounded-xl transition-all duration-200 hover:bg-gray-800 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                disabled={loading}
                            >
                                {loading ? "Registering..." : "Sign Up ✓"}
                            </button>
                        </div>
                    </form>
                )}
            </AuthCard>
        </AuthShell>
    );
}


