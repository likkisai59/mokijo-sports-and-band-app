"use client";

import * as React from "react";
import Image from "next/image";
import { MediaGalleryData, GalleryItem, VideoItem } from "@/types/artist";
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
  Instagram,
  Youtube
} from "lucide-react";
import toast from "react-hot-toast";

interface ArtistMediaGalleryProps {
  media: MediaGalleryData;
  onSave: (updated: MediaGalleryData) => Promise<void>;
}

const ALBUMS = ["Live Shows", "Studio Sessions", "Promo Shoots", "General"];
const VIDEO_CATEGORIES = ["Live Performance", "Music Video", "Promo clip", "Rehearsals"];

export function ArtistMediaGallery({ media, onSave }: ArtistMediaGalleryProps) {
  const [gallery, setGallery] = React.useState<GalleryItem[]>(media.gallery || []);
  const [videos, setVideos] = React.useState<VideoItem[]>(media.videos || []);
  const [youtubeLinks, setYoutubeLinks] = React.useState<string[]>(media.youtube_links || []);
  const [reels, setReels] = React.useState<string[]>(media.instagram_reels || []);

  const [saving, setSaving] = React.useState(false);

  // New item inputs
  const [newAlbumName, setNewAlbumName] = React.useState("General");
  const [newYoutubeUrl, setNewYoutubeUrl] = React.useState("");
  const [newReelUrl, setNewReelUrl] = React.useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        gallery,
        videos,
        youtube_links: youtubeLinks,
        instagram_reels: reels
      });
      toast.success("Gallery and Media updates saved successfully!");
    } catch {
      toast.error("Failed to save media changes.");
    } finally {
      setSaving(false);
    }
  };

  // Gallery methods
  const addImageToGallery = (url: string) => {
    if (!url) return;
    const newItem: GalleryItem = {
      url,
      is_cover: gallery.length === 0, // auto make first image cover
      album: newAlbumName
    };
    setGallery(prev => [...prev, newItem]);
  };

  const removeImage = (idx: number) => {
    setGallery(prev => {
      const current = [...prev];
      const wasCover = current[idx]?.is_cover;
      current.splice(idx, 1);
      
      // If deleted cover image, make first element cover
      if (wasCover && current.length > 0) {
        current[0].is_cover = true;
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
    toast.success("Cover image updated!");
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
    const newItem: VideoItem = {
      url,
      type: "file",
      category: "Live Performance",
      thumbnail: ""
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

  // Instagram Reels methods
  const addInstagramReel = () => {
    if (!newReelUrl.trim()) return;
    if (!newReelUrl.includes("instagram.com")) {
      toast.error("Please enter a valid Instagram reel URL.");
      return;
    }
    setReels(prev => [...prev, newReelUrl.trim()]);
    setNewReelUrl("");
    toast.success("Instagram Reel added!");
  };

  const removeInstagramReel = (idx: number) => {
    setReels(prev => {
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
          <h2 className="text-xl font-bold text-text-primary">Media Showcase & Albums</h2>
          <p className="text-xs text-text-secondary">Upload high resolution photos and demo show reels.</p>
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

      {/* GALLERY PHOTOS SECTION */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Photo Gallery Albums
          </h3>
          <p className="text-xs text-text-secondary">Upload images of your live performances and categorise them.</p>
        </div>

        {/* Upload layout widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Select Album to upload into</Label>
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
            subfolder="artists/gallery"
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
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* DEMO VIDEOS FILES SECTION */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <VideoIcon className="h-5 w-5 text-primary" />
            Upload Demo Videos
          </h3>
          <p className="text-xs text-text-secondary">Upload raw video files to showcase your audio/video energy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <p className="text-xs text-text-secondary md:col-span-2 leading-relaxed">
            Choose a video file showing your group playing live. Max file size: 20MB. High resolution MP4 preferred.
          </p>
          <VideoUpload 
            onChange={addVideoFile}
            subfolder="artists/videos"
          />
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {videos.filter(v => v.type === "file").map((v, idx) => (
            <div key={idx} className="border border-border/80 rounded-2xl overflow-hidden bg-bg-card/85 flex flex-col group relative">
              <div className="aspect-video w-full relative bg-bg-elevated/40 border-b border-border/50 flex items-center justify-center">
                <video src={v.url} controls className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeVideoFile(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

      {/* YOUTUBE AND REELS SECTION */}
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

        {/* Instagram Reels Widget */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Instagram Reel Links
            </h3>
            <p className="text-xs text-text-secondary">Embed short form clips to show audience engagement.</p>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="https://www.instagram.com/reel/..." 
              value={newReelUrl}
              onChange={e => setNewReelUrl(e.target.value)}
            />
            <Button type="button" onClick={addInstagramReel} className="h-10 px-4 bg-primary text-white shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {reels.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-bg-elevated/20 hover:border-primary/30 transition-colors">
                <span className="text-xs text-text-primary truncate max-w-[280px]">{link}</span>
                <button type="button" onClick={() => removeInstagramReel(idx)} className="text-error hover:text-red-400 p-1 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {reels.length === 0 && (
              <p className="text-xs text-text-muted italic">No Instagram Reels added yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
