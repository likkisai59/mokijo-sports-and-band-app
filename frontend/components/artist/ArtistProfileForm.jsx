"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import bandApi from "@/lib/bandApi";
import UsernameSelector from "./UsernameSelector";
import { User, Music, Phone, MapPin, DollarSign, Users, Award, ShieldCheck, ArrowRight } from "lucide-react";

export default function ArtistProfileForm({ initialData = {}, onSaved }) {
    const [form, setForm] = useState({
        display_name: initialData.display_name || "",
        username: initialData.username || "",
        bio: initialData.bio || "",
        mobile_number: initialData.mobile_number || "",
        band_type: initialData.band_type || "Solo",
        total_members: initialData.total_members || 1,
        years_of_experience: initialData.years_of_experience || 0,
        base_rate: initialData.base_rate || 0,
        travel_charges: initialData.travel_charges || 0,
        travel_radius: initialData.travel_radius || 0,
        youtube_links: (initialData.youtube_links || []).join(", "),
        instagram_reels: (initialData.instagram_reels || []).join(", "),
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const num = (v) => (v === "" ? 0 : Number(v));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            display_name: form.display_name,
            username: form.username || undefined,
            bio: form.bio,
            mobile_number: form.mobile_number || undefined,
            band_type: form.band_type,
            total_members: num(form.total_members),
            years_of_experience: num(form.years_of_experience),
            base_rate: num(form.base_rate),
            travel_charges: num(form.travel_charges),
            travel_radius: num(form.travel_radius),
            youtube_links: form.youtube_links ? form.youtube_links.split(",").map((s) => s.trim()).filter(Boolean) : [],
            instagram_reels: form.instagram_reels ? form.instagram_reels.split(",").map((s) => s.trim()).filter(Boolean) : [],
        };

        try {
            const res = await bandApi.put("/artists/me", payload);
            toast.success("Artist profile updated successfully!");
            if (onSaved) onSaved(res.data);
        } catch (err) {
            const msg = err.response?.data?.detail || "Failed to update artist profile.";
            toast.error(typeof msg === "string" ? msg : "Update failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl w-full">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#c6ff3d]">Profile Settings</div>
                    <h2 className="text-xl font-black mt-0.5">Performer & Band Details</h2>
                    <p className="text-xs text-gray-300 mt-1">Keep your profile updated to rank higher in marketplace searches.</p>
                </div>
                <div className="hidden sm:block text-3xl">🎤</div>
            </div>

            {/* Basic Info Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" /> General Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Display / Stage Name <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <Music className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                name="display_name"
                                type="text"
                                required
                                value={form.display_name}
                                onChange={handleChange}
                                placeholder="e.g. The Midnight Revival"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm focus:outline-none focus:border-[#c6ff3d] focus:ring-2 focus:ring-[#c6ff3d]/30 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <UsernameSelector
                            value={form.username}
                            onChange={(u) => setForm((prev) => ({ ...prev, username: u }))}
                            displayName={form.display_name}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                        Artist Bio / Musical Style
                    </label>
                    <textarea
                        name="bio"
                        rows={3}
                        value={form.bio}
                        onChange={handleChange}
                        placeholder="Tell clients and venue managers about your performance style, genres, and background…"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm focus:outline-none focus:border-[#c6ff3d] focus:ring-2 focus:ring-[#c6ff3d]/30 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Performer Type
                        </label>
                        <select
                            name="band_type"
                            value={form.band_type}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm cursor-pointer focus:outline-none focus:border-[#c6ff3d]"
                        >
                            <option value="Solo">Solo Performer</option>
                            <option value="Duo">Duo</option>
                            <option value="Band">Full Band</option>
                            <option value="DJ">DJ</option>
                            <option value="Orchestra">Orchestra</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Band Members
                        </label>
                        <div className="relative">
                            <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                name="total_members"
                                type="number"
                                min="1"
                                value={form.total_members}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Experience (Years)
                        </label>
                        <div className="relative">
                            <Award className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                name="years_of_experience"
                                type="number"
                                min="0"
                                value={form.years_of_experience}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing & Travel Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Rates & Travel Policy
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Base Rate (₹ / Hour)
                        </label>
                        <input
                            name="base_rate"
                            type="number"
                            min="0"
                            value={form.base_rate}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Travel Fee (₹)
                        </label>
                        <input
                            name="travel_charges"
                            type="number"
                            min="0"
                            value={form.travel_charges}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                            Travel Radius (KM)
                        </label>
                        <div className="relative">
                            <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                name="travel_radius"
                                type="number"
                                min="0"
                                value={form.travel_radius}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Media & Portfolio Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-emerald-600" /> Portfolio & Video Demos
                </h3>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                        YouTube Video URLs (comma separated)
                    </label>
                    <input
                        name="youtube_links"
                        type="text"
                        value={form.youtube_links}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..., https://youtu.be/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f] mb-1.5">
                        Instagram Reel URLs (comma separated)
                    </label>
                    <input
                        name="instagram_reels"
                        type="text"
                        value={form.instagram_reels}
                        onChange={handleChange}
                        placeholder="https://instagram.com/reel/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#c6ff3d] hover:bg-[#b5f02c] text-[#0a0a0f] font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
                <span>{loading ? "Saving Profile…" : "Save Artist Profile"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
        </form>
    );
}
