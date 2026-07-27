"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { venueService } from "@/services/venueService";
import { reviewService } from "@/services/reviewService";
import { VenueResponseData } from "@/types/venue";
import { ReviewSummaryResponse } from "@/types/review";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";
import { 
  Building2,
  Users, 
  MapPin, 
  Mail, 
  Phone, 
  Star, 
  Play, 
  Layers, 
  Clock, 
  Check, 
  ArrowRight,
  MessageSquare,
  Search,
  X,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

export default function PublicVenueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const venueId = params.id as string;

  const [venue, setVenue] = React.useState<VenueResponseData | null>(null);
  const [reviewsData, setReviewsData] = React.useState<ReviewSummaryResponse | null>(null);
  const [loadingVenue, setLoadingVenue] = React.useState(true);
  const [loadingReviews, setLoadingReviews] = React.useState(false);
  const [errorVenue, setErrorVenue] = React.useState<string | null>(null);
  
  // Reviews filters
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [reviewsPage, setReviewsPage] = React.useState(1);

  // Video and Image gallery modal states
  const [activeMediaUrl, setActiveMediaUrl] = React.useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = React.useState<"image" | "video" | null>(null);

  // Booking CTA Dialog
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

  const handleBookSpace = () => {
    if (!venue) return;
    const basePrice = venue.base_price || 0;
    const intent = {
      venueId: venue.id,
      venueName: venue.name,
      proposedPrice: basePrice,
    };

    if (!user) {
      sessionStorage.setItem("pending_booking_intent", JSON.stringify(intent));
      toast.success("Please log in to submit a booking request.");
      router.push("/login");
    } else if (user.role !== "client") {
      toast.error("Only client accounts can create booking requests.");
    } else {
      sessionStorage.setItem("active_booking_intent", JSON.stringify(intent));
      router.push("/client/bookings");
    }
  };

  const fetchVenueDetail = React.useCallback(async () => {
    setLoadingVenue(true);
    setErrorVenue(null);
    try {
      const data = await venueService.getPublicVenueDetail(venueId);
      setVenue(data);
    } catch (err: unknown) {
      setErrorVenue(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || "Failed to load public venue details."
      );
    } finally {
      setLoadingVenue(false);
    }
  }, [venueId]);

  const fetchReviews = React.useCallback(async () => {
    setLoadingReviews(true);
    try {
      const data = await reviewService.getPublicVenueReviews(venueId, {
        rating: ratingFilter || undefined,
        search: searchQuery || undefined,
        page: reviewsPage,
        limit: 5
      });
      setReviewsData(data);
    } catch (err: unknown) {
      console.error("Failed to load venue reviews publicly.", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [venueId, ratingFilter, searchQuery, reviewsPage]);

  React.useEffect(() => {
    fetchVenueDetail();
  }, [fetchVenueDetail]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loadingVenue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse font-medium">Retrieving venue listing specifications...</p>
      </div>
    );
  }

  if (errorVenue || !venue) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] p-4">
        <ErrorState 
          title="Listing Not Found" 
          message={errorVenue || "This event hall listing is temporarily offline or invalid."} 
          onRetry={fetchVenueDetail} 
        />
      </div>
    );
  }

  // Parse media lists
  const coverImage = venue.metadata_fields?.cover_image || "/images/venue-placeholder.jpg";
  const youtubeLinks = venue.metadata_fields?.youtube_links || [];
  
  // Format facilities list
  const facilities = venue.facilities || [];
  
  // Pricing Details
  const basePrice = venue.base_price || 0;
  const pricing = venue.pricing_details || {};
  const securityDeposit = pricing.security_deposit || 0;
  const extraHourCharges = pricing.extra_hour_charges || 0;
  const hourlyPrice = pricing.hourly_price || 0;
  const weekendPrice = pricing.weekend_price || 0;

  // Availability schedule
  const schedule = venue.availability_rules?.weekly_schedule || {};
  const maintenanceDays = venue.availability_rules?.maintenance_days || [];
  const publicHolidays = venue.availability_rules?.public_holidays || [];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-16">
      
      {/* 1. HERO & GALLERY */}
      <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
        <Image 
          src={coverImage} 
          alt={venue.name} 
          fill
          className="absolute inset-0 h-full w-full object-cover filter brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border border-primary/25 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">
                {venue.venue_type || "Event Space"}
              </Badge>
              {venue.verification_status === "approved" && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">
                  Verified Space
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">{venue.name}</h1>
            <p className="text-sm text-text-secondary flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{venue.address}, {venue.city?.name}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {venue.gallery && venue.gallery.length > 0 && (
              <Button 
                onClick={() => {
                  setActiveMediaUrl(venue.gallery[0]);
                  setActiveMediaType("image");
                }}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-bold text-xs border border-white/10 rounded-xl px-4 py-2"
              >
                View Gallery ({venue.gallery.length})
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
                <span>Play Tour</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section (Details) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              About this Space
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {venue.description || "No description provided for this venue space listing."}
            </p>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1">
              <Users className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Max Capacity</span>
              <span className="text-sm font-extrabold text-text-primary block">{venue.capacity} Guests</span>
            </Card>
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1">
              <Users className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Min Capacity</span>
              <span className="text-sm font-extrabold text-text-primary block">{venue.min_capacity} Guests</span>
            </Card>
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-1 col-span-2 sm:col-span-1">
              <Layers className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Established Year</span>
              <span className="text-sm font-extrabold text-text-primary block">
                {venue.metadata_fields?.established_year || "N/A"}
              </span>
            </Card>
          </div>

          {/* Facilities Listing */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Available Facilities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilities.map((fac, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-bg-elevated/20 border border-border/50 rounded-xl text-xs text-text-secondary">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="capitalize font-medium">{fac.replace(/_/g, " ")}</span>
                </div>
              ))}
              {facilities.length === 0 && (
                <p className="text-xs text-text-muted italic">No specific facilities registered for this venue.</p>
              )}
            </div>
          </div>

          {/* Operational Availability Calendar */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Weekly schedule & Availability
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4">
                <span className="text-[10px] text-text-muted uppercase font-bold block mb-2 tracking-wider">Opening Schedule</span>
                <div className="space-y-2">
                  {Object.entries(schedule).map(([day, hours], idx) => (
                    <div key={idx} className="flex justify-between text-xs border-b border-border/30 pb-1.5">
                      <span className="capitalize font-bold text-text-primary">{day}</span>
                      <span className="text-text-secondary font-mono">{String(hours)}</span>
                    </div>
                  ))}
                  {Object.keys(schedule).length === 0 && (
                    <p className="text-xs text-text-muted italic">Operational hours schedule not specified.</p>
                  )}
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Blocked / Maintenance Dates</span>
                  <div className="flex flex-wrap gap-1.5">
                    {maintenanceDays.map((date: string, idx: number) => (
                      <Badge key={idx} className="bg-error/10 text-error border border-error/25 font-mono text-[9px]">
                        {date}
                      </Badge>
                    ))}
                    {maintenanceDays.length === 0 && (
                      <span className="text-xs text-text-muted italic">No maintenance slots blocked.</span>
                    )}
                  </div>
                </Card>

                <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 space-y-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Public Holidays (Closed)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {publicHolidays.map((date: string, idx: number) => (
                      <Badge key={idx} className="bg-primary/10 text-primary border border-primary/25 font-mono text-[9px]">
                        {date}
                      </Badge>
                    ))}
                    {publicHolidays.length === 0 && (
                      <span className="text-xs text-text-muted italic">No holidays registered.</span>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Location / Google Maps */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Mapping
            </h2>
            <Card className="bg-bg-card/45 border border-border/80 overflow-hidden rounded-2xl">
              <div className="h-[250px] bg-bg-elevated/40 relative flex flex-col items-center justify-center gap-2 text-center p-6">
                <MapPin className="h-8 w-8 text-primary animate-bounce" />
                <span className="text-sm font-bold text-text-primary">{venue.name}</span>
                <span className="text-xs text-text-secondary max-w-sm">{venue.address}, {venue.city?.name}, {venue.state || ""} {venue.pincode || ""}</span>
                
                {venue.google_map_location && (
                  <a 
                    href={venue.google_map_location} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </Card>
          </div>

          {/* Reviews List & Ratings Summary */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-text-primary border-b border-border/30 pb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Client Testimonials & Ratings
            </h2>

            {/* Averages and distributions */}
            {reviewsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl p-5">
                <div className="flex flex-col items-center justify-center text-center space-y-2 border-b md:border-b-0 md:border-r border-border/30 pb-4 md:pb-0 md:pr-4">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Average Rating</span>
                  <span className="text-4xl font-extrabold text-text-primary flex items-center gap-1">
                    {reviewsData.average_rating.toFixed(1)}
                    <Star className="h-6 w-6 text-amber-400 fill-current" />
                  </span>
                  <span className="text-[10px] text-text-secondary">{reviewsData.total_reviews} total reviews</span>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">Score Distribution</span>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewsData.rating_distribution[stars] || 0;
                    const percent = reviewsData.total_reviews > 0 ? (count / reviewsData.total_reviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-right font-bold text-text-muted font-mono">{stars} ★</span>
                        <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-8 text-left font-medium text-text-secondary font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setReviewsPage(1);
                  }}
                  placeholder="Search reviews by comments..."
                  className="pl-9 bg-bg-card/45 border-border pr-4 h-10 rounded-xl"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              </div>

              <div className="flex items-center gap-1.5 self-start">
                {[null, 5, 4, 3].map((val) => (
                  <Button 
                    key={val === null ? "all" : val}
                    variant={ratingFilter === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRatingFilter(val);
                      setReviewsPage(1);
                    }}
                    className={`h-9 px-3.5 font-bold text-xs rounded-xl ${
                      ratingFilter === val ? "bg-primary text-white" : ""
                    }`}
                  >
                    {val === null ? "All" : `${val} ★`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comments feed list */}
            <div className="space-y-4">
              {loadingReviews && (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="h-6 w-6 text-primary" />
                </div>
              )}

              {reviewsData?.reviews.map((rev) => (
                <Card key={rev.id} className="bg-bg-card/45 border border-border/80 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-primary text-xs uppercase">
                        {rev.client?.name?.[0] || "U"}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-text-primary block">{rev.client?.name || "Client User"}</span>
                        <span className="text-[9px] text-text-muted block">
                          {format(new Date(rev.created_at), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`h-3.5 w-3.5 ${
                            idx < rev.rating ? "text-amber-400 fill-current" : "text-text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-text-secondary">{rev.comment}</p>

                  {/* Owner Reply */}
                  {rev.reply_comment && (
                    <div className="p-3 bg-bg-elevated/40 border border-border/55 rounded-xl text-xs text-text-secondary space-y-1 ml-4 sm:ml-6">
                      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1 mb-1">
                        <span className="font-bold text-text-primary">Owner Response</span>
                        {rev.reply_at && (
                          <span className="text-[9px] text-text-muted font-mono">
                            {format(new Date(rev.reply_at), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed italic">{rev.reply_comment}</p>
                    </div>
                  )}
                </Card>
              ))}

              {reviewsData?.reviews.length === 0 && !loadingReviews && (
                <p className="text-xs text-text-muted italic text-center py-10">No reviews found matching the filters.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Section (Book Now CTA Sidebar) */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* Book Now Card */}
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6 space-y-5">
              <div className="border-b border-border/30 pb-4">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">Rental Rates</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-text-primary">₹{basePrice.toLocaleString()}</span>
                  <span className="text-xs text-text-secondary font-medium">/ event base</span>
                </div>
              </div>

              {/* Surcharges list */}
              <div className="space-y-2 text-xs">
                {hourlyPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Hourly Rate</span>
                    <span className="font-bold text-text-primary font-mono">₹{hourlyPrice.toLocaleString()}</span>
                  </div>
                )}
                {weekendPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Weekend Surcharge</span>
                    <span className="font-bold text-text-primary font-mono">₹{weekendPrice.toLocaleString()}</span>
                  </div>
                )}
                {securityDeposit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Refundable Deposit</span>
                    <span className="font-bold text-text-primary font-mono">₹{securityDeposit.toLocaleString()}</span>
                  </div>
                )}
                {extraHourCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Extra Hour Charge</span>
                    <span className="font-bold text-text-primary font-mono">₹{extraHourCharges.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleBookSpace}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 px-5 rounded-xl flex items-center justify-center gap-2 group transition-all"
              >
                <span>Book this Space</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>

            {/* Host Contacts Card */}
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Contact Space Operator
              </h3>
              
              <div className="space-y-3 text-xs text-text-secondary">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{venue.user?.email || "owner@example.com"}</span>
                </div>
                {venue.contact_details && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{venue.contact_details}</span>
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>

      </div>

      {/* 3. LIGHTBOX / ALBUM GALLERY MODAL */}
      {activeMediaUrl && activeMediaType && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <Button 
            variant="outline"
            onClick={() => {
              setActiveMediaUrl(null);
              setActiveMediaType(null);
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 border-white/15 text-white rounded-full transition-all"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-xl border border-white/10">
            {activeMediaType === "image" ? (
              <Image 
                src={activeMediaUrl} 
                alt="Gallery display" 
                fill
                className="object-contain"
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

      {/* 4. BOOKING INSTRUCTIONAL DIALOG */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-bg-card border border-border rounded-2xl p-6 relative space-y-4">
            <Button 
              variant="outline"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-bg-elevated hover:bg-bg-elevated/80 border-border text-text-primary rounded-full transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </Button>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-text-primary">How to Book this Hall</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Reservations and calendar slot block bookings are coordinated directly with our events team. Please contact the space administrator using the details below:
              </p>
            </div>

            <div className="p-4 bg-bg-elevated/40 border border-border/80 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Contact Person:</span>
                <span className="font-bold text-text-primary">{venue.metadata_fields?.contact_person || "Venue Owner"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Direct Email:</span>
                <span className="font-bold text-primary truncate ml-2">{venue.user?.email || "owner@example.com"}</span>
              </div>
              {venue.contact_details && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Phone Number:</span>
                  <span className="font-bold text-text-primary font-mono">{venue.contact_details}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setIsBookingModalOpen(false)}
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl"
            >
              Close instructions
            </Button>
          </Card>
        </div>
      )}

    </div>
  );
}
