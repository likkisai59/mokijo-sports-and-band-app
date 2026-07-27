import Link from "next/link";
import { Sparkles, Music, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background glow effects */}
      <div className="absolute inset-0 glow-overlay pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-semibold mb-6 animate-fade-in">
          <Sparkles className="h-4 w-4" />
          <span>The Future of Event Entertainment</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none text-balance">
          Book The Perfect <span className="text-primary">Live Band</span> For Your Event
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mb-10 leading-relaxed text-balance">
          Direct bookings, real-time availability, secure escrow payments, and verified reviews. Hire world-class solo musicians and music bands in just a few clicks.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mb-16">
          <Link href="/artists" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base font-bold h-12 px-8">
              Explore Live Bands
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full text-base font-bold h-12 px-8">
              Join as Performer
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10">
          <div className="glass-card p-8 rounded-2xl text-left hover:border-primary/20 transition-all duration-300 group">
            <div className="p-3 bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Music className="h-6 w-6 text-primary group-hover:text-text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Diverse Performers</h3>
            <p className="text-text-secondary leading-relaxed">
              From rock bands to jazz quartets, classical ensembles, and custom performance configurations.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left hover:border-primary/20 transition-all duration-300 group">
            <div className="p-3 bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:text-text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure Escrow Payouts</h3>
            <p className="text-text-secondary leading-relaxed">
              Your payments are held securely in escrow and released automatically only after the successful completion of the gig.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left hover:border-primary/20 transition-all duration-300 group">
            <div className="p-3 bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Star className="h-6 w-6 text-primary group-hover:text-text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Ratings</h3>
            <p className="text-text-secondary leading-relaxed">
              Read honest reviews from real host clients, corporate event managers, and wedding organizers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
