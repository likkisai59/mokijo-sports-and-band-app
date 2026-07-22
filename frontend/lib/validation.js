/** Shared form validators for club admin + member registration. */

export const STRONG_PASSWORD_MESSAGE =
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

export const PHONE_LENGTH_BY_CODE = {
    "+91": 10,
    "+1": 10,
    "+44": 10,
    "+49": { min: 10, max: 11 },
    "+61": 9,
    "+971": 9,
    "+65": 8,
    "+81": { min: 10, max: 11 },
    "+86": 11,
    "+33": 9,
    "+39": { min: 9, max: 10 },
};

export const PHONE_COUNTRY_CODES = [
    { code: "+91", label: "India (+91)" },
    { code: "+1", label: "USA/Canada (+1)" },
    { code: "+44", label: "UK (+44)" },
    { code: "+49", label: "Germany (+49)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+971", label: "UAE (+971)" },
    { code: "+65", label: "Singapore (+65)" },
    { code: "+81", label: "Japan (+81)" },
    { code: "+86", label: "China (+86)" },
    { code: "+33", label: "France (+33)" },
    { code: "+39", label: "Italy (+39)" },
];

export function isStrongPassword(password) {
    if (!password || typeof password !== "string") return false;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) return false;
    return true;
}

export function isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim();
    // Practical email format: local@domain.tld
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function isValidPersonName(name) {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    // Letters, spaces, hyphens, apostrophes (e.g. Mary-Jane, O'Brien)
    return /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/.test(trimmed);
}

export function isValidClubName(name) {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    // Letters, numbers, spaces, hyphens
    return /^[A-Za-z0-9]+(?:[ \-][A-Za-z0-9]+)*$/.test(trimmed);
}

export function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

export function getPhoneLengthRule(countryCode) {
    return PHONE_LENGTH_BY_CODE[countryCode] || 10;
}

export function isValidPhoneDigits(digits, countryCode = "+91") {
    const clean = digitsOnly(digits);
    const rule = getPhoneLengthRule(countryCode);
    if (typeof rule === "number") {
        return clean.length === rule;
    }
    return clean.length >= rule.min && clean.length <= rule.max;
}

export function getPhoneMaxLength(countryCode = "+91") {
    const rule = getPhoneLengthRule(countryCode);
    return typeof rule === "number" ? rule : rule.max;
}

export function formatPhoneForStorage(countryCode, digits) {
    const clean = digitsOnly(digits);
    return `${countryCode}${clean}`;
}

export function isValidAadhaar(value) {
    return /^\d{12}$/.test(digitsOnly(value));
}

export function formatAadhaarDisplay(value) {
    const clean = digitsOnly(value).slice(0, 12);
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
        parts.push(clean.slice(i, i + 4));
    }
    return parts.join(" ");
}

export function personNameError(name, label = "Name") {
    if (!String(name || "").trim()) return `${label} is required`;
    if (!isValidPersonName(name)) {
        return `${label} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return null;
}

export function clubNameError(name) {
    if (!String(name || "").trim()) return "Club name is required";
    if (!isValidClubName(name)) {
        return "Club name can only contain letters, numbers, spaces, and hyphens";
    }
    return null;
}

export function emailError(email) {
    if (!String(email || "").trim()) return "Email is required";
    if (!isValidEmail(email)) {
        return "Please enter a valid email address (e.g., name@example.com).";
    }
    return null;
}

export function passwordError(password) {
    if (!String(password || "").trim()) return "Password is required";
    if (!isStrongPassword(password)) return STRONG_PASSWORD_MESSAGE;
    return null;
}

export function phoneError(digits, countryCode = "+91") {
    const clean = digitsOnly(digits);
    if (!clean) return "Phone number is required";
    if (/\D/.test(String(digits || "").replace(/\s/g, "")) && clean !== digitsOnly(digits)) {
        return "Phone number can only contain digits.";
    }
    if (!isValidPhoneDigits(clean, countryCode)) {
        const rule = getPhoneLengthRule(countryCode);
        const lenMsg =
            typeof rule === "number"
                ? `exactly ${rule} digits`
                : `${rule.min}-${rule.max} digits`;
        return `Phone number must be ${lenMsg} for ${countryCode}.`;
    }
    return null;
}

export function aadhaarError(value) {
    if (!String(value || "").trim()) return "Aadhaar number is required";
    if (!isValidAadhaar(value)) return "Aadhaar number must be exactly 12 digits.";
    return null;
}
