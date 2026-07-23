"use client";

import {
    PHONE_COUNTRY_CODES,
    digitsOnly,
    phoneLengthMessage,
} from "@/lib/validation";

/**
 * Country-code select + digit-only phone field.
 * onChange(fullValueOrDigits, meta) where meta = { countryCode, digits }
 * By default calls onChange with composed "+91 9876543210" string if onCompose is not used.
 */
export default function PhoneInput({
    countryCode = "+91",
    digits = "",
    onCountryCodeChange,
    onDigitsChange,
    className = "",
    selectClassName = "",
    disabled = false,
    placeholder = "00000 00000",
    id,
}) {
    const rangeHint = phoneLengthMessage(countryCode);

    return (
        <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "stretch" }}>
            <select
                className={selectClassName || className}
                value={countryCode}
                onChange={(e) => onCountryCodeChange?.(e.target.value)}
                disabled={disabled}
                aria-label="Country code"
                style={{
                    maxWidth: "140px",
                    flexShrink: 0,
                    ...(selectClassName ? {} : {}),
                }}
            >
                {PHONE_COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.code}
                    </option>
                ))}
            </select>
            <input
                id={id}
                type="tel"
                inputMode="numeric"
                className={className}
                placeholder={placeholder}
                value={digits}
                disabled={disabled}
                aria-describedby={id ? `${id}-hint` : undefined}
                onChange={(e) => {
                    const next = digitsOnly(e.target.value).slice(0, 15);
                    onDigitsChange?.(next);
                }}
                style={{ flex: 1, minWidth: 0 }}
            />
            {id ? (
                <span id={`${id}-hint`} style={{ display: "none" }}>
                    {rangeHint}
                </span>
            ) : null}
        </div>
    );
}
