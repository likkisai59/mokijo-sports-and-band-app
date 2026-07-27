"use client";

import React, { useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightboxModalProps {
  imageUrl: string | null;
  imageName?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LightboxModal({
  imageUrl,
  imageName,
  isOpen,
  onClose,
}: LightboxModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 animate-in fade-in select-none">
      {/* Top Header Controls */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 text-white">
        <div className="flex items-center gap-2 truncate">
          <span className="text-sm font-semibold truncate max-w-md">
            {imageName || "Image Preview"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            download={imageName || "image"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image Display */}
      <div
        className="flex-1 w-full max-w-5xl flex items-center justify-center p-2 my-auto overflow-hidden cursor-zoom-out"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={imageName || "Attachment Preview"}
          className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-white/60 z-10 text-center pb-2">
        Press ESC or click anywhere outside to close
      </div>
    </div>
  );
}
