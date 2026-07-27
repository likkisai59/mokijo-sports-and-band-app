import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header />

      {/* Page Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer bar */}
      <Footer />
    </div>
  );
}
