"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#12121a",
          color: "#f0f0f5",
          border: "1px solid #2a2a3a",
        },
      }}
    />
  );
}
