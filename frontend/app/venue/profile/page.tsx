"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";
import { VenueResponseData, VenueMediaData, VenueGalleryItem, VenueVideoItem, VenueFacilitiesData, VenuePricingData } from "@/types/venue";
import { VenueProfileUpdateFormData } from "@/utils/validation";
import { VenueProfileEdit } from "@/components/venue/VenueProfileEdit";
import { VenueProfilePreview } from "@/components/venue/VenueProfilePreview";
import { VenueMediaGallery } from "@/components/venue/VenueMediaGallery";
import { VenueFacilities } from "@/components/venue/VenueFacilities";
import { VenuePricing } from "@/components/venue/VenuePricing";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Edit3, Image as ImageIcon, Sliders, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface APIErrorResponse {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export default function VenueProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = React.useState<VenueResponseData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<string>("edit");

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["edit", "facilities", "pricing", "media", "preview"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
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
      const errorResponse = err as APIErrorResponse;
      const msg = errorResponse.response?.data?.error?.message || "Failed to load venue profile.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateSuccess = async (formData: VenueProfileUpdateFormData) => {
    try {
      const updated = await venueService.updateProfile(formData);
      setProfile(updated);
      toast.success("Venue profile details updated successfully!");
    } catch (err) {
      const errorResponse = err as APIErrorResponse;
      const errMsg = errorResponse.response?.data?.error?.message || "Failed to save profile changes.";
      toast.error(errMsg);
    }
  };

  const handleMediaSave = async (mediaData: VenueMediaData) => {
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
    } catch (err) {
      toast.error("Failed to save media changes.");
      throw err;
    }
  };

  const handleFacilitiesSave = async (facData: VenueFacilitiesData) => {
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

  const handlePricingSave = async (pricingData: VenuePricingData) => {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Loading venue owner profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] p-4">
        <ErrorState 
          title="Profile Load Failure"
          message={error || "An unexpected error occurred while loading your profile data."} 
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  // Parse structured images and videos lists dynamically from profile state
  const galleryImages: VenueGalleryItem[] = [];
  const galleryVideos: VenueVideoItem[] = [];
  
  if (Array.isArray(profile.gallery)) {
    profile.gallery.forEach((item: string | { type?: string; url?: string; category?: string; is_cover?: boolean; album?: string }) => {
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

  const componentMediaData: VenueMediaData = {
    cover_image: profile.metadata_fields?.cover_image || null,
    gallery: galleryImages,
    videos: galleryVideos,
    youtube_links: profile.metadata_fields?.youtube_links || [],
    virtual_tour: profile.metadata_fields?.virtual_tour || null
  };

  const componentFacilitiesData: VenueFacilitiesData = {
    facilities: profile.facilities || [],
    details: profile.metadata_fields?.facility_details || {}
  };

  const componentPricingData: VenuePricingData = {
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
          Venue Space Management
        </h1>
        <p className="text-xs text-text-secondary">
          Configure capacities, locations, media galleries, facility amenities, rental pricing packages, and preview the public presentation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-bg-elevated border border-border/80 p-1 rounded-xl flex flex-wrap gap-1 self-start max-w-2xl mb-4">
          <TabsTrigger value="edit" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-[18%] justify-center">
            <Edit3 className="h-3.5 w-3.5" />
            <span>Venue Details</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-[18%] justify-center">
            <Sliders className="h-3.5 w-3.5" />
            <span>Facilities</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-[18%] justify-center">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-[18%] justify-center">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Gallery</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-[18%] justify-center">
            <Eye className="h-3.5 w-3.5" />
            <span>Public Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <VenueProfileEdit profile={profile} onSuccess={handleUpdateSuccess} />
        </TabsContent>

        <TabsContent value="facilities">
          <VenueFacilities data={componentFacilitiesData} onSave={handleFacilitiesSave} />
        </TabsContent>

        <TabsContent value="pricing">
          <VenuePricing data={componentPricingData} onSave={handlePricingSave} />
        </TabsContent>

        <TabsContent value="media">
          <VenueMediaGallery media={componentMediaData} onSave={handleMediaSave} />
        </TabsContent>

        <TabsContent value="preview">
          <VenueProfilePreview profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



