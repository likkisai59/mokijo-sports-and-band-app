"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Music, MapPin, Spinner } from "lucide-react";
import { bandArtistService } from "@/services/bandArtistService";
import { bandVenueService } from "@/services/bandVenueService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClientFavoritesPage() {
    const [artists, setArtists] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            setLoading(true);
            try {
                const favArtists = await bandArtistService.getFavoriteArtists();
                const favVenues = await bandVenueService.getFavoriteVenues();
                setArtists(favArtists);
                setVenues(favVenues);
            } catch (err) {
                console.error("Failed to fetch favorites", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    <Heart className="h-6.5 w-6.5 text-primary" />
                    Saved Favorites
                </h1>
                <p className="cd-page-sub">
                    Keep track of the artists and venues you love for quick booking access.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : artists.length === 0 && venues.length === 0 ? (
                <div className="cd-card">
                    <div className="cd-empty py-12">
                        <div className="cd-empty-icon flex justify-center text-text-muted mb-4">
                            <Heart size={48} />
                        </div>
                        <div className="cd-empty-text font-bold text-lg text-text-primary text-center">No Favorites Saved Yet</div>
                        <div className="cd-empty-sub text-sm text-text-muted max-w-md mx-auto mt-2 text-center">
                            When you browse the marketplace and click the heart icon on an artist or venue profile, they will appear here.
                        </div>
                        <div className="flex gap-4 justify-center mt-6">
                            <Link href="/band/artists" className="cd-btn-primary" style={{ textDecoration: 'none' }}>
                                Browse Artists
                            </Link>
                            <Link href="/band/venues" className="cd-btn-primary" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
                                Explore Venues
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {artists.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Music className="h-5 w-5 text-primary" />
                                Favorite Artists
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {artists.map(artist => (
                                    <Link key={artist.id} href={/band/artists/} className="block">
                                        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 hover:border-primary/50 transition-colors p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-text-primary">{artist.display_name || artist.user?.name}</h3>
                                                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" /> {artist.city || "India"}
                                                    </p>
                                                </div>
                                                <Badge className="bg-primary/20 text-primary border-primary/25">{artist.band_type || "Solo"}</Badge>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {venues.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Favorite Venues
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {venues.map(venue => (
                                    <Link key={venue.id} href={/band/venues/} className="block">
                                        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 hover:border-primary/50 transition-colors p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-text-primary">{venue.name || venue.user?.name}</h3>
                                                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" /> {venue.city || "India"}
                                                    </p>
                                                </div>
                                                <Badge className="bg-primary/20 text-primary border-primary/25">{venue.venue_type || "Venue"}</Badge>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
