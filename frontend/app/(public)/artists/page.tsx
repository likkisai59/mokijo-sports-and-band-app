"use client";

import * as React from "react";
import Link from "next/link";
import { artistService } from "@/services/artistService";
import { ArtistProfile } from "@/types/artist";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Sparkles, SlidersHorizontal, X } from "lucide-react";

// ─── Filter Options ───────────────────────────────────────────────────────────

const CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune", "Kolkata", "Ahmedabad"];
const BAND_TYPES = ["Solo", "Duo", "3-4 Members", "5+ Members"];
const GENRES = [
  "Bollywood", "Carnatic", "Hindustani", "Jazz", "Rock", "Pop",
  "Electronic", "Folk", "Classical", "Fusion", "Instrumental",
];
const RATINGS = ["4.5+", "4.0+", "3.5+", "3.0+"];

export default function PublicArtistsListPage() {
  const [artists, setArtists] = React.useState<ArtistProfile[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter states
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("");
  const [bandType, setBandType] = React.useState("");
  const [genre, setGenre] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [minRating, setMinRating] = React.useState("");

  const fetchArtists = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (bandType) params.performer_type = bandType;
      if (genre) params.genre = genre;
      if (minPrice) params.min_rate = Number(minPrice);
      if (maxPrice) params.max_rate = Number(maxPrice);
      if (minRating) params.min_rating = Number(minRating.replace("+", ""));

      const data = await artistService.getPublicArtists(params);
      setArtists(data.artists || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch performers. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [search, city, bandType, genre, minPrice, maxPrice, minRating]);

  React.useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const hasActiveFilters = !!(city || bandType || genre || minPrice || maxPrice || minRating);

  const clearFilters = () => {
    setCity("");
    setBandType("");
    setGenre("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
  };

  return (
    <div className="relative min-h-screen pb-16 pt-24 px-6 max-w-7xl mx-auto">
      {/* Background overlay glow */}
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      {/* Header and intro */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Browse Top Music Talent</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary font-heading">
          Meet Our Verified Live Bands
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Find solo singers, instrumentalists, and multi-member rock bands in your region. Direct communication, fully vetted ratings, and secure transaction handshakes.
        </p>
      </div>

      {/* ── Search + Filter Bar ──────────────────────────────────────────────── */}
      <Card className="relative z-10 bg-bg-card/45 backdrop-blur-md border border-border/85 rounded-2xl p-5 mb-4 shadow-xl">
        {/* Primary search row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
            <Input
              id="artist-search"
              placeholder="Search band name, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-bg-card border-border/80 h-10 text-xs text-text-primary"
            />
          </div>

          <Button
            id="toggle-artist-filters"
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

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                City
              </label>
              <select
                id="artist-city-filter"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Band Size */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Band Size
              </label>
              <select
                id="artist-bandtype-filter"
                value={bandType}
                onChange={(e) => setBandType(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Band Sizes</option>
                {BAND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Genre */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Genre
              </label>
              <select
                id="artist-genre-filter"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Genres</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Min Hourly Rate */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Min Rate (₹/hr)
              </label>
              <Input
                id="artist-min-price"
                type="number"
                placeholder="e.g. 5000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-bg-card border-border/80 h-10 text-xs text-text-primary"
              />
            </div>

            {/* Max Hourly Rate */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Max Rate (₹/hr)
              </label>
              <Input
                id="artist-max-price"
                type="number"
                placeholder="e.g. 50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-bg-card border-border/80 h-10 text-xs text-text-primary"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Min Rating
              </label>
              <select
                id="artist-rating-filter"
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

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="relative z-10 flex flex-wrap gap-2 mb-4">
          {city && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {city}
              <button onClick={() => setCity("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {bandType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {bandType}
              <button onClick={() => setBandType("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {genre && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              {genre}
              <button onClick={() => setGenre("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {minPrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              ₹{minPrice}+ /hr
              <button onClick={() => setMinPrice("")} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {maxPrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full">
              Up to ₹{maxPrice}/hr
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

      {/* Performers grid */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-xs text-text-secondary animate-pulse font-medium">Syncing performance talent catalog...</p>
          </div>
        ) : error ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <ErrorState title="Failed to load performers" message={error} onRetry={fetchArtists} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artists.map((artist) => {
              const coverImage = typeof artist.gallery?.[0] === "string"
                ? artist.gallery[0]
                : (artist.gallery?.[0] as any)?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a";
              return (
                <Link key={artist.id} href={`/artists/${artist.id}`}>
                  <Card className="bg-bg-card/45 backdrop-blur-md border border-border/70 overflow-hidden hover:border-primary/45 transition-all duration-300 group h-full flex flex-col">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={coverImage}
                        alt={artist.display_name || "Performer"}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary hover:bg-primary text-white font-bold text-[9px] uppercase px-2 py-0.5">
                          {artist.band_type || "Performer"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-primary transition-colors truncate">
                            {artist.display_name || artist.user?.name || "Anonymous Band"}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0 font-bold">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{artist.rating?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>

                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{artist.city || "Not specified"}, {artist.state || "India"}</span>
                        </p>

                        <p className="text-xs text-text-muted line-clamp-2 pt-1">
                          {artist.bio || "No summary biography registered for this live performer."}
                        </p>
                      </div>

                      <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Performance Rate</span>
                          <span className="text-sm font-black text-text-primary font-mono">
                            ₹{artist.base_rate?.toLocaleString()} <span className="text-[10px] font-normal text-text-secondary">/ hour</span>
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

            {artists.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-text-muted italic">
                No active, approved music performers matching filters were found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
