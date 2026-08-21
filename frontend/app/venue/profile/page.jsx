"use client";

import * as React from "react";
import { bandVenueService as venueService } from "@/services/bandVenueService";
import { VenueProfileEdit } from "@/components/venue/VenueProfileEdit";
import { VenueProfilePreview } from "@/components/venue/VenueProfilePreview";
import { VenueMediaGallery } from "@/components/venue/VenueMediaGallery";
import { VenueFacilities } from "@/components/venue/VenueFacilities";
import { VenuePricing } from "@/components/venue/VenuePricing";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Eye, Edit3, Image as ImageIcon, Sliders, DollarSign, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

export default function VenueProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [activeTab, setActiveTab] = React.useState("edit");

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["edit", "facilities", "pricing", "media", "preview"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    router.push(`/venue/profile?tab=${val}`, { scroll: false });
  };

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await venueService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Venue profile fetch failed:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error?.message || "Failed to load venue profile.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateSuccess = async (formData) => {
    try {
      const updated = await venueService.updateProfile(formData);
      setProfile(updated);
      toast.success("Venue profile details updated successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error?.message || "Failed to save profile changes.";
      toast.error(errMsg);
    }
  };

  const handleMediaSave = async (mediaData) => {
    try {
      const updatedMedia = await venueService.updateMedia(mediaData);
      if (profile) {
        setProfile({
          ...profile,
          gallery: updatedMedia.gallery,
          metadata_fields: {
            ...profile.metadata_fields,
            cover_image: updatedMedia.cover_image,
            youtube_links: updatedMedia.youtube_links,
            virtual_tour: updatedMedia.virtual_tour
          }
        });
      }
      toast.success("Media gallery updated successfully!");
    } catch (err) {
      toast.error("Failed to save media changes.");
      throw err;
    }
  };

  const handleFacilitiesSave = async (facData) => {
    try {
      const updated = await venueService.updateFacilities(facData);
      if (profile) {
        setProfile({
          ...profile,
          facilities: updated.facilities,
          metadata_fields: {
            ...profile.metadata_fields,
            facility_details: updated.details
          }
        });
      }
      toast.success("Facilities configuration saved successfully!");
    } catch (err) {
      toast.error("Failed to save facilities.");
      throw err;
    }
  };

  const handlePricingSave = async (pricingData) => {
    try {
      const updated = await venueService.updatePricing(pricingData);
      if (profile) {
        setProfile({
          ...profile,
          base_price: updated.base_price,
          pricing_details: {
            ...profile.pricing_details,
            hourly_price: updated.hourly_price,
            half_day_price: updated.half_day_price,
            full_day_price: updated.full_day_price,
            weekend_price: updated.weekend_price,
            holiday_price: updated.holiday_price,
            security_deposit: updated.security_deposit,
            cleaning_charges: updated.cleaning_charges,
            cancellation_charges: updated.cancellation_charges,
            discounts: updated.discounts,
            tax_percentage: updated.tax_percentage,
            currency: updated.currency
          }
        });
      }
      toast.success("Pricing configurations saved successfully!");
    } catch (err) {
      toast.error("Failed to save pricing rules.");
      throw err;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Spinner className="h-10 w-10" style={{ color: "#0a0a0f" }} />
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#64748b" }}>
          Loading venue workspace profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "65vh", padding: "16px" }}>
        <ErrorState 
          title="Profile Load Failure"
          message={error || "An unexpected error occurred while loading your profile data."} 
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  const galleryImages = [];
  const galleryVideos = [];
  
  if (Array.isArray(profile.gallery)) {
    profile.gallery.forEach((item) => {
      if (item && typeof item === "object") {
        if (item.type === "video") {
          galleryVideos.push({
            url: item.url ?? "",
            category: item.category || "General"
          });
        } else {
          galleryImages.push({
            url: item.url ?? "",
            is_cover: !!item.is_cover,
            album: item.album || "General"
          });
        }
      } else if (typeof item === "string") {
        if (item.endsWith(".mp4") || item.endsWith(".mov") || item.endsWith(".avi") || item.endsWith(".webm")) {
          galleryVideos.push({ url: item, category: "General" });
        } else {
          galleryImages.push({
            url: item,
            is_cover: item === profile.metadata_fields?.cover_image,
            album: "General"
          });
        }
      }
    });
  }

  const componentMediaData = {
    cover_image: profile.metadata_fields?.cover_image || null,
    gallery: galleryImages,
    videos: galleryVideos,
    youtube_links: profile.metadata_fields?.youtube_links || [],
    virtual_tour: profile.metadata_fields?.virtual_tour || null
  };

  const componentFacilitiesData = {
    facilities: profile.facilities || [],
    details: profile.metadata_fields?.facility_details || {}
  };

  const componentPricingData = {
    base_price: profile.base_price || 0,
    hourly_price: profile.pricing_details?.hourly_price || 0,
    half_day_price: profile.pricing_details?.half_day_price || 0,
    full_day_price: profile.pricing_details?.full_day_price || 0,
    weekend_price: profile.pricing_details?.weekend_price || 0,
    holiday_price: profile.pricing_details?.holiday_price || 0,
    security_deposit: profile.pricing_details?.security_deposit || 0,
    cleaning_charges: profile.pricing_details?.cleaning_charges || 0,
    cancellation_charges: profile.pricing_details?.cancellation_charges || 0,
    discounts: profile.pricing_details?.discounts || [],
    tax_percentage: profile.pricing_details?.tax_percentage || 0,
    currency: profile.pricing_details?.currency || "INR"
  };

  const tabs = [
    { id: "edit", label: "Venue Details", icon: Edit3 },
    { id: "facilities", label: "Facilities & Specs", icon: Sliders },
    { id: "pricing", label: "Rental Pricing", icon: DollarSign },
    { id: "media", label: "Photo Gallery", icon: ImageIcon },
    { id: "preview", label: "Public Preview", icon: Eye },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
      
      {/* Top Header Banner */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingBottom: "8px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "10px" }}>
            <Building2 style={{ width: "13px", height: "13px" }} />
            <span>Venue Host Management Hub</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.02em", margin: 0 }}>
            {profile.name || "Venue Space Configuration"}
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: "6px 0 0 0", fontWeight: 500 }}>
            Configure capacity limits, stage acoustics, rental packages, photo galleries, and preview public marketplace listing.
          </p>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "14px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <span style={{ width: "9px", height: "9px", borderRadius: "9999px", backgroundColor: profile.verification_status === "approved" ? "#10b981" : "#f59e0b" }} />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>
            Status: <span style={{ textTransform: "uppercase", color: profile.verification_status === "approved" ? "#047857" : "#b45309" }}>{profile.verification_status || "Approved"}</span>
          </span>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ffffff", padding: "8px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: isActive ? 900 : 700,
                backgroundColor: isActive ? "#0a0a0f" : "transparent",
                color: isActive ? "#c6ff3d" : "#475569",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 4px 12px rgba(10,10,15,0.2)" : "none",
              }}
            >
              <Icon style={{ width: "15px", height: "15px" }} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div style={{ width: "100%" }}>
        {activeTab === "edit" && (
          <VenueProfileEdit profile={profile} onSuccess={handleUpdateSuccess} />
        )}
        {activeTab === "facilities" && (
          <VenueFacilities data={componentFacilitiesData} onSave={handleFacilitiesSave} />
        )}
        {activeTab === "pricing" && (
          <VenuePricing data={componentPricingData} onSave={handlePricingSave} />
        )}
        {activeTab === "media" && (
          <VenueMediaGallery media={componentMediaData} onSave={handleMediaSave} />
        )}
        {activeTab === "preview" && (
          <VenueProfilePreview profile={profile} />
        )}
      </div>

    </div>
  );
}
