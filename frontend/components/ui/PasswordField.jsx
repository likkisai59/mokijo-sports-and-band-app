"use client";

import { useState } from "react";

/**
 * Password input with show/hide eye toggle.
 * Pass className for the input to match existing form styles.
 */
export default function PasswordField({
    value,
    onChange,
    placeholder = "Create a strong password",
    className = "",
    disabled = false,
    id,
    name = "password",
    required = false,
    style,
    autoComplete = "new-password",
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                id={id}
                name={name}
                type={visible ? "text" : "password"}
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                style={{ ...(style || {}), paddingRight: "44px", width: "100%", boxSizing: "border-box" }}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                aria-label={visible ? "Hide password" : "Show password"}
                title={visible ? "Hide password" : "Show password"}
                style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "4px",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                }}
            >
                {visible ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}
