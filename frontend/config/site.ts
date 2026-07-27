export const siteConfig = {
  name: "BandConnect",
  description: "Live Music Band Booking Platform — The Airbnb for live entertainment.",
  url: "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  mainNav: [
    {
      title: "Find Artists",
      href: "/artists",
    },
    {
      title: "Venues",
      href: "/venues",
    },
  ],
  links: {
    terms: "/terms",
    privacy: "/privacy",
  },
};

export type SiteConfig = typeof siteConfig;
