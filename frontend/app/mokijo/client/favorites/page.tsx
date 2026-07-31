"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Heart, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClientFavoritesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Favorite Performers
        </h1>
        <p className="text-xs text-text-secondary">
          Keep track of your favorite bands, solo artists, and top-rated venue spaces.
        </p>
      </div>

      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-xl p-8 text-center flex flex-col items-center justify-center min-h-[40vh]">
        <Heart className="h-10 w-10 text-text-muted mb-3 animate-pulse" />
        <h3 className="text-base font-extrabold text-text-primary mb-1">Your Favorites List is Empty</h3>
        <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
          Browse the performer and venue directories to add bands or event spaces to your favorites layout.
        </p>
        <div className="flex gap-2">
          <Link href="/artists">
            <Button size="sm" className="font-bold text-xs h-9">
              <Compass className="h-4 w-4 mr-1" />
              Browse Artists
            </Button>
          </Link>
          <Link href="/venues">
            <Button size="sm" variant="outline" className="font-bold text-xs h-9">
              <Compass className="h-4 w-4 mr-1" />
              Browse Venues
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
