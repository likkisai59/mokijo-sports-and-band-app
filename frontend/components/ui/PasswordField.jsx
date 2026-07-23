"use client";

import { useState } from "react";

/**
 * Password input with show/hide eye toggle.
 * Pass `className` for the input; wrapper is relative.
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
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: "relative", width: "100%", ...(style || {}) }}>
            <input
                id={id}
                name={name}
                type={visible ? "text" : "password"}
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoComplete={autoComplete}
                style={{ paddingRight: "44px", width: "100%", boxSizing: "border-box" }}
            />
            <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "4px",
                    color: "rgba(244,244,245,0.7)",
                    fontSize: "14px",
                    lineHeight: 1,
                }}
            >
                {visible ? "Hide" : "Show"}
            </button>
        </div>
    );
}
