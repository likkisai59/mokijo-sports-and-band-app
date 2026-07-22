"use client";

import {
    PHONE_COUNTRY_CODES,
    digitsOnly,
    getPhoneMaxLength,
} from "@/lib/validation";

/**
 * Country-code selector + digits-only phone input.
 * Calls onChange({ countryCode, digits, full }) whenever either part changes.
 */
export default function PhoneInput({
    countryCode = "+91",
    digits = "",
    onChange,
    disabled = false,
    inputClassName = "",
    selectClassName = "",
    placeholder = "Phone number",
}) {
    const maxLen = getPhoneMaxLength(countryCode);

    function emit(nextCode, nextDigits) {
        const clean = digitsOnly(nextDigits).slice(0, getPhoneMaxLength(nextCode));
        onChange?.({
            countryCode: nextCode,
            digits: clean,
            full: `${nextCode}${clean}`,
        });
    }

    return (
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <select
                className={selectClassName}
                value={countryCode}
                disabled={disabled}
                onChange={(e) => emit(e.target.value, digits)}
                style={{
                    flex: "0 0 140px",
                    maxWidth: "140px",
                }}
                aria-label="Country calling code"
            >
                {PHONE_COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.label}
                    </option>
                ))}
            </select>
            <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className={inputClassName}
                placeholder={placeholder}
                value={digits}
                disabled={disabled}
                maxLength={maxLen}
                onChange={(e) => {
                    const clean = digitsOnly(e.target.value).slice(0, maxLen);
                    emit(countryCode, clean);
                }}
                onKeyDown={(e) => {
                    // Allow control keys; block letters
                    if (
                        e.key.length === 1 &&
                        !/[0-9]/.test(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey &&
                        !e.altKey
                    ) {
                        e.preventDefault();
                    }
                }}
                style={{ flex: 1, minWidth: 0 }}
            />
        </div>
    );
}
