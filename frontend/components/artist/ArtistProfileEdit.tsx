"use client";

import * as React from "react";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { artistProfileUpdateSchema, ArtistProfileUpdateFormData } from "@/utils/validation";
import { ArtistProfile } from "@/types/artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Plus, Trash2, Save, Globe, Instagram, Facebook, Twitter } from "lucide-react";

interface ArtistProfileEditProps {
  profile: ArtistProfile;
  onSuccess: (updated: ArtistProfileUpdateFormData) => void;
}

const LANGUAGES = ["Tamil", "Telugu", "Malayalam", "Kannada", "Hindi", "English"];
const GENRES = ["Melody", "Rock", "Pop", "Classical", "Folk", "Fusion", "DJ", "Others"];

export function ArtistProfileEdit({ profile, onSuccess }: ArtistProfileEditProps) {
  const [newAchievement, setNewAchievement] = React.useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ArtistProfileUpdateFormData>({
    resolver: zodResolver(artistProfileUpdateSchema),
    defaultValues: {
      name: profile.user.name || "",
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      years_of_experience: profile.years_of_experience || 0,
      profile_image: profile.profile_image || "",
      cover_image: profile.cover_image || "",
      mobile_number: profile.mobile_number || "",
      band_type: (profile.band_type as ArtistProfileUpdateFormData["band_type"]) || "Solo",
      total_members: profile.total_members || 1,
      base_rate: profile.base_rate || 0,
      currency: profile.currency || "INR",
      travel_radius: profile.travel_radius || 0,
      travel_charges: profile.travel_charges || 0,
      min_booking_hours: profile.min_booking_hours || 0,
      max_booking_hours: profile.max_booking_hours || 0,
      equipment: {
        own_speaker: !!profile.equipment?.own_speaker,
        mic: !!profile.equipment?.mic,
        mixer: !!profile.equipment?.mixer,
        keyboard: !!profile.equipment?.keyboard,
        guitar: !!profile.equipment?.guitar,
        drums: !!profile.equipment?.drums,
        lighting: !!profile.equipment?.lighting,
        dj_console: !!profile.equipment?.dj_console,
      },
      languages: profile.languages?.map(l => l.name) || [],
      genres: profile.genres?.map(g => g.name) || [],
      social_links: {
        instagram: profile.social_links?.instagram || "",
        facebook: profile.social_links?.facebook || "",
        twitter: profile.social_links?.twitter || "",
        website: profile.social_links?.website || "",
      },
      achievements: profile.achievements || [],
    }
  });

  const watchedLanguages = watch("languages") || [];
  const watchedGenres = watch("genres") || [];
  const watchedEquipment = watch("equipment") || {};
  const watchedAchievements = watch("achievements") || [];
  const watchedProfileImg = watch("profile_image");
  const watchedCoverImg = watch("cover_image");

  const toggleLanguage = (lang: string) => {
    const current = [...watchedLanguages];
    const idx = current.indexOf(lang);
    if (idx > -1) current.splice(idx, 1);
    else current.push(lang);
    setValue("languages", current);
  };

  const toggleGenre = (genre: string) => {
    const current = [...watchedGenres];
    const idx = current.indexOf(genre);
    if (idx > -1) current.splice(idx, 1);
    else current.push(genre);
    setValue("genres", current);
  };

  const toggleEquipment = (key: string) => {
    setValue(`equipment.${key}` as Path<ArtistProfileUpdateFormData>, !watchedEquipment[key as keyof typeof watchedEquipment]);
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setValue("achievements", [...watchedAchievements, newAchievement.trim()]);
    setNewAchievement("");
  };

  const removeAchievement = (idx: number) => {
    const current = [...watchedAchievements];
    current.splice(idx, 1);
    setValue("achievements", current);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSuccess)}
      className="space-y-8 bg-bg-card/45 backdrop-blur-md border border-border/80 p-6 md:p-8 rounded-3xl shadow-xl"
    >
      <div className="border-b border-border/50 pb-4">
        <h2 className="text-xl font-bold text-text-primary">Edit Band Profile Details</h2>
        <p className="text-xs text-text-secondary">Update how your band looks on the public search listings.</p>
      </div>

      {/* Grid: basic text fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Band / Performer Legal Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display Name (Unique handle)</Label>
            <Input id="display_name" {...register("display_name")} />
            {errors.display_name && <p className="text-xs text-error">{errors.display_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile_number">Mobile / Booking Phone</Label>
            <Input id="mobile_number" {...register("mobile_number")} />
            {errors.mobile_number && <p className="text-xs text-error">{errors.mobile_number.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="years_of_experience">Years of Active Experience</Label>
            <Input id="years_of_experience" type="number" {...register("years_of_experience", { valueAsNumber: true })} />
            {errors.years_of_experience && <p className="text-xs text-error">{errors.years_of_experience.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Avatar Photo</Label>
            <ImageUpload 
              value={watchedProfileImg} 
              onChange={(url) => setValue("profile_image", url)}
              onRemove={() => setValue("profile_image", "")}
              subfolder="artists/avatars"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cover Banner</Label>
            <ImageUpload 
              value={watchedCoverImg} 
              onChange={(url) => setValue("cover_image", url)}
              onRemove={() => setValue("cover_image", "")}
              subfolder="artists/covers"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">About Performer / Band Biography</Label>
        <Textarea id="bio" rows={4} placeholder="Describe your genres, influences, history..." {...register("bio")} />
        {errors.bio && <p className="text-xs text-error">{errors.bio.message}</p>}
      </div>

      {/* Languages & Genres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Languages Performed</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => {
              const active = watchedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`h-9 px-4 rounded-full text-xs font-semibold border transition-all ${
                    active ? "bg-primary border-primary text-white" : "bg-bg-elevated/40 border-border text-text-secondary"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Music Genres</Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => {
              const active = watchedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`h-9 px-4 rounded-full text-xs font-semibold border transition-all ${
                    active ? "bg-primary border-primary text-white" : "bg-bg-elevated/40 border-border text-text-secondary"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance & Pricing */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Performance & Pricing settings</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="band_type">Performer Type</Label>
            <select 
              id="band_type"
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              {...register("band_type")}
            >
              <option value="Solo">Solo</option>
              <option value="Duo">Duo</option>
              <option value="Trio">Trio</option>
              <option value="4 Members">4 Members</option>
              <option value="5+ Members">5+ Members</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total_members">Total Members</Label>
            <Input id="total_members" type="number" {...register("total_members", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base_rate">Hourly Price</Label>
            <Input id="base_rate" type="number" {...register("base_rate", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="travel_radius">Travel Radius (km)</Label>
            <Input id="travel_radius" type="number" {...register("travel_radius", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="travel_charges">Travel Surcharge/km</Label>
            <Input id="travel_charges" type="number" {...register("travel_charges", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="min_booking_hours">Min Booking Hours</Label>
            <Input id="min_booking_hours" type="number" {...register("min_booking_hours", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_booking_hours">Max Booking Hours</Label>
            <Input id="max_booking_hours" type="number" {...register("max_booking_hours", { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      {/* Equipment Checkboxes */}
      <div className="space-y-3">
        <Label>Available Show Equipment</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(watchedEquipment).map(key => {
            const isSelected = !!watchedEquipment[key as keyof typeof watchedEquipment];
            const label = key.replace("_", " ");
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleEquipment(key)}
                className={`h-11 px-3 text-xs font-semibold rounded-lg border capitalize text-left flex items-center justify-between ${
                  isSelected ? "bg-primary/10 border-primary text-primary" : "bg-bg-elevated/20 border-border text-text-secondary"
                }`}
              >
                <span>{label}</span>
                <span className="text-[9px] uppercase font-bold">{isSelected ? "Yes" : "No"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Social Handles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Instagram className="h-4 w-4 text-pink-400" /> Instagram URL</Label>
            <Input placeholder="https://instagram.com/..." {...register("social_links.instagram")} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Facebook className="h-4 w-4 text-blue-400" /> Facebook URL</Label>
            <Input placeholder="https://facebook.com/..." {...register("social_links.facebook")} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Twitter className="h-4 w-4 text-sky-400" /> Twitter / X URL</Label>
            <Input placeholder="https://twitter.com/..." {...register("social_links.twitter")} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-purple-400" /> Official Website URL</Label>
            <Input placeholder="https://www..." {...register("social_links.website")} />
          </div>
        </div>
      </div>

      {/* Achievements builder */}
      <div className="space-y-3">
        <Label>Awards & Achievements</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="E.g. Best Rock Band - Bangalore Music Awards 2025" 
            value={newAchievement}
            onChange={e => setNewAchievement(e.target.value)}
          />
          <Button type="button" onClick={addAchievement} className="bg-primary text-white h-10 px-4">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {watchedAchievements.map((ach, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-bg-elevated/20">
              <span className="text-xs text-text-primary">{ach}</span>
              <button type="button" onClick={() => removeAchievement(idx)} className="text-error hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {watchedAchievements.length === 0 && (
            <p className="text-xs text-text-muted italic">No achievements added yet.</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 flex items-center justify-center gap-2">
        <Save className="h-4 w-4" />
        <span>{isSubmitting ? "Saving Updates..." : "Save Profile Changes"}</span>
      </Button>

    </form>
  );
}
