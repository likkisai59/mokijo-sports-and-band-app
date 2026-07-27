import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { PermissionProvider } from "@/providers/permission-provider";
import { DeveloperPreviewProvider } from "@/providers/developer-preview-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BandConnect — Live Music Band Booking Platform",
    template: "%s | BandConnect"
  },
  description: "Connect and book professional music bands, solo artists, and top live performers directly for your corporate gigs, weddings, and private events.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "BandConnect — Book Live Music Bands Directly",
    description: "The Airbnb for live entertainment. Discover top-rated local bands, check real-time availability, secure escrow payouts.",
    url: "/",
    siteName: "BandConnect",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-bg-primary text-text-primary selection:bg-primary/30">
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <PermissionProvider>
                <DeveloperPreviewProvider>
                  {children}
                  <ToastProvider />
                </DeveloperPreviewProvider>
              </PermissionProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
