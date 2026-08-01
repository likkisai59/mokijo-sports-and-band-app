"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    borderRadius: "10px",
                    background: "#1e293b",
                    color: "#f4f4f5",
                    fontSize: "14px",
                    fontWeight: 500,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                },
                success: {
                    iconTheme: {
                        primary: "#22c55e",
                        secondary: "#f4f4f5",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#f4f4f5",
                    },
                },
            }}
        />
    );
}
