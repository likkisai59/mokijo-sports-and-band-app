import { GuestRoute } from "@/components/shared/GuestRoute";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestRoute>
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-bg-primary py-12 px-6">
        <div className="absolute inset-0 glow-overlay pointer-events-none" />
        <div className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <BrandLogo iconSize="lg" textSize="2xl" />
          </div>
          <div className="glass-card rounded-2xl p-8 shadow-xl">
            {children}
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}

