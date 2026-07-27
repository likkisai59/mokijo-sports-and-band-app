/** Shared form validation helpers (BUG-001–007, 016–045, 069–082). */

export const STRONG_PASSWORD_MESSAGE =
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

export const EMAIL_MESSAGE = "Please enter a valid email address (e.g., name@gmail.com).";

export const PERSON_NAME_MESSAGE = "Numbers and special characters are not allowed.";

export const CLUB_NAME_MESSAGE = "Numbers and special characters are not allowed.";

export const PHONE_DIGITS_MESSAGE = "Phone number can only contain digits.";

export const PHONE_LENGTH_FIXED_MESSAGE = "Phone number must be exactly 10 digits.";

export const AADHAAR_MESSAGE = "Aadhaar number must be exactly 12 digits.";

export const CITY_STATE_MESSAGE = "This field can only contain alphabetic characters, spaces, hyphens, and periods.";

export const POSTAL_CODE_MESSAGE = "Please enter a valid postal code (4-10 digits).";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PERSON_NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/;
const CITY_STATE_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
const CLUB_NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/;
const STRONG_PASSWORD_RE =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const NAME_ALLOWED_CHARS_RE = /[^A-Za-z\s'-]/g;

/** Country dial code → expected national number length (min, max). */
export const PHONE_LENGTH_BY_CODE = {
    "+91": [10, 10],
    "+1": [10, 10],
    "+44": [10, 11],
    "+49": [10, 11],
    "+61": [9, 9],
    "+971": [9, 9],
    "+81": [10, 11],
    "+86": [11, 11],
    "+33": [9, 9],
    "+39": [9, 10],
    "+34": [9, 9],
    "+55": [10, 11],
    "+52": [10, 10],
    "+27": [9, 9],
    "+82": [9, 10],
    "+65": [8, 8],
    "+60": [9, 10],
    "+62": [9, 12],
    "+66": [9, 9],
    "+63": [10, 10],
    "+92": [10, 10],
    "+880": [10, 10],
    "+94": [9, 9],
    "+977": [10, 10],
};

export { PHONE_COUNTRY_CODES, PHONE_COUNTRY_CODES_SORTED } from "./countryDialCodes";

export function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

/** Strip digits/specials; keep letters, spaces, hyphen, apostrophe. */
export function sanitizePersonName(value) {
    return String(value || "").replace(NAME_ALLOWED_CHARS_RE, "");
}

/** Same sanitize rules as person name (alphabetic club names). */
export function sanitizeClubName(value) {
    return sanitizePersonName(value);
}

/**
 * Returns error message if raw input contained disallowed chars, else "".
 * Always returns the sanitized value via result.sanitized.
 */
export function applyNameInput(rawValue) {
    const raw = String(rawValue || "");
    const sanitized = sanitizePersonName(raw);
    const hadInvalid = raw !== sanitized;
    return {
        sanitized,
        error: hadInvalid ? PERSON_NAME_MESSAGE : "",
    };
}

export function applyClubNameInput(rawValue) {
    const raw = String(rawValue || "");
    const sanitized = sanitizeClubName(raw);
    const hadInvalid = raw !== sanitized;
    return {
        sanitized,
        error: hadInvalid ? CLUB_NAME_MESSAGE : "",
    };
}

/** Strip digits/specials for city/location; keep letters, spaces, hyphen, apostrophe, period. */
export function sanitizeCityOrState(value) {
    return String(value || "").replace(/[^A-Za-z\s.'-]/g, "");
}

export function applyCityOrStateInput(rawValue) {
    const raw = String(rawValue || "");
    const sanitized = sanitizeCityOrState(raw);
    const hadInvalid = raw !== sanitized;
    return {
        sanitized,
        error: hadInvalid ? CITY_STATE_MESSAGE : "",
    };
}

export function isValidEmail(value) {
    const v = String(value || "").trim();
    return EMAIL_RE.test(v);
}

/** Live email format check — empty is allowed (required handled separately). */
export function applyEmailInput(rawValue) {
    const value = String(rawValue || "").trim();
    return {
        value: String(rawValue || ""),
        error: value && !isValidEmail(value) ? EMAIL_MESSAGE : "",
    };
}

export function isValidPersonName(value) {
    const v = String(value || "").trim();
    return v.length >= 1 && PERSON_NAME_RE.test(v) && !/\d/.test(v);
}

export function isValidCityOrState(value) {
    const v = String(value || "").trim();
    return v.length >= 1 && CITY_STATE_RE.test(v) && !/\d/.test(v);
}

export function isValidPostalCode(value) {
    const d = digitsOnly(value);
    return d.length >= 4 && d.length <= 10;
}

export function isValidClubName(value) {
    const v = String(value || "").trim();
    if (!v || /\d/.test(v)) return false;
    return CLUB_NAME_RE.test(v);
}

export function isStrongPassword(value) {
    return STRONG_PASSWORD_RE.test(String(value || ""));
}

export function isValidAadhaar(value) {
    return /^\d{12}$/.test(digitsOnly(value));
}

export function formatAadhaar(value) {
    const d = digitsOnly(value).slice(0, 12);
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 4));
    if (d.length > 4) parts.push(d.slice(4, 8));
    if (d.length > 8) parts.push(d.slice(8, 12));
    return parts.join(" ");
}

/**
 * @param {string} digits - national number digits only
 * @param {string} countryCode - e.g. "+91"
 */
export function isValidPhone(digits, countryCode = "+91") {
    const d = digitsOnly(digits);
    if (!/^\d+$/.test(d)) return false;
    const range = PHONE_LENGTH_BY_CODE[countryCode] || [8, 15];
    return d.length >= range[0] && d.length <= range[1];
}

export function phoneLengthMessage(countryCode = "+91") {
    const range = PHONE_LENGTH_BY_CODE[countryCode] || [8, 15];
    if (range[0] === range[1]) {
        return `Please enter a valid ${range[0]}-digit phone number.`;
    }
    return `Please enter a valid phone number (${range[0]}–${range[1]} digits).`;
}

/** Combine country code + national digits for storage. */
export function composePhone(countryCode, digits) {
    const d = digitsOnly(digits);
    const code = countryCode || "+91";
    return d ? `${code} ${d}` : "";
}

/** Parse stored phone into { countryCode, digits }. */
export function parsePhone(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
        return { countryCode: match[1], digits: digitsOnly(match[2]) };
    }
    return { countryCode: "+91", digits: digitsOnly(raw) };
}

