"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Star, 
  Save,
  Youtube,
  Compass
} from "lucide-react";
import toast from "react-hot-toast";

const ALBUMS = ["Main Hall", "Dining Area", "Exterior/Garden", "Lobby", "General"];
const VIDEO_CATEGORIES = ["Walkthrough", "Event Setup", "Aerial View", "General"];

export function VenueMediaGallery({ media, onSave }) {
  const [coverImage, setCoverImage] = React.useState(media.cover_image || null);
  const [gallery, setGallery] = React.useState(media.gallery || []);
  const [videos, setVideos] = React.useState(media.videos || []);
  const [youtubeLinks, setYoutubeLinks] = React.useState(media.youtube_links || []);
  const [virtualTour, setVirtualTour] = React.useState(media.virtual_tour || null);

  const [saving, setSaving] = React.useState(false);

  const [newAlbumName, setNewAlbumName] = React.useState("General");
  const [newYoutubeUrl, setNewYoutubeUrl] = React.useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        cover_image: coverImage,
        gallery,
        videos,
        youtube_links: youtubeLinks,
        virtual_tour: virtualTour
      });
      toast.success("Venue gallery and media saved successfully!");
    } catch {
      toast.error("Failed to save media changes.");
    } finally {
      setSaving(false);
    }
  };

  const addImageToGallery = (url) => {
    if (!url) return;
    const newItem = {
      url,
      is_cover: gallery.length === 0 && !coverImage,
      album: newAlbumName
    };
    setGallery(prev => [...prev, newItem]);
    if (gallery.length === 0 && !coverImage) {
      setCoverImage(url);
    }
  };

  const removeImage = (idx) => {
    setGallery(prev => {
      const current = [...prev];
      const wasCover = current[idx]?.is_cover;
      current.splice(idx, 1);
      
      if (wasCover && current.length > 0) {
        current[0].is_cover = true;
        setCoverImage(current[0].url);
      } else if (current.length === 0) {
        setCoverImage(null);
      }
      return current;
    });
  };

  const setAsCover = (idx) => {
    setGallery(prev => 
      prev.map((item, i) => ({
        ...item,
        is_cover: i === idx
      }))
    );
    setCoverImage(gallery[idx].url);
    toast.success("Cover banner updated!");
  };

  const moveImage = (idx, direction) => {
    setGallery(prev => {
      const current = [...prev];
      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= current.length) return prev;
      
      const temp = current[idx];
      current[idx] = current[targetIdx];
      current[targetIdx] = temp;
      return current;
    });
  };

  const handleAlbumChange = (idx, album) => {
    setGallery(prev => 
      prev.map((item, i) => i === idx ? { ...item, album } : item)
    );
  };

  const addVideoFile = (url) => {
    if (!url) return;
    const newItem = {
      url,
      category: "Walkthrough"
    };
    setVideos(prev => [...prev, newItem]);
  };

  const removeVideoFile = (idx) => {
    setVideos(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  const handleVideoCategoryChange = (idx, category) => {
    setVideos(prev => 
      prev.map((item, i) => i === idx ? { ...item, category } : item)
    );
  };

  const addYoutube = () => {
    if (!newYoutubeUrl.trim()) return;
    if (!newYoutubeUrl.includes("youtube.com") && !newYoutubeUrl.includes("youtu.be")) {
      toast.error("Please enter a valid YouTube video link.");
      return;
    }
    setYoutubeLinks(prev => [...prev, newYoutubeUrl.trim()]);
    setNewYoutubeUrl("");
    toast.success("YouTube link added!");
  };

  const removeYoutube = (idx) => {
    setYoutubeLinks(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
      }}
    >
      {/* ── Top Header & Save Banner ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <ImageIcon style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.01em" }}>
              Venue Media Showcase &amp; Gallery
            </h1>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Upload high-resolution photography, concert stages, walkthrough videos, and 360° virtual tours.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 28px",
            borderRadius: "14px",
            backgroundColor: "#c6ff3d",
            color: "#0a0a0f",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <Save style={{ width: "17px", height: "17px" }} />
          <span>{saving ? "Saving Media..." : "Save Media Configuration"}</span>
        </button>
      </div>

      {/* ── Cover Banner Section ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Star style={{ width: "16px", height: "16px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Primary Cover Banner Image
            </h2>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>The main hero picture displayed across client searches and marketplace listings.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "center" }}>
          <div>
            {coverImage ? (
              <div style={{ position: "relative", width: "100%", height: "240px", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
                <Image src={coverImage} alt="Cover Banner" fill style={{ objectFit: "cover" }} />
                <button 
                  type="button" 
                  onClick={() => setCoverImage(null)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(225, 29, 72, 0.9)",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </button>
                <div style={{ position: "absolute", bottom: "12px", left: "12px", backgroundColor: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(6px)", padding: "4px 12px", borderRadius: "8px", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Star style={{ width: "12px", height: "12px", fill: "#c6ff3d" }} /> Active Marketplace Cover
                </div>
              </div>
            ) : (
              <div style={{ width: "100%", height: "240px", backgroundColor: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                <ImageIcon style={{ width: "36px", height: "36px", color: "#94a3b8" }} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>No Cover Banner Assigned</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Upload a new image below or choose one from your gallery.</span>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Upload New Cover Photo</span>
            <ImageUpload 
              onChange={(url) => setCoverImage(url)}
              subfolder="venues/covers"
            />
          </div>
        </div>
      </div>

      {/* ── Walkthrough Videos ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <VideoIcon style={{ width: "16px", height: "16px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Direct Video Clips (Max 20MB)
            </h2>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>Upload video files directly showcasing room acoustic setups and stage lighting.</p>
          </div>
        </div>

        <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <VideoUpload 
            onChange={addVideoFile}
            subfolder="venues/videos"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {videos.map((v, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#0a0a0f" }}>
                <video src={v.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button 
                  type="button" 
                  onClick={() => removeVideoFile(idx)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(225, 29, 72, 0.9)",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Trash2 style={{ width: "14px", height: "14px" }} />
                </button>
              </div>

              <div style={{ padding: "12px" }}>
                <span style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "4px" }}>Video Category</span>
                <select
                  value={v.category}
                  onChange={e => handleVideoCategoryChange(idx, e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#f8fafc",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    outline: "none",
                  }}
                >
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2-Column: YouTube Embeds & Matterport 360° ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        
        {/* YouTube Section */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#e11d48" }}>
              <Youtube style={{ width: "16px", height: "16px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                YouTube Performance Embeds
              </h2>
              <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>Paste concert recordings and drone showreels.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              placeholder="https://www.youtube.com/watch?v=..." 
              value={newYoutubeUrl}
              onChange={e => setNewYoutubeUrl(e.target.value)}
              style={{
                flex: 1,
                height: "40px",
                padding: "0 14px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={addYoutube}
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "10px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontWeight: 900,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Plus style={{ width: "15px", height: "15px" }} />
              <span>Add</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
            {youtubeLinks.map((link, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontSize: "12px", color: "#0a0a0f", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
                  {link}
                </span>
                <button
                  type="button"
                  onClick={() => removeYoutube(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e11d48",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <Trash2 style={{ width: "15px", height: "15px" }} />
                </button>
              </div>
            ))}

            {youtubeLinks.length === 0 && (
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                No YouTube links added yet.
              </p>
            )}
          </div>
        </div>

        {/* Matterport 360° Section */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <Compass style={{ width: "16px", height: "16px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Matterport 360° Virtual Tour
              </h2>
              <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>Allow guests to walk through the hall in interactive 3D.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>360° Tour Shareable Link</label>
            <input
              placeholder="https://my.matterport.com/show/?m=..." 
              value={virtualTour || ""}
              onChange={e => setVirtualTour(e.target.value || null)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 14px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {virtualTour && (
              <div style={{ padding: "12px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", fontSize: "12px" }}>
                <span style={{ color: "#15803d", fontWeight: 800, display: "block" }}>✓ Virtual Tour URL Active</span>
                <span style={{ color: "#475569", fontSize: "11px", wordBreak: "break-all" }}>{virtualTour}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
