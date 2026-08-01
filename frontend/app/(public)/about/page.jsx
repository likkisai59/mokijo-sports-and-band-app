import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Music2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    title: "Trusted marketplace",
    description:
      "Every profile, booking, and review is built to help clients and performers make confident decisions.",
    icon: ShieldCheck,
  },
  {
    title: "Secure payments",
    description:
      "Protect your bookings with clear workflows, escrow-ready processes, and dependable communication.",
    icon: CheckCircle2,
  },
  {
    title: "Flexible experiences",
    description:
      "Book solo artists, full bands, wedding acts, and venue-backed performances for every occasion.",
    icon: Music2,
  },
  {
    title: "Managed operations",
    description:
      "Coordinate schedules, availability, and event details in one streamlined platform.",
    icon: CalendarDays,
  },
];

const steps = [
  {
    title: "Discover",
    description:
      "Browse verified artists, bands, and venues that match your event style and budget.",
  },
  {
    title: "Connect",
    description:
      "Start a conversation, discuss logistics, and confirm availability with a few clicks.",
  },
  {
    title: "Book",
    description:
      "Secure your performance with a simple booking flow designed for confidence and transparency.",
  },
  {
    title: "Perform",
    description:
      "Deliver a memorable show while the platform helps keep your experience organized and stress-free.",
  },
];

const stats = [
  { label: "Live bands", value: "2.5k+" },
  { label: "Venue partners", value: "900+" },
  { label: "Events hosted", value: "18k+" },
  { label: "Active users", value: "50k+" },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 md:px-8 lg:px-10 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>About BandConnect</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-balance md:text-5xl lg:text-6xl">
                Where memorable performances meet effortless booking.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-secondary">
                BandConnect is a modern marketplace for clients, bands, solo artists, and venue
                owners to discover, book, and manage live entertainment with confidence.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/artists" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Explore performers
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full">
                  Contact us
                </Button>
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-border/70 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
              Our promise
            </p>
            <h2 className="mt-3 text-2xl font-bold text-text-primary">
              A trusted platform for the live entertainment community.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-text-secondary">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Connect clients and talent in a secure, transparent marketplace for gig discovery
                  and booking.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Support artists and venues with reliable scheduling, communication, and payment
                  clarity.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Make live entertainment easier to discover, book, and experience from first
                  inquiry to final encore.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-3xl border border-border/70 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Mission
            </p>
            <h3 className="mt-3 text-2xl font-bold text-text-primary">
              Bring the right performers to the right stage.
            </h3>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              We simplify the way people find and book live entertainment so every event feels
              curated, professional, and easy to manage.
            </p>
          </div>
          <div className="glass-card rounded-3xl border border-border/70 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Vision</p>
            <h3 className="mt-3 text-2xl font-bold text-text-primary">
              Create a thriving ecosystem for unforgettable live experiences.
            </h3>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              BandConnect is building a trusted network where clients can discover amazing
              performers, artists can grow their audience, and venues can fill their calendars with
              confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 md:px-8 lg:px-10 lg:py-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-3xl border border-border/70 p-6 shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-8 lg:px-10">
        <div className="rounded-4xl border border-border/70 bg-bg-card/70 p-8 shadow-2xl md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold text-text-primary">
                A simple path from inspiration to live performance.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-text-secondary">
              Whether you are planning a wedding, corporate event, festival, or intimate
              celebration, BandConnect helps you move from browsing to booking with ease.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/60 bg-bg-elevated/60 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  0{index + 1}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 md:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-3xl border border-border/70 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Why choose BandConnect
            </p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary">
              Built for modern event planning.
            </h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              We bring together performers, venues, and clients in a polished experience that feels
              professional from the first message to the final applause.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Discover verified artists and venues tailored to your event.",
                "Keep communications and bookings organized in one place.",
                "Support a secure and trusted live entertainment ecosystem.",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-bg-elevated/40 p-4"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-7 text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-border/70 bg-linear-to-br from-primary/10 via-bg-card/80 to-secondary/10 p-8 shadow-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat, index) => (
                <div key={index} className="rounded-2xl border border-border/60 bg-bg-card/70 p-6">
                  <div className="text-3xl font-black text-text-primary">{stat.value}</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border/60 bg-bg-card/70 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Ready to get started?
                </p>
                <h3 className="mt-2 text-xl font-bold text-text-primary">
                  Let’s help you create the perfect live experience.
                </h3>
              </div>
              <Link href="/contact" className="w-full md:w-auto">
                <Button className="w-full md:w-auto">
                  Talk to the team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
