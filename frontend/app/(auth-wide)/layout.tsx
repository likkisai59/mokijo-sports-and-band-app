import { BrandLogo } from "@/components/shared/BrandLogo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-bg-primary">
      <div className="absolute inset-0 glow-overlay pointer-events-none" />
      
      {/* Header / Brand Area */}
      <header className="relative z-10 w-full py-6 px-6 border-b border-border/40 bg-bg-primary/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo iconSize="md" textSize="xl" />
        </div>
      </header>

      {/* Content workspace */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-start">
        {children}
      </main>
    </div>
  );
}

