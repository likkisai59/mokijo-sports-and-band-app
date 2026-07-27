"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Mail, MapPin, Phone, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const faqs = [
  {
    question: "Who should I contact for booking support?",
    answer:
      "Our team can help with new bookings, artist discovery, venue partnerships, and platform questions.",
  },
  {
    question: "Can I request a custom event consultation?",
    answer:
      "Yes. Share your event details and we’ll connect you with the right specialist for your timeline and needs.",
  },
  {
    question: "Do you support venue and artist onboarding?",
    answer:
      "Absolutely. We provide onboarding support for both talent and venues, including profile setup and initial guidance.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Contact BandConnect</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Let’s plan the perfect live experience together.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-secondary">
                Reach out for artist bookings, venue partnerships, event support, or general
                platform assistance. We are here to help you get started.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-border/70 bg-bg-card/70 p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Email</p>
                  <a
                    href="mailto:hello@bandconnect.com"
                    className="text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    hello@bandconnect.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Phone</p>
                  <a
                    href="tel:+1-800-555-0198"
                    className="text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    +1 (800) 555-0198
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Visit</p>
                  <p className="text-sm text-text-secondary">
                    88 Harbor Avenue, Suite 400, Los Angeles, CA
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-text-primary">Response time</p>
                  <p className="text-sm text-text-secondary">Typically within one business day.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-4xl border border-border/70 p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Send a message
                </p>
                <h2 className="mt-2 text-2xl font-bold text-text-primary">
                  We’d love to hear from you.
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary" htmlFor="name">
                    Name
                  </label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-primary" htmlFor="email">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary" htmlFor="subject">
                  Subject
                </label>
                <Input id="subject" placeholder="How can we help?" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary" htmlFor="message">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your event, booking, or questions."
                  rows={5}
                  required
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-secondary">
                  {submitted
                    ? "Thanks for reaching out. A member of our team will follow up shortly."
                    : "We typically reply within one business day."}
                </p>
                <Button type="submit" className="w-full sm:w-auto">
                  Send message
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 md:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-4xl border border-border/70 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Local presence
            </p>
            <h2 className="mt-3 text-2xl font-bold text-text-primary">
              A studio and support hub for the live entertainment community.
            </h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Our team works closely with clients, performers, and venue partners to make every
              event feel personalized, organized, and stress-free.
            </p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-border/70">
              <div className="h-56 bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.3),transparent_60%)]" />
            </div>
          </div>

          <div className="rounded-4xl border border-border/70 bg-bg-card/70 p-8 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Frequently asked questions
            </p>
            <div className="mt-6 space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-bg-elevated/50 p-4"
                >
                  <h3 className="text-base font-bold text-text-primary">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Browse artists
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
