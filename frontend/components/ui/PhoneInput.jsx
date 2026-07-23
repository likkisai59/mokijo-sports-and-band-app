"use client";

import {
    PHONE_COUNTRY_CODES_SORTED,
    PHONE_LENGTH_BY_CODE,
    digitsOnly,
    phoneLengthMessage,
} from "@/lib/validation";

function encodeOption(c) {
    return `${c.iso}:${c.code}`;
}

function decodeOption(value) {
    const idx = String(value || "").indexOf(":");
    if (idx === -1) return { iso: "IN", code: "+91" };
    return {
        iso: value.slice(0, idx),
        code: value.slice(idx + 1),
    };
}

function resolveOptionValue(countryCode) {
    const preferred = {
        "+91": "IN",
        "+1": "US",
        "+44": "GB",
        "+7": "RU",
    };
    const wantIso = preferred[countryCode];
    const match =
        (wantIso &&
            PHONE_COUNTRY_CODES_SORTED.find((c) => c.code === countryCode && c.iso === wantIso)) ||
        PHONE_COUNTRY_CODES_SORTED.find((c) => c.code === countryCode) ||
        PHONE_COUNTRY_CODES_SORTED.find((c) => c.iso === "IN");
    return encodeOption(match);
}

/**
 * Country-code select + digit-only phone field.
 * Shows ~195 countries; caps length by dial code (India = 10).
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
    maxDigits,
}) {
    const range = PHONE_LENGTH_BY_CODE[countryCode] || [8, 15];
    const digitCap = maxDigits ?? range[1] ?? 15;
    const rangeHint = phoneLengthMessage(countryCode);

    return (
        <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "stretch" }}>
            <select
                className={selectClassName || className}
                value={resolveOptionValue(countryCode)}
                onChange={(e) => {
                    const { code } = decodeOption(e.target.value);
                    onCountryCodeChange?.(code);
                }}
                disabled={disabled}
                aria-label="Country code"
                style={{
                    maxWidth: "220px",
                    flexShrink: 0,
                }}
            >
                {PHONE_COUNTRY_CODES_SORTED.map((c) => (
                    <option key={c.iso} value={encodeOption(c)}>
                        {c.label} ({c.code})
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
                maxLength={digitCap}
                aria-describedby={id ? `${id}-hint` : undefined}
                onChange={(e) => {
                    const next = digitsOnly(e.target.value).slice(0, digitCap);
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
