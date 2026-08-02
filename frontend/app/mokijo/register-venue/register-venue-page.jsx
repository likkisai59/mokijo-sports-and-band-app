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
    AuthField,
    AuthErrorBanner,
    AuthNavLinks,
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

const c = getAuthClasses("dark");

const pageBtnSecondary =
    "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-semibold border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-[#f4f4f5] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)]";
const pageBtnPrimary =
    "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-semibold bg-gradient-to-br from-[#c6ff3d] to-[#c6ff3d] text-[#08080f] cursor-pointer shadow-[0_6px_18px_rgba(198,255,61,0.18)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";
const pageActions =
    "flex flex-row items-center justify-between gap-3 w-full mt-10 pt-8 border-t border-[rgba(255,255,255,0.08)] pb-4";


const chipBase =
    "min-w-[110px] h-10 px-3 rounded-[10px] text-[13px] font-medium border transition-all cursor-pointer inline-flex items-center justify-center text-center";
const chipIdle = "border-[rgba(255,255,255,0.12)] text-[rgba(244,244,245,0.55)] bg-[rgba(255,255,255,0.04)]";
const chipSelected = "border-[#c6ff3d] text-[#f4f4f5] bg-[rgba(198,255,61,0.15)] font-semibold";

const dayChipBase =
    "w-[42px] h-[42px] rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center";

const uploadZone =
    "relative min-h-[140px] h-[140px] border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-xl p-4 text-center cursor-pointer transition-all hover:border-[rgba(198,255,61,0.5)] hover:bg-[rgba(198,255,61,0.04)] bg-[rgba(255,255,255,0.03)] flex flex-col items-center justify-center overflow-hidden";

const photoCard =
    "relative w-[100px] h-[100px] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] shrink-0";

const sectionTitle =
    "text-[13px] font-semibold text-[rgba(244,244,245,0.5)] mt-8 mb-4 pb-2.5 border-b border-[rgba(255,255,255,0.08)]";

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

