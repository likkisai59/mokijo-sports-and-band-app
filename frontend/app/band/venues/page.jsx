"use client";

import * as React from "react";
import Link from "next/link";
import { bandVenueService } from "@/services/bandVenueService";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Sparkles, SlidersHorizontal, X } from "lucide-react";

const CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune", "Kolkata", "Ahmedabad"];
const VENUE_CAPACITIES = ["< 100", "100-500", "500-1000", "1000+"];
const VENUE_TYPES = ["Club", "Pub", "Auditorium", "Open Air", "Stadium", "Cafe"];
const RATINGS = ["4.5+", "4.0+", "3.5+", "3.0+"];

export default function PublicVenuesListPage() {
  const [venues, setVenues] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter states
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("");
  const [minCapacity, setMinCapacity] = React.useState("");
  const [venueType, setVenueType] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [minRating, setMinRating] = React.useState("");

  const fetchVenues = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (minCapacity) params.min_capacity = Number(minCapacity.replace(/[^0-9]/g, ""));
      if (venueType) params.venue_type = venueType;
      if (maxPrice) params.max_price = Number(maxPrice);

      const data = await bandVenueService.getPublicVenues(params);
      setVenues(data.venues || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch venues. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [search, city, minCapacity, venueType, maxPrice]);

  React.useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const hasActiveFilters = !!(city || minCapacity || venueType || maxPrice || minRating);

  const clearFilters = () => {
    setCity("");
    setMinCapacity("");
    setVenueType("");
    setMaxPrice("");
    setMinRating("");
  };

  return (
    <div className="relative min-h-screen pb-16 pt-24 px-6 max-w-7xl mx-auto">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Discover Stunning Venues</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary font-heading">
          Find The Perfect Event Space
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Book fully vetted venues tailored for live music, concerts, and parties. Manage direct communication and transactions seamlessly.
        </p>
      </div>

      <Card className="relative z-10 bg-bg-card/45 backdrop-blur-md border border-border/85 rounded-2xl p-5 mb-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
            <Input
              id="venue-search"
              placeholder="Search venue name, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-bg-card border-border/80 h-10 text-xs text-text-primary"
            />
          </div>

          <Button
            id="toggle-venue-filters"
            variant="outline"
            size="sm"
            className="h-10 flex items-center gap-1.5 font-semibold shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-black">
                ✓
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-text-muted hover:text-text-primary shrink-0"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                City
              </label>
              <select
                id="venue-city-filter"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Capacity
              </label>
              <select
                id="venue-minCapacity-filter"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any Capacity</option>
                {VENUE_CAPACITIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Venue Type
              </label>
              <select
                id="venue-type-filter"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Types</option>
                {VENUE_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Max Rate (₹)
              </label>
              <Input
                id="venue-max-price"
                type="number"
                placeholder="e.g. 50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-bg-card border-border/80 h-10 text-xs text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Min Rating
              </label>
              <select
                id="venue-rating-filter"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any Rating</option>
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    ⭐ {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {hasActiveFilters && (
        <div className="relative z-10 flex flex-wrap gap-2 mb-4">
          {city && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {city}
              <button onClick={() => setCity("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {minCapacity && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {minCapacity} Capacity
              <button onClick={() => setMinCapacity("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {venueType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {venueType}
              <button onClick={() => setVenueType("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {maxPrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              Up to ₹{maxPrice}
              <button onClick={() => setMaxPrice("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              ⭐ {minRating}
              <button onClick={() => setMinRating("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
        </div>
      )}

      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-xs text-text-secondary animate-pulse font-medium">Syncing performance talent catalog...</p>
          </div>
        ) : error ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <ErrorState title="Failed to load venues" message={error} onRetry={fetchVenues} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => {
              const coverImage = typeof venue.gallery?.[0] === "string"
                ? venue.gallery[0]
                : venue.gallery?.[0]?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a";
              return (
                <Link key={venue.id} href={`/band/venues/${venue.id}`}>
                  <Card className="bg-bg-card/45 backdrop-blur-md border border-border/70 overflow-hidden hover:border-primary/45 transition-all duration-300 group h-full flex flex-col">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={coverImage}
                        alt={venue.name || "venue"}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary hover:bg-primary text-white font-bold text-[9px] uppercase px-2 py-0.5">
                          {venue.venue_type || "venue"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-primary transition-colors truncate">
                            {venue.name || venue.user?.name || "Anonymous Venue"}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0 font-bold">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{venue.rating?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>

                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{venue.city || "Not specified"}, {venue.state || "India"}</span>
                        </p>

                        <p className="text-xs text-text-muted line-clamp-2 pt-1">
                          {venue.description || "No description provided for this venue."}
                        </p>
                      </div>

                      <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Base Rate</span>
                          <span className="text-sm font-black text-text-primary font-mono">
                            ₹{venue.base_price?.toLocaleString()}
                          </span>
                        </div>

                        <Button size="sm" className="font-bold text-xs h-8 rounded-lg cursor-pointer">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {venues.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-text-muted italic">
                No active, approved music venues matching filters were found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
