"use client";

import * as React from "react";
import { artistService } from "@/services/artistService";
import { ArtistProfile, MediaGalleryData, PricingData } from "@/types/artist";
import { ArtistProfileUpdateFormData } from "@/utils/validation";
import { ArtistProfileEdit } from "@/components/artist/ArtistProfileEdit";
import { ArtistProfilePreview } from "@/components/artist/ArtistProfilePreview";
import { ArtistMediaGallery } from "@/components/artist/ArtistMediaGallery";
import { ArtistPricing } from "@/components/artist/ArtistPricing";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Edit3, Image as ImageIcon, DollarSign } from "lucide-react";
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

export default function ArtistProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [profile, setProfile] = React.useState<ArtistProfile | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<string>("edit");

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["edit", "media", "pricing", "preview"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.push(`/artist/profile?tab=${val}`, { scroll: false });
  };

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await artistService.getProfile();
      setProfile(data);
    } catch (err) {
      const errorResponse = err as APIErrorResponse;
      const msg = errorResponse.response?.data?.error?.message || "Failed to load performer profile.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateSuccess = async (formData: ArtistProfileUpdateFormData) => {
    try {
      const updated = await artistService.updateProfile(formData);
      setProfile(updated);
      toast.success("Profile details updated successfully!");
    } catch (err) {
      const errorResponse = err as APIErrorResponse;
      const errMsg = errorResponse.response?.data?.error?.message || "Failed to update profile settings.";
      toast.error(errMsg);
    }
  };

  const handleMediaSave = async (mediaData: MediaGalleryData) => {
    try {
      const updatedMedia = await artistService.updateMedia(mediaData);
      if (profile) {
        setProfile({
          ...profile,
          gallery: updatedMedia.gallery,
          videos: updatedMedia.videos,
          youtube_links: updatedMedia.youtube_links,
          instagram_reels: updatedMedia.instagram_reels
        });
      }
    } catch (error) {
      toast.error("Failed to save media changes.");
      throw error;
    }
  };

  const handlePricingSave = async (pricingData: PricingData) => {
    try {
      const updatedPricing = await artistService.updatePricing(pricingData);
      if (profile) {
        setProfile({
          ...profile,
          base_rate: updatedPricing.base_rate,
          currency: updatedPricing.currency,
          travel_radius: updatedPricing.travel_radius ?? profile.travel_radius,
          travel_charges: updatedPricing.travel_charges,
          min_booking_hours: updatedPricing.min_booking_hours,
          max_booking_hours: updatedPricing.max_booking_hours,
          pricing_details: {
            ...profile.pricing_details,
            weekend_surcharge: updatedPricing.weekend_surcharge,
            holiday_surcharge: updatedPricing.holiday_surcharge,
            packages: updatedPricing.packages,
            special_offers: updatedPricing.special_offers
          }
        });
      }
    } catch (error) {
      toast.error("Failed to save pricing changes.");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Loading performer profile...
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

  // Build temporary PricingData format from profile state to pass to component
  const componentPricingData = {
    base_rate: profile.base_rate,
    currency: profile.currency,
    travel_radius: profile.travel_radius,
    travel_charges: profile.travel_charges,
    min_booking_hours: profile.min_booking_hours,
    max_booking_hours: profile.max_booking_hours,
    weekend_surcharge: profile.pricing_details?.weekend_surcharge || 0,
    holiday_surcharge: profile.pricing_details?.holiday_surcharge || 0,
    packages: profile.pricing_details?.packages || [],
    special_offers: profile.pricing_details?.special_offers || []
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
          Public Profile Management
        </h1>
        <p className="text-xs text-text-secondary">
          Customize your presentation and review the public layout displayed to potential clients.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-bg-elevated border border-border/80 p-1 rounded-xl flex gap-1 self-start max-w-xl mb-4">
          <TabsTrigger value="edit" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-1/4 justify-center">
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-1/4 justify-center">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Gallery / Media</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-1/4 justify-center">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-1/4 justify-center">
            <Eye className="h-3.5 w-3.5" />
            <span>Public Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <ArtistProfileEdit profile={profile} onSuccess={handleUpdateSuccess} />
        </TabsContent>

        <TabsContent value="media">
          <ArtistMediaGallery media={profile} onSave={handleMediaSave} />
        </TabsContent>

        <TabsContent value="pricing">
          <ArtistPricing pricing={componentPricingData} onSave={handlePricingSave} />
        </TabsContent>

        <TabsContent value="preview">
          <ArtistProfilePreview profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
