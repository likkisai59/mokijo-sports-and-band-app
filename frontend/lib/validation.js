/** Shared form validation helpers (BUG-001–007, 016–045, 069–082). */

export const STRONG_PASSWORD_MESSAGE =
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

export const EMAIL_MESSAGE = "Please enter a valid email address (e.g., name@example.com).";

export const PERSON_NAME_MESSAGE =
    "Name can only contain alphabetic characters, spaces, hyphens, and apostrophes.";

export const CLUB_NAME_MESSAGE =
    "Club name cannot be only numbers and must use valid characters.";

export const PHONE_DIGITS_MESSAGE = "Phone number can only contain digits.";

export const AADHAAR_MESSAGE = "Please enter a valid 12-digit Aadhaar number.";

export const CITY_STATE_MESSAGE = "This field can only contain alphabetic characters, spaces, hyphens, and periods.";

export const POSTAL_CODE_MESSAGE = "Please enter a valid postal code (4-10 digits).";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/;
const CITY_STATE_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
const CLUB_NAME_RE = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.&'\-]*$/;
const STRONG_PASSWORD_RE =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/** Country dial code → expected national number length (min, max). */
export const PHONE_LENGTH_BY_CODE = {
    "+91": [10, 10],
    "+1": [10, 10],
    "+44": [10, 11],
    "+49": [10, 11],
    "+61": [9, 9],
    "+971": [9, 9],
};

export const PHONE_COUNTRY_CODES = [
    { code: "+91", label: "India (+91)" },
    { code: "+1", label: "US/Canada (+1)" },
    { code: "+44", label: "UK (+44)" },
    { code: "+49", label: "Germany (+49)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+971", label: "UAE (+971)" },
];

export function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

export function isValidEmail(value) {
    const v = String(value || "").trim();
    return EMAIL_RE.test(v);
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
    if (!v || /^\d+$/.test(v)) return false;
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
    if (!d || /\D/.test(String(digits || "").replace(/[\s\-()]/g, ""))) {
        // allow formatted input if digits-only portion is valid
    }
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

export const DOB_MESSAGE = "Please enter a valid Date of Birth in DD/MM/YYYY format.";

/** Format digits input into DD/MM/YYYY date pattern. */
export function formatDobInput(value) {
    const rawDigits = digitsOnly(value).slice(0, 8);
    if (rawDigits.length <= 2) return rawDigits;
    if (rawDigits.length <= 4) return `${rawDigits.slice(0, 2)}/${rawDigits.slice(2)}`;
    return `${rawDigits.slice(0, 2)}/${rawDigits.slice(2, 4)}/${rawDigits.slice(4, 8)}`;
}

/** Validate DD/MM/YYYY date format. */
export function isValidDob(value) {
    const v = String(value || "").trim();
    if (!v) return false;
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