function Stepper({ step }) {
    const circle = (n, active, done) => (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                active || done
                    ? "bg-[#c6ff3d] text-[#08080f]"
                    : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[rgba(244,244,245,0.5)]"
            }`}
        >
            {done ? "✓" : n}
        </div>
    );

    return (
        <div className="flex items-center justify-center gap-4 mb-2">
            {circle(1, step === 1, step > 1)}
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)] max-w-[60px]" />
            {circle(2, step === 2, step > 2)}
        </div>
    );
}

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
        <div className="mb-8 pb-8 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-5">
                <span className="text-[13px] font-bold uppercase tracking-wide text-[#f4f4f5]">
                    Venue {index + 1}
                </span>
                {showRemove ? (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-xs font-semibold px-3 py-1 rounded-md bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] cursor-pointer"
                    >
                        Remove
                    </button>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AuthField variant="dark" label="Venue / Court Name" required>
                    <input
                        className={c.input}
                        required
                        placeholder="e.g. Green Field Arena"
                        value={venue.name}
                        onChange={(e) => {
                            const { sanitized } = applyClubNameInput(e.target.value);
                            update("name", sanitized);
                        }}
                    />
                </AuthField>
                <AuthField variant="dark" label="Location / City" required>
                    <input
                        className={c.input}
                        required
                        placeholder="e.g. Bengaluru"
                        value={venue.location}
                        onChange={(e) => {
                            const { sanitized } = applyCityOrStateInput(e.target.value);
                            update("location", sanitized);
                        }}
                    />
                </AuthField>
            </div>

            <div className="mt-5">
                <AuthField variant="dark" label="Landmark">
                    <input
                        className={c.input}
                        placeholder="e.g. Near City Mall, Opposite Metro Station"
                        value={venue.landmark}
                        onChange={(e) => update("landmark", e.target.value)}
                    />
                </AuthField>
            </div>

            <div className={sectionTitle}>Sports Offered</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {SPORTS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={`${chipBase} w-full min-w-0 ${venue.sports.includes(s) ? chipSelected : chipIdle}`}
                        onClick={() => {
                            const nextSports = toggle(venue.sports, s);
                            const nextPrices = { ...(venue.sportPrices || {}) };
                            if (nextSports.includes(s)) {
                                if (nextPrices[s] === undefined) nextPrices[s] = "";
                            } else {
                                delete nextPrices[s];
                            }
                            onChange(index, { ...venue, sports: nextSports, sportPrices: nextPrices });
                        }}
                    >
                        <span className="truncate">{s}</span>
                    </button>
                ))}
            </div>

            <div className={sectionTitle}>Cover Photo &amp; Gallery</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AuthField variant="dark" label="Cover Photo (shown in venue card)">
                    <div className={uploadZone}>
                        <input type="file" accept="image/*" onChange={handleCoverImage} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {venue.coverImage ? (
                            <img
                                src={venue.coverImage}
                                alt="cover"
                                className="absolute inset-0 w-full h-full object-cover rounded-[10px]"
                            />
                        ) : (
                            <>
                                <div className="text-[rgba(244,244,245,0.5)] text-[13px] mb-1 relative z-[1]">Click to upload cover photo</div>
                                <div className="text-[11px] text-[rgba(244,244,245,0.35)] relative z-[1]">JPG, PNG — will appear in venue cards</div>
                            </>
                        )}
                    </div>
                </AuthField>
                <AuthField variant="dark" label="Additional Photos">
                    <div className={uploadZone}>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            multiple
                            onChange={handlePhotos}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="text-[rgba(244,244,245,0.5)] text-[13px] mb-1 relative z-[1]">Click to add photos (.jpg)</div>
                        <div className="text-[11px] text-[rgba(244,244,245,0.35)] relative z-[1]">Multiple files allowed</div>
                    </div>
                    {venue.photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5 mt-3">
                            {venue.photos.map((p, i) => (
                                <div key={i} className={photoCard}>
                                    <img src={p} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[11px] border-0 cursor-pointer flex items-center justify-center"
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
                    ) : null}
                </AuthField>
            </div>

            <div className={sectionTitle}>Opening Hours &amp; Slots</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AuthField variant="dark" label="Opening Time">
                    <input
                        type="time"
                        className={c.input}
                        value={venue.openingTime}
                        onChange={(e) => update("openingTime", e.target.value)}
                        style={{ colorScheme: "dark" }}
                    />
                </AuthField>
                <AuthField variant="dark" label="Closing Time">
                    <input
                        type="time"
                        className={c.input}
                        value={venue.closingTime}
                        onChange={(e) => update("closingTime", e.target.value)}
                        style={{ colorScheme: "dark" }}
                    />
                </AuthField>
                <AuthField variant="dark" label="Slot Duration">
                    <select
                        className={c.select}
                        value={venue.slotDuration}
                        onChange={(e) => update("slotDuration", Number(e.target.value))}
                    >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>
                </AuthField>
            </div>

            {venue.sports.length > 0 ? (
                <>
                    <div className={sectionTitle}>Sport prices (per hour)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {venue.sports.map((sport) => (
                            <AuthField key={sport} variant="dark" label={`${sport} — Price / hour (INR)`} required>
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
                            </AuthField>
                        ))}
                    </div>
                </>
            ) : null}

            <div className={sectionTitle}>Days Open</div>
            <div className="flex flex-wrap gap-2 mt-1">
                {DAYS.map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={`${dayChipBase} ${
                            venue.daysOpen.includes(d) ? chipSelected : chipIdle
                        }`}
                        onClick={() => update("daysOpen", toggle(venue.daysOpen, d))}
                    >
                        {d}
                    </button>
                ))}
            </div>

            <div className={sectionTitle}>Amenities</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AMENITIES.map((a) => {
                    const checked = venue.amenities.includes(a);
                    return (
                        <button
                            key={a}
                            type="button"
                            onClick={() => update("amenities", toggle(venue.amenities, a))}
                            className={`${chipBase} w-full min-w-0 ${checked ? chipSelected : chipIdle}`}
                        >
                            <span className="truncate">{a}</span>
                        </button>
                    );
                })}
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

    const subtitle =
        step === 3
            ? undefined
            : step === 1
              ? "Step 1 of 2 — Tell us about your venue"
              : "Step 2 of 2 — Owner account details";

    return (
        <AuthShell variant="dark">
            <AuthCard size="lg" variant="dark">
                {step !== 3 ? (
                    <Link href="/" className={c.backLink}>
                        ← Back to Home
                    </Link>
                ) : null}

                <AuthBrand
                    variant="dark"
                    align="center"
                    title="Venue Owner Sign Up"
                    subtitle={subtitle}
                />

                {step !== 3 ? <Stepper step={step} /> : null}

                {step === 3 ? (
                    <SuccessScreen role="venue" />
                ) : step === 1 ? (
                    <>
                        <div className="text-center mb-6">
                            <h2 className={c.heading}>Tell us about your venue</h2>
                            <p className={`${c.subtext} mt-1`}>
                                You can add multiple venues at once. All venues will be listed under your account.
                            </p>
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

                        <AuthErrorBanner variant="dark">{error}</AuthErrorBanner>

                        <AuthNavLinks
                            variant="dark"
                            showBackHome={false}
                            showWrongPortal={false}
                            footerPrompt="Already have an account?"
                            footerHref="/login-venue"
                            footerLabel="Sign in"
                        />

                        <div className={pageActions}>
                            <button type="button" onClick={addVenue} className={pageBtnSecondary}>
                                + Add Another Venue
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (validateStep1()) setStep(2);
                                }}
                                className={pageBtnPrimary}
                            >
                                Next: Owner Details →
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="text-center mb-6">
                            <h2 className={c.heading}>Venue Owner Details</h2>
                            <p className={`${c.subtext} mt-1`}>
                                These details will be used to create your Mukijo venue owner account.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
                            <AuthField variant="dark" label="Full Name" required error={fieldErrors.fullName}>
                                <input
                                    className={c.input}
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    value={owner.fullName}
                                    onChange={(e) => {
                                        const { sanitized, error: nameErr } = applyNameInput(e.target.value);
                                        setOwnerField({ fullName: sanitized }, { fullName: nameErr });
                                    }}
                                />
                            </AuthField>
                            <AuthField variant="dark" label="Date of Birth" error={fieldErrors.dob}>
                                <input
                                    type="date"
                                    className={c.input}
                                    min="1900-01-01"
                                    max={new Date().toISOString().slice(0, 10)}
                                    value={dobToIso(owner.dob)}
                                    onChange={(e) => setOwnerField({ dob: isoToDob(e.target.value) }, { dob: "" })}
                                    style={{ colorScheme: "dark" }}
                                />
                            </AuthField>
                            <AuthField variant="dark" label="Email Address" required error={fieldErrors.email}>
                                <input
                                    type="email"
                                    className={c.input}
                                    required
                                    placeholder="owner@example.com"
                                    value={owner.email}
                                    onChange={(e) => {
                                        const { value, error: emailErr } = applyEmailInput(e.target.value);
                                        setOwnerField({ email: value }, { email: emailErr });
                                    }}
                                />
                            </AuthField>
                            <AuthField variant="dark" label="Phone Number" required error={fieldErrors.phone}>
                                <PhoneInput
                                    id="venue-owner-phone"
                                    className={c.input}
                                    selectClassName={c.select}
                                    countryCode={phoneCode}
                                    digits={phoneDigits}
                                    onCountryCodeChange={(code) => syncOwnerPhone(code, phoneDigits)}
                                    onDigitsChange={(digits) => syncOwnerPhone(phoneCode, digits)}
                                />
                            </AuthField>
                            <AuthField variant="dark" label="Aadhar Number" error={fieldErrors.aadhar}>
                                <input
                                    className={c.input}
                                    inputMode="numeric"
                                    maxLength={12}
                                    placeholder="12-digit Aadhar"
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
                                />
                            </AuthField>
                            <AuthField variant="dark" label="Password" required error={fieldErrors.password}>
                                <PasswordField
                                    tone="dark"
                                    className={c.input}
                                    required
                                    placeholder="Min 8 characters"
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
                                />
                            </AuthField>
                            <AuthField
                                variant="dark"
                                label="Confirm Password"
                                required
                                error={fieldErrors.confirmPassword}
                            >
                                <PasswordField
                                    tone="dark"
                                    className={c.input}
                                    required
                                    placeholder="Re-enter password"
                                    value={owner.confirmPassword}
                                    onChange={(e) =>
                                        setOwnerField(
                                            { confirmPassword: e.target.value },
                                            { confirmPassword: "" }
                                        )
                                    }
                                />
                            </AuthField>
                        </div>

                        <AuthErrorBanner variant="dark">{error}</AuthErrorBanner>

                        <AuthNavLinks
                            variant="dark"
                            showBackHome={false}
                            showWrongPortal={false}
                            footerPrompt="Already have an account?"
                            footerHref="/login-venue"
                            footerLabel="Sign in"
                        />

                        <div className={pageActions}>
                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setStep(1);
                                }}
                                className={pageBtnSecondary}
                            >
                                ← Back
                            </button>
                            <button type="submit" disabled={loading} className={pageBtnPrimary}>
                                {loading ? "Registering…" : "Register Venue"}
                            </button>
                        </div>
                    </form>
                )}
            </AuthCard>
        </AuthShell>
    );
}
