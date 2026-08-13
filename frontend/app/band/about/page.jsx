import React from "react";
import { Sparkles, ShieldCheck, Music, Building2, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen pt-24 pb-16 px-6 max-w-5xl mx-auto space-y-12 text-center">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>About BandConnect</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-text-primary font-heading">
          Revolutionizing Live Music Booking
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
          BandConnect is India's premier platform connecting event organizers, clients, and music lovers directly with verified live bands, solo instrumentalists, and premium event venue spaces.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-bg-card/45 backdrop-blur-md border border-border/70 p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Music className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary">For Performers</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Create professional profiles, showcase audio/video reels, set custom rates, and receive direct gig bookings with secure payments.
          </p>
        </div>

        <div className="bg-bg-card/45 backdrop-blur-md border border-border/70 p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary">For Venue Owners</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            List banquet halls, rooftop spaces, and concert arenas to attract live performances and private event hosts.
          </p>
        </div>

        <div className="bg-bg-card/45 backdrop-blur-md border border-border/70 p-6 rounded-2xl space-y-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary">For Organizers</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Transparent pricing, verified ratings, real-time availability checks, and zero middleman markups.
          </p>
        </div>
      </div>
    </div>
  );
}
