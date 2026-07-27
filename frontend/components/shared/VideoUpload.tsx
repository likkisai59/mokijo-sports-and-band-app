"use client";

import * as React from "react";
import { X, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  subfolder?: string;
}

export function VideoUpload({ value, onChange, onRemove, subfolder: _subfolder = "general" }: VideoUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Standard validations
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must not exceed 20MB.");
      return;
    }

    setIsUploading(true);
    try {
      // Sandbox mode: mock response URL
      const mockUrl = URL.createObjectURL(file); // Temporary preview URL
      setTimeout(() => {
        onChange(mockUrl);
        setIsUploading(false);
        toast.success("Video uploaded successfully! (Sandbox)");
      }, 1000);
    } catch {
      toast.error("Failed to upload video.");
      setIsUploading(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {value ? (
        <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-border bg-bg-card flex items-center justify-center">
          <video src={value} controls className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="w-full max-w-sm aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-bg-card/40 flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all"
          onClick={triggerSelect}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <Spinner />
          ) : (
            <>
              <div className="p-3 bg-bg-elevated rounded-full border border-border group-hover:bg-primary group-hover:text-white transition-colors">
                <VideoIcon className="h-5 w-5 text-text-secondary group-hover:text-text-primary" />
              </div>
              <p className="text-sm font-semibold text-text-primary">Click to upload demo video</p>
              <p className="text-xs text-text-muted">Supports MP4, WebM (Max 20MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
