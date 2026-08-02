"use client";

import { useState } from "react";

/**
 * Password input with show/hide eye toggle.
 * Pass `className` for the input; wrapper is relative.
 * Use tone="dark" on Band-style login pages.
 */
export default function PasswordField({
    value,
    onChange,
    className = "",
    placeholder = "Password",
    disabled = false,
    id,
    name,
    autoComplete = "new-password",
    style,
    required = false,
    tone = "light",
}) {
    const [visible, setVisible] = useState(false);
    const isDark = tone === "dark";
    const toggleClass = isDark
        ? "absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1 text-[13px] font-medium text-[rgba(244,244,245,0.7)] hover:text-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-50"
        : "absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1 text-[13px] font-medium text-[#5c5c66] hover:text-[#0a0a0f] disabled:cursor-not-allowed disabled:opacity-50";

    const inputClass = isDark
        ? `${className} auth-input--with-toggle`.trim()
        : className;

    return (
        <div style={{ position: "relative", width: "100%", ...(style || {}) }}>
            <input
                id={id}
                name={name}
                type={visible ? "text" : "password"}
                className={inputClass}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoComplete={autoComplete}
                required={required}
                style={isDark ? undefined : { paddingRight: "56px", width: "100%", boxSizing: "border-box" }}
            />
            <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                className={toggleClass}
            >
                {visible ? "Hide" : "Show"}
            </button>
        </div>
    );
}
