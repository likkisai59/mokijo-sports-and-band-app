"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifySignupContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/signup-submissions/verify-email?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus("success");
                    setMessage(data.message || "Your email has been successfully verified!");
                } else {
                    setStatus("error");
                    setMessage(data.detail || "Verification failed. The link may be expired or invalid.");
                }
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("error");
                setMessage("Could not connect to the server. Please try again later.");
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div style={styles.container}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <div style={styles.card}>
                <div style={styles.iconContainer}>
                    {status === "verifying" && <div style={styles.spinner}></div>}
                    {status === "success" && <div style={styles.successIcon}>✓</div>}
                    {status === "error" && <div style={styles.errorIcon}>✕</div>}
                </div>

                <h1 style={styles.title}>
                    {status === "verifying" && "Verifying..."}
                    {status === "success" && "Verified!"}
                    {status === "error" && "Failed"}
                </h1>

                <p style={styles.message}>{message}</p>

                {status === "success" && (
                    <p style={styles.note}>
                        Note: the club admin still needs to approve your application before you can log in.
                    </p>
                )}

                {(status === "success" || status === "error") && (
                    <Link href="/" style={styles.button}>
                        {status === "success" ? "Go to Home" : "Try Again"}
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function VerifySignupPage() {
    return (
        <Suspense fallback={<div style={{ color: "#ffffff", backgroundColor: "#08080f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
            <VerifySignupContent />
        </Suspense>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#08080f",
        fontFamily: "'Inter', sans-serif",
    },
    card: {
        backgroundColor: "#0c0c16",
        padding: "48px 40px",
        borderRadius: "16px",
        border: "1px solid rgba(217, 255, 110, 0.15)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
    },
    iconContainer: {
        marginBottom: "28px",
        display: "flex",
        justifyContent: "center",
    },
    spinner: {
        width: "60px",
        height: "60px",
        border: "4px solid rgba(217, 255, 110, 0.1)",
        borderTop: "4px solid #d9ff6e",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    successIcon: {
        width: "68px",
        height: "68px",
        backgroundColor: "rgba(198, 255, 61, 0.15)",
        border: "2px solid #c6ff3d",
        color: "#c6ff3d",
        fontSize: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 20px rgba(198, 255, 61, 0.2)",
    },
    errorIcon: {
        width: "68px",
        height: "68px",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        border: "2px solid #ef4444",
        color: "#ef4444",
        fontSize: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
    },
    title: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: "28px",
        fontWeight: "800",
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "16px",
    },
    message: {
        fontSize: "15px",
        color: "#94a3b8",
        lineHeight: "1.6",
        marginBottom: "16px",
    },
    note: {
        fontSize: "13px",
        color: "#64748b",
        lineHeight: "1.6",
        marginBottom: "32px",
    },
    button: {
        display: "inline-block",
        padding: "14px 36px",
        backgroundColor: "#c6ff3d",
        color: "#08080f",
        textDecoration: "none",
        borderRadius: "8px",
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: "14px",
        letterSpacing: "0.5px",
        boxShadow: "0 4px 15px rgba(198, 255, 61, 0.3)",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
};
