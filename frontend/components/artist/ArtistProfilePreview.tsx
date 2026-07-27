"use client";

import * as React from "react";
import Image from "next/image";
import { ArtistProfile } from "@/types/artist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Globe, 
  Award, 
  Clock, 
  Navigation, 
  Volume2, 
  Trophy,
  Sparkles
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";

interface ArtistProfilePreviewProps {
  profile: ArtistProfile;
}

export function ArtistProfilePreview({ profile }: ArtistProfilePreviewProps) {
  const hasSocials = profile.social_links && Object.values(profile.social_links).some(Boolean);
  const achievements = profile.achievements || [];

  return (
    <div className="space-y-6">
      {/* Profile Header Cards */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Banner */}
        <div className="h-44 sm:h-60 bg-gradient-to-r from-primary/30 to-purple-600/30 relative">
          {profile.cover_image ? (
            <Image src={profile.cover_image} alt="Cover Banner" fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs italic">
              No cover image uploaded
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <CardContent className="p-6 relative pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-bg-card overflow-hidden bg-bg-elevated/80 shadow-lg shrink-0 relative">
            {profile.profile_image ? (
              <Image src={profile.profile_image} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-semibold">
                No avatar
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1 pb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-heading">
              {profile.user.name}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-xs text-text-secondary">
              <span className="font-semibold text-primary">@{profile.display_name}</span>
              <span className="text-text-muted">•</span>
              <span>{profile.band_type}</span>
              <span className="text-text-muted">•</span>
              <span>{profile.years_of_experience} Years Exp</span>
            </div>
          </div>

          {/* Pricing indicator */}
          <div className="bg-bg-elevated border border-border/80 px-5 py-3 rounded-2xl text-center self-stretch sm:self-auto flex flex-col justify-center shadow-md">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Base Rate</span>
            <span className="text-lg font-black text-text-primary block">
              {formatCurrency(profile.base_rate)} / hr
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: About & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Widget */}
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                About The Band
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {profile.bio || "No biography provided yet. Complete your profile details to tell clients about your sound!"}
              </p>

              {/* Taxonomy Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div className="space-y-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.genres?.map(g => (
                      <Badge key={g.id} variant="secondary" className="text-[10px] py-1 font-semibold text-text-primary">
                        {g.name}
                      </Badge>
                    ))}
                    {profile.genres?.length === 0 && <span className="text-xs text-text-muted italic">No genres configured</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.languages?.map(l => (
                      <Badge key={l.id} variant="outline" className="text-[10px] py-1 font-semibold text-text-primary">
                        {l.name}
                      </Badge>
                    ))}
                    {profile.languages?.length === 0 && <span className="text-xs text-text-muted italic">No languages configured</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements widget */}
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Awards & Achievements
              </h3>
              <div className="space-y-3 pt-2">
                {achievements.map((ach: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg shrink-0">
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs text-text-secondary leading-relaxed pt-0.5">{ach}</span>
                  </div>
                ))}
                {achievements.length === 0 && (
                  <p className="text-xs text-text-muted italic">No achievement labels listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Gigs constraints & Equipment */}
        <div className="space-y-6">

          {/* Booking Rules Card */}
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Booking Parameters
              </h3>
              <div className="space-y-3.5 divide-y divide-border/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5"><Clock className="h-4 w-4 text-text-muted" /> Booking Hours</span>
                  <span className="font-bold text-text-primary">
                    {profile.min_booking_hours} - {profile.max_booking_hours} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3.5">
                  <span className="text-text-secondary flex items-center gap-1.5"><Navigation className="h-4 w-4 text-text-muted" /> Travel Radius</span>
                  <span className="font-bold text-text-primary">{profile.travel_radius} km limit</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3.5">
                  <span className="text-text-secondary flex items-center gap-1.5"><Navigation className="h-4 w-4 text-text-muted" /> Travel Surcharge</span>
                  <span className="font-bold text-text-primary">{formatCurrency(profile.travel_charges)} / extra km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Widget */}
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                Equipment List
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {profile.equipment && Object.keys(profile.equipment).map(key => {
                  const isIncluded = !!profile.equipment[key];
                  const label = key.replace("_", " ");
                  return (
                    <div 
                      key={key} 
                      className={`p-2.5 rounded-lg border text-center text-[10px] font-bold capitalize truncate ${
                        isIncluded 
                          ? "bg-primary/5 border-primary/20 text-text-primary" 
                          : "bg-bg-elevated/10 border-border/50 text-text-muted line-through"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Social Links Panel */}
          {hasSocials && (
            <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  Social Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profile.social_links?.instagram && (
                    <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-bg-elevated border border-border/80 text-pink-400 hover:text-text-primary rounded-xl transition-colors">
                      <Instagram className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {profile.social_links?.facebook && (
                    <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-bg-elevated border border-border/80 text-blue-400 hover:text-text-primary rounded-xl transition-colors">
                      <Facebook className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {profile.social_links?.twitter && (
                    <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-bg-elevated border border-border/80 text-sky-400 hover:text-text-primary rounded-xl transition-colors">
                      <Twitter className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {profile.social_links?.website && (
                    <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-bg-elevated border border-border/80 text-purple-400 hover:text-text-primary rounded-xl transition-colors">
                      <Globe className="h-4.5 w-4.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </div>
  );
}
