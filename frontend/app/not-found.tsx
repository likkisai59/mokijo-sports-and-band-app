import Link from "next/link";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary px-6">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        <div className="p-4 bg-bg-card rounded-full border border-border mb-6 animate-pulse">
          <Music className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-6xl font-black text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-4">Stage is Empty</h2>
        <p className="text-text-secondary mb-8 leading-relaxed">
          The page or performer you are searching for is offstage. They might have relocated to a different venue or completed their gig.
        </p>
        <div className="flex gap-4">
          <Link href="/">
            <Button size="lg" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
