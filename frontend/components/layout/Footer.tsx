import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card/50 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-2">
          <BrandLogo iconSize="md" textSize="lg" />
          <p className="text-xs text-text-muted mt-2">
            Direct live entertainment bookings, automated schedules, secure payouts.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/artists" className="text-text-secondary hover:text-text-primary transition-colors">
            Artists
          </Link>
          <Link href="/venues" className="text-text-secondary hover:text-text-primary transition-colors">
            Venues
          </Link>
          <Link href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-border/30 mt-8 pt-6 text-center">
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} BandConnect. All rights reserved. Made for professional artists.
        </p>
      </div>
    </footer>
  );
}

