import BandNavbar from "@/components/band/BandNavbar";
import "./styles/band.css";

export const metadata = {
    title: "Mukijo Band — Artists, Venues & Bookings",
    description:
        "Discover and book live artists, bands, and venues. The music marketplace inside Mukijo.",
};

export default function BandLayout({ children }) {
    return (
        <div className="band-app">
            <BandNavbar />
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</main>
            <footer className="band-footer">
                © 2026 Mukijo Band — Live music marketplace.
            </footer>
        </div>
    );
}
