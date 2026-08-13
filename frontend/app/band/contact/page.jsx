"use client";
import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Sparkles, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto space-y-10">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <div className="relative z-10 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-text-primary font-heading">
          Contact Us
        </h1>
        <p className="text-sm text-text-secondary max-w-xl mx-auto">
          Have questions about booking an artist, listing a venue, or platform partnerships? We're here to help.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info */}
        <div className="bg-bg-card/45 backdrop-blur-md border border-border/70 p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-bold text-text-primary border-b border-border/30 pb-3">
            Contact Details
          </h3>
          <div className="space-y-4 text-xs text-text-secondary">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>support@bandconnect.in</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>Chennai, Tamil Nadu, India</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-bg-card/45 backdrop-blur-md border border-border/70 p-6 rounded-2xl">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-text-primary">Message Sent!</h3>
              <p className="text-xs text-text-secondary">Thank you for reaching out. We will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-text-muted uppercase block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-bg-primary border border-border/80 rounded-lg text-text-primary px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="font-bold text-text-muted uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 bg-bg-primary border border-border/80 rounded-lg text-text-primary px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="font-bold text-text-muted uppercase block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 bg-bg-primary border border-border/80 rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-primary to-cyan-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
