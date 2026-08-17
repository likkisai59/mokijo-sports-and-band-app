import React from "react";
import { Link } from "react-router-dom";
import { Music, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function BandFooter() {
  return (
    <footer className="bg-white border-t border-[rgba(10,10,15,0.06)] text-[#5c5c66] text-sm mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/band" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0a0a0f] flex items-center justify-center text-[#c6ff3d]">
                <Music className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#0a0a0f]">
                Band<span className="text-slate-500">Connect</span>
              </span>
            </Link>
            <p className="text-[#5c5c66] text-sm leading-relaxed max-w-sm">
              The premier marketplace connecting event organizers with verified live bands, solo artists, and state-of-the-art concert venues.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Admin-Verified Performers & Venues</span>
            </div>
          </div>

          {/* Col 2: For Clients */}
          <div>
            <h4 className="text-[#0a0a0f] font-extrabold text-xs tracking-wider uppercase mb-4">Discover</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/band/artists" className="hover:text-[#0a0a0f] transition-colors">
                  Live Bands & Groups
                </Link>
              </li>
              <li>
                <Link to="/band/artists?band_type=Solo" className="hover:text-[#0a0a0f] transition-colors">
                  Solo Vocalists & DJs
                </Link>
              </li>
              <li>
                <Link to="/band/venues" className="hover:text-[#0a0a0f] transition-colors">
                  Auditoriums & Arenas
                </Link>
              </li>
              <li>
                <Link to="/band/venues?venue_type=Rooftop" className="hover:text-[#0a0a0f] transition-colors">
                  Rooftop & Lounge Spaces
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Providers */}
          <div>
            <h4 className="text-[#0a0a0f] font-extrabold text-xs tracking-wider uppercase mb-4">For Providers</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/band/register?role=artist" className="hover:text-[#0a0a0f] transition-colors">
                  Join as Performer
                </Link>
              </li>
              <li>
                <Link to="/band/register?role=venue_owner" className="hover:text-[#0a0a0f] transition-colors">
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link to="/band/login" className="hover:text-[#0a0a0f] transition-colors">
                  Provider Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <h4 className="text-[#0a0a0f] font-extrabold text-xs tracking-wider uppercase mb-4">Contact & Trust</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@bandconnect.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 (040) 800-CONNECT</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>HITEC City, Hyderabad, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[rgba(10,10,15,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} BandConnect. Mokijo Sports & Entertainment Platform.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">Security Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
