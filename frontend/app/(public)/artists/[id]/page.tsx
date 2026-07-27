"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { artistService } from "@/services/artistService";
import { ArtistProfile } from "@/types/artist";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";
import { 
  Music, 
  MapPin, 
  Play, 
  Clock, 
  Check, 
  ArrowRight,
  X,
  Award,
  Video,
  Globe,
  Youtube
} from "lucide-react";

export default function PublicArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const artistId = params.id as string;

  const [artist, setArtist] = React.useState<ArtistProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Video and Image gallery modal states
  const [activeMediaUrl, setActiveMediaUrl] = React.useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = React.useState<"image" | "video" | null>(null);

  const fetchArtistDetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await artistService.getPublicArtistDetail(artistId);
      setArtist(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load public performer details.");
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  React.useEffect(() => {
    fetchArtistDetail();
  }, [fetchArtistDetail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse font-medium">Retrieving performer profile details...</p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] p-4">
        <ErrorState 
          title="Performer Profile Not Found" 
          message={error || "This profile listing is temporarily offline or invalid."} 
          onRetry={fetchArtistDetail} 
        />
      </div>
    );
  }

  const coverImage = typeof artist.gallery?.[0] === "string"
    ? artist.gallery[0]
    : (artist.gallery?.[0] as any)?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a";
  const youtubeLinks = artist.youtube_links || [];
  
  // Equipment
  const equipment = Object.entries(artist.equipment || {})
    .filter(([_, present]) => present)
    .map(([key]) => key);

  const handleBookArtist = () => {
    const intent = {
      artistProfileId: artist.id,
      artistName: artist.display_name || artist.user?.name,
      proposedPrice: artist.base_rate,
    };

    if (!user) {
      sessionStorage.setItem("pending_booking_intent", JSON.stringify(intent));
      toast.success("Please log in to submit a booking request.");
      router.push("/login");
    } else if (user.role !== "client") {
      toast.error("Only client accounts can submit booking requests.");
    } else {
      sessionStorage.setItem("active_booking_intent", JSON.stringify(intent));
      router.push("/client/bookings");
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-16">
      
      {/* 1. HERO & GALLERY */}
      <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
        <img 
          src={coverImage} 
          alt={artist.display_name || "Performer"} 
          className="absolute inset-0 h-full w-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border border-primary/25 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">
                {artist.band_type || "Solo"}
              </Badge>
              {artist.verification_status === "approved" && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">
                  Verified Performer
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary font-heading">
              {artist.display_name || artist.user?.name}
            </h1>
            <p className="text-sm text-text-secondary flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{artist.city || "Not specified"}, {artist.state || "India"}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {artist.gallery && artist.gallery.length > 0 && (
              <Button 
                onClick={() => {
                  setActiveMediaUrl(typeof artist.gallery[0] === "string" ? artist.gallery[0] : (artist.gallery[0] as any)?.url || "");
                  setActiveMediaType("image");
                }}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-bold text-xs border border-white/10 rounded-xl px-4 py-2"
              >
                View Gallery ({artist.gallery.length})
              </Button>
            )}
            {youtubeLinks.length > 0 && (
              <Button 
                onClick={() => {
                  setActiveMediaUrl(youtubeLinks[0]);
                  setActiveMediaType("video");
                }}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play Tour Video</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section (Details) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* About / Biography */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2 font-heading">
              <Music className="h-5 w-5 text-primary" />
              About the Artist
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {artist.bio || "No biography details supplied by the performer."}
            </p>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1">
              <Clock className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Experience</span>
              <span className="text-sm font-extrabold text-text-primary block">{artist.years_of_experience || 0} Years</span>
            </Card>
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1">
              <Award className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Band Size</span>
              <span className="text-sm font-extrabold text-text-primary block">{artist.total_members || 1} Members</span>
            </Card>
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1">
              <Globe className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Travel Radius</span>
              <span className="text-sm font-extrabold text-text-primary block">{artist.travel_radius || 0} KM</span>
            </Card>
          </div>

          {/* Equipment list */}
          {equipment.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2 font-heading">
                <Check className="h-5 w-5 text-primary" />
                Sound & Instrument Equipment
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {equipment.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-bg-elevated/20 border border-border/50 rounded-xl text-xs text-text-secondary">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="capitalize font-medium">{item.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video preview / clips */}
          {youtubeLinks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2 font-heading">
                <Video className="h-5 w-5 text-primary" />
                Demo Performance Clip
              </h2>
              <Card className="bg-bg-card/45 border border-border/80 overflow-hidden rounded-2xl">
                <div className="relative w-full aspect-video">
                  <iframe 
                    src={youtubeLinks[0].replace("watch?v=", "embed/")} 
                    title="Live Tour Walkthrough"
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  />
                </div>
              </Card>
            </div>
          )}

        </div>

        {/* Right Section (Book Now CTA Sidebar) */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* Book Now Card */}
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6 space-y-5">
              <div className="border-b border-border/30 pb-4">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">Performance Rate</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-text-primary">₹{artist.base_rate?.toLocaleString()}</span>
                  <span className="text-xs text-text-secondary font-medium">/ hour base</span>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Minimum Hours Required</span>
                  <span className="font-bold text-text-primary font-mono">{artist.min_booking_hours || 1} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Travel Surcharge</span>
                  <span className="font-bold text-text-primary font-mono">₹{(artist.travel_charges || 0).toLocaleString()}</span>
                </div>
              </div>

              <Button 
                onClick={handleBookArtist}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 px-5 rounded-xl flex items-center justify-center gap-2 group transition-all cursor-pointer"
              >
                <span>Book this Artist</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>

            {/* Social links (if any) */}
            {artist.social_links && Object.keys(artist.social_links).length > 0 && (
              <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Social Channels
                </h3>
                <div className="flex items-center gap-3">
                  {Object.entries(artist.social_links).map(([platform, url], idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-bg-elevated/40 hover:bg-bg-elevated border border-border/80 text-text-secondary hover:text-text-primary rounded-xl transition-all">
                      {platform === "youtube" ? <Youtube className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </a>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </div>

      </div>

      {/* 3. LIGHTBOX / GALLERY MODAL */}
      {activeMediaUrl && activeMediaType && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <Button 
            variant="outline"
            onClick={() => {
              setActiveMediaUrl(null);
              setActiveMediaType(null);
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 border-white/15 text-white rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-xl border border-white/10 relative aspect-video">
            {activeMediaType === "image" ? (
              <img 
                src={activeMediaUrl} 
                alt="Gallery display" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full aspect-video">
                <iframe 
                  src={activeMediaUrl.replace("watch?v=", "embed/")} 
                  title="Tour Walkthrough Video"
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
