"use client";

import * as React from "react";
import Image from "next/image";
import { VenueMediaData, VenueGalleryItem, VenueVideoItem } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Star, 
  Save,
  Youtube,
  Compass
} from "lucide-react";
import toast from "react-hot-toast";

interface VenueMediaGalleryProps {
  media: VenueMediaData;
  onSave: (updated: VenueMediaData) => Promise<void>;
}

const ALBUMS = ["Main Hall", "Dining Area", "Exterior/Garden", "Lobby", "General"];
const VIDEO_CATEGORIES = ["Walkthrough", "Event Setup", "Aerial View", "General"];

export function VenueMediaGallery({ media, onSave }: VenueMediaGalleryProps) {
  const [coverImage, setCoverImage] = React.useState<string | null>(media.cover_image || null);
  const [gallery, setGallery] = React.useState<VenueGalleryItem[]>(media.gallery || []);
  const [videos, setVideos] = React.useState<VenueVideoItem[]>(media.videos || []);
  const [youtubeLinks, setYoutubeLinks] = React.useState<string[]>(media.youtube_links || []);
  const [virtualTour, setVirtualTour] = React.useState<string | null>(media.virtual_tour || null);

  const [saving, setSaving] = React.useState(false);

  // New item inputs
  const [newAlbumName, setNewAlbumName] = React.useState("General");
  const [newYoutubeUrl, setNewYoutubeUrl] = React.useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        cover_image: coverImage,
        gallery,
        videos,
        youtube_links: youtubeLinks,
        virtual_tour: virtualTour
      });
      toast.success("Venue gallery and media saved successfully!");
    } catch {
      toast.error("Failed to save media changes.");
    } finally {
      setSaving(false);
    }
  };

  // Gallery methods
  const addImageToGallery = (url: string) => {
    if (!url) return;
    const newItem: VenueGalleryItem = {
      url,
      is_cover: gallery.length === 0 && !coverImage, // auto make cover if none exists
      album: newAlbumName
    };
    setGallery(prev => [...prev, newItem]);
    if (gallery.length === 0 && !coverImage) {
      setCoverImage(url);
    }
  };

  const removeImage = (idx: number) => {
    setGallery(prev => {
      const current = [...prev];
      const wasCover = current[idx]?.is_cover;
      current.splice(idx, 1);
      
      if (wasCover && current.length > 0) {
        current[0].is_cover = true;
        setCoverImage(current[0].url);
      } else if (current.length === 0) {
        setCoverImage(null);
      }
      return current;
    });
  };

  const setAsCover = (idx: number) => {
    setGallery(prev => 
      prev.map((item, i) => ({
        ...item,
        is_cover: i === idx
      }))
    );
    setCoverImage(gallery[idx].url);
    toast.success("Cover banner updated!");
  };

  const moveImage = (idx: number, direction: "left" | "right") => {
    setGallery(prev => {
      const current = [...prev];
      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= current.length) return prev;
      
      const temp = current[idx];
      current[idx] = current[targetIdx];
      current[targetIdx] = temp;
      return current;
    });
  };

  const handleAlbumChange = (idx: number, album: string) => {
    setGallery(prev => 
      prev.map((item, i) => i === idx ? { ...item, album } : item)
    );
  };

  // Video File methods
  const addVideoFile = (url: string) => {
    if (!url) return;
    const newItem: VenueVideoItem = {
      url,
      category: "Walkthrough"
    };
    setVideos(prev => [...prev, newItem]);
  };

  const removeVideoFile = (idx: number) => {
    setVideos(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  const handleVideoCategoryChange = (idx: number, category: string) => {
    setVideos(prev => 
      prev.map((item, i) => i === idx ? { ...item, category } : item)
    );
  };

  // YouTube Links methods
  const addYoutube = () => {
    if (!newYoutubeUrl.trim()) return;
    if (!newYoutubeUrl.includes("youtube.com") && !newYoutubeUrl.includes("youtu.be")) {
      toast.error("Please enter a valid YouTube video link.");
      return;
    }
    setYoutubeLinks(prev => [...prev, newYoutubeUrl.trim()]);
    setNewYoutubeUrl("");
    toast.success("YouTube link added!");
  };

  const removeYoutube = (idx: number) => {
    setYoutubeLinks(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  return (
    <div className="space-y-8 bg-bg-card/45 backdrop-blur-md border border-border/80 p-6 md:p-8 rounded-3xl shadow-xl">
      
      {/* Title */}
      <div className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-text-primary">Venue Media Showcase & Albums</h2>
          <p className="text-xs text-text-secondary">Upload high resolution photos of your spaces, walkthrough clips and Matterport 360° virtual tours.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 flex items-center gap-1.5 self-start sm:self-center"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving Media..." : "Save Media Configuration"}</span>
        </Button>
      </div>

      {/* COVER IMAGE SECTION */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-text-primary">Cover Banner Image</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <div className="md:col-span-2">
            {coverImage ? (
              <div className="aspect-video w-full max-w-md relative rounded-xl overflow-hidden border border-border">
                <Image src={coverImage} alt="Cover Banner" fill className="object-cover" />
                <button 
                  type="button" 
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="aspect-video w-full max-w-md bg-bg-elevated/40 border border-dashed border-border rounded-xl flex items-center justify-center text-text-muted text-xs italic">
                No cover banner selected. Upload gallery photos and mark one as cover or upload below.
              </div>
            )}
          </div>
          <ImageUpload 
            onChange={(url) => setCoverImage(url)}
            subfolder="venues/covers"
          />
        </div>
      </div>

      {/* GALLERY PHOTOS SECTION */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Photo Gallery Albums
          </h3>
          <p className="text-xs text-text-secondary">Upload images of your venue halls and classify them into respective spaces.</p>
        </div>

        {/* Upload layout widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Select Album category to upload into</Label>
            <select 
              value={newAlbumName} 
              onChange={e => setNewAlbumName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
            >
              {ALBUMS.map(al => (
                <option key={al} value={al}>{al}</option>
              ))}
            </select>
          </div>
          <ImageUpload 
            onChange={addImageToGallery}
            subfolder="venues/gallery"
          />
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {gallery.map((item, idx) => (
            <div key={idx} className="border border-border/80 rounded-2xl overflow-hidden bg-bg-card/85 flex flex-col group relative">
              <div className="aspect-video w-full relative bg-bg-elevated/40 flex items-center justify-center border-b border-border/50">
                <Image src={item.url} alt="Gallery item" fill className="object-cover" />
                {item.is_cover && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-primary text-white flex items-center gap-1 shadow-sm border border-primary-light">
                    <Star className="h-3 w-3 fill-current" /> Cover Image
                  </span>
                )}
                
                {/* Delete button top right */}
                <button 
                  type="button" 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Album & Order actions */}
              <div className="p-3 space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-muted">Album Category</span>
                  <select
                    value={item.album}
                    onChange={e => handleAlbumChange(idx, e.target.value)}
                    className="w-full h-8 px-2 rounded border border-border bg-bg-elevated text-text-primary text-[10px]"
                  >
                    {ALBUMS.map(al => (
                      <option key={al} value={al}>{al}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, "left")}
                      className="h-7 w-7"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={idx === gallery.length - 1}
                      onClick={() => moveImage(idx, "right")}
                      className="h-7 w-7"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {!item.is_cover && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAsCover(idx)}
                      className="h-7 text-[9px] font-bold"
                    >
                      Set Cover
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="sm:col-span-2 md:col-span-4 py-12 text-center text-xs text-text-muted italic border border-dashed border-border rounded-2xl">
              No photos added to gallery yet.
            </div>
          )}
        </div>
      </div>

      {/* WALKTHROUGH VIDEOS SECTION */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <VideoIcon className="h-5 w-5 text-primary" />
            Upload Walkthrough Videos
          </h3>
          <p className="text-xs text-text-secondary">Upload actual walkthrough video files showcasing hall space layout. Max size: 20MB.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <p className="text-xs text-text-secondary md:col-span-2 leading-relaxed">
            Choose a walkthrough clip showing the space decor configurations. Max size: 20MB. MP4 format preferred.
          </p>
          <VideoUpload 
            onChange={addVideoFile}
            subfolder="venues/videos"
          />
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {videos.map((v, idx) => (
            <div key={idx} className="border border-border/80 rounded-2xl overflow-hidden bg-bg-card/85 flex flex-col group relative">
              <div className="aspect-video w-full relative bg-bg-elevated/40 border-b border-border/50 flex items-center justify-center">
                <video src={v.url} controls className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeVideoFile(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3">
                <span className="text-[9px] uppercase font-bold text-text-muted">Video Category tag</span>
                <select
                  value={v.category}
                  onChange={e => handleVideoCategoryChange(idx, e.target.value)}
                  className="w-full h-8 px-2 mt-1 rounded border border-border bg-bg-elevated text-text-primary text-[10px]"
                >
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* YOUTUBE AND 360 TOUR SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
        
        {/* YouTube Links Widget */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              YouTube Video Embeds
            </h3>
            <p className="text-xs text-text-secondary">Embed showcase links from your YouTube channel.</p>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={newYoutubeUrl}
              onChange={e => setNewYoutubeUrl(e.target.value)}
            />
            <Button type="button" onClick={addYoutube} className="h-10 px-4 bg-primary text-white shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {youtubeLinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-bg-elevated/20 hover:border-primary/30 transition-colors">
                <span className="text-xs text-text-primary truncate max-w-[280px]">{link}</span>
                <button type="button" onClick={() => removeYoutube(idx)} className="text-error hover:text-red-400 p-1 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {youtubeLinks.length === 0 && (
              <p className="text-xs text-text-muted italic">No YouTube links added yet.</p>
            )}
          </div>
        </div>

        {/* 360 Virtual Tour Placeholder */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-400" />
              Matterport 360° Virtual Tour Link
            </h3>
            <p className="text-xs text-text-secondary">Provide an iframe embed or shareable URL from Matterport to allow guest tours.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="virtual_tour">360° Tour Shareable Link</Label>
            <Input 
              id="virtual_tour"
              placeholder="https://my.matterport.com/show/?m=..." 
              value={virtualTour || ""}
              onChange={e => setVirtualTour(e.target.value || null)}
            />
            {virtualTour && (
              <div className="p-3 bg-bg-elevated/20 border border-border/80 rounded-xl space-y-2 text-xs">
                <p className="text-emerald-400 font-bold">Virtual tour active!</p>
                <p className="text-[10px] text-text-secondary break-all">{virtualTour}</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
