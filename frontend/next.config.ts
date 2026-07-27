import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/artist/bookings/history",
        destination: "/artist/bookings",
      },
      {
        source: "/artist/bookings/calendar",
        destination: "/artist/bookings?tab=calendar",
      },
    ];
  },
  // Ensure we can proxy API calls if required, or handle CORS on backend
};

export default nextConfig;
