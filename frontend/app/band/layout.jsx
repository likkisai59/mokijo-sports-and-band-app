"use client";

import React from "react";
import "@/app/band/styles/band.css";

export default function Layout({ children }) {
  return (
    <div className="mokijo-sports-theme relative min-h-screen bg-[#f7f7f8] text-[#0a0a0f] selection:bg-[#c6ff3d] selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Ambient Radial Electric Lime Glow */}
      <div className="mokijo-ambient-glow" />

      {/* Main Band Connect Content Shell */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