export const DOB_MESSAGE = "Please enter a valid Date of Birth (DD/MM/YYYY).";

/** Format digits input into DD/MM/YYYY date pattern. */
export function formatDobInput(value) {
    const rawDigits = digitsOnly(value).slice(0, 8);
    if (rawDigits.length <= 2) return rawDigits;
    if (rawDigits.length <= 4) return `${rawDigits.slice(0, 2)}/${rawDigits.slice(2)}`;
    return `${rawDigits.slice(0, 2)}/${rawDigits.slice(2, 4)}/${rawDigits.slice(4, 8)}`;
}

/** Convert YYYY-MM-DD (calendar) → DD/MM/YYYY for form storage. */
export function isoToDob(isoValue) {
    const v = String(isoValue || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
    const [year, month, day] = v.split("-");
    return `${day}/${month}/${year}`;
}

/** Convert DD/MM/YYYY → YYYY-MM-DD for calendar input value. */
export function dobToIso(dobValue) {
    const v = String(dobValue || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const parts = v.split("/");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    if (day?.length !== 2 || month?.length !== 2 || year?.length !== 4) return "";
    return `${year}-${month}-${day}`;
}

/** Validate DOB as YYYY-MM-DD (calendar) or DD/MM/YYYY (legacy text). */
export function isValidDob(value) {
    const v = String(value || "").trim();
    if (!v) return false;

    // Native calendar input value
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [year, month, day] = v.split("-").map((n) => parseInt(n, 10));
        if (month < 1 || month > 12 || day < 1 || day > 31) return false;
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return false;
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) return false;
        const picked = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return picked <= today;
    }

    // Legacy DD/MM/YYYY text entry
    const parts = v.split("/");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
}

/** Generate formatted Club ID (e.g. MKJ-001, MKJ-002). */
export function generateClubId(seq = 1) {
    const num = Math.max(1, parseInt(seq || 1, 10));
    const padded = String(num).padStart(3, "0");
    return `MKJ-${padded}`;
}
