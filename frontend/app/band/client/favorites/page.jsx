"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Music,
  Building2,
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
  Trash2,
  Inbox,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ClientFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all"); // all | artists | venues

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem("band_client_favorites");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          } else {
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("Failed to parse saved favorites:", err);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleRemoveFavorite = (id) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      try {
        localStorage.setItem("band_client_favorites", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update saved favorites:", e);
      }
      return updated;
    });
    toast.success("Removed from favorites");
  };

  const filteredItems = favorites.filter((f) => {
    if (activeType === "all") return true;
    if (activeType === "artists") return f.type === "artist";
    if (activeType === "venues") return f.type === "venue";
    return true;
  });

  return (
    <DashboardLayout role="client">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              <Heart style={{ width: "13px", height: "13px" }} />
              <span>Shortlisted Providers</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Saved Artists &amp; Venues
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
              Quick access to your bookmarked performers, live bands, and concert halls for fast quote comparison.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", backgroundColor: "#ffffff", padding: "4px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            {[
              { id: "all", label: "All Saved" },
              { id: "artists", label: "Artists" },
              { id: "venues", label: "Venues" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeType === tab.id ? "#0a0a0f" : "transparent",
                  color: activeType === tab.id ? "#c6ff3d" : "#64748b",
                  fontWeight: activeType === tab.id ? 800 : 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites Grid */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              borderRadius: "24px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <Heart style={{ width: "28px", height: "28px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                No Saved Favorites Yet
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "400px", lineHeight: 1.5 }}>
                Browse verified performers and concert halls and tap the heart icon to save them here.
              </p>
            </div>
            <Link
              to="/band/artists"
              style={{
                marginTop: "4px",
                padding: "10px 22px",
                borderRadius: "12px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 900,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
              }}
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "22px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        backgroundColor: item.type === "artist" ? "#ecfdf5" : "#eff6ff",
                        color: item.type === "artist" ? "#047857" : "#2563eb",
                        border: item.type === "artist" ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                      }}
                    >
                      {item.type === "artist" ? "Verified Performer" : "Concert Venue"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(item.id)}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                      title="Remove from favorites"
                    >
                      <Trash2 style={{ width: "15px", height: "15px" }} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
                    {item.genre} · {item.location}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                    <Star style={{ width: "14px", height: "14px", fill: "#f59e0b", color: "#f59e0b" }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0a0a0f" }}>{item.rating}</span>
                    <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>({item.reviews_count} reviews)</span>
                  </div>
                </div>

                <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Starting Rate</span>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f" }}>{item.price}</span>
                  </div>

                  <Link
                    to={item.link}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#0a0a0f",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    View Listing →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
