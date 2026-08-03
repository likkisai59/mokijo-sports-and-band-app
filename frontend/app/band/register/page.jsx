"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import bandApi from "@/lib/bandApi";
import { bandLogin, saveBandSession, BAND_ROLES } from "@/lib/bandAuth";

const ROLES = [
    { key: BAND_ROLES.CLIENT, icon: "🎵", label: "Client", desc: "Book artists & venues" },
    { key: BAND_ROLES.ARTIST, icon: "🎤", label: "Artist / Band", desc: "Get booked & perform" },
    { key: BAND_ROLES.VENUE_OWNER, icon: "🎪", label: "Venue Owner", desc: "List your event space" },
];

export default function BandRegisterPage() {
    const router = useRouter();
    const [role, setRole] = useState(BAND_ROLES.CLIENT);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        // artist
        display_name: "",
        band_type: "Solo",
        base_rate: "",
        bio: "",
        // venue
        venue_name: "",
        address: "",
        base_price: "",
        capacity: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k) => (e) => {
        setError("");
        setForm((p) => ({ ...p, [k]: e.target.value }));
    };

    const num = (v) => (v === "" ? undefined : Number(v));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (role === BAND_ROLES.CLIENT) {
                const { data } = await bandApi.post("/auth/register", {
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    phone: form.phone || undefined,
                    role: "client",
                });
                saveBandSession(data);
            } else if (role === BAND_ROLES.ARTIST) {
                await bandApi.post("/artists/register", {
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    mobile_number: form.phone || undefined,
                    display_name: form.display_name || undefined,
                    band_type: form.band_type,
                    base_rate: num(form.base_rate) ?? 0,
                    bio: form.bio || undefined,
                });
                await bandLogin(form.email, form.password);
            } else {
                await bandApi.post("/venues/register", {
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    venue_name: form.venue_name,
                    address: form.address,
                    base_price: num(form.base_price) ?? 0,
                    capacity: num(form.capacity) ?? 0,
                });
                await bandLogin(form.email, form.password);
            }

            toast.success("Account created successfully!");
            router.push("/band/dashboard");
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail ? (typeof detail === "string" ? detail : "Registration failed.") : "Cannot connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="band-auth">
            <div className="band-auth__card">
                <div className="band-auth__logo">Mukijo Band</div>
                <h1 className="band-auth__title">Create your account</h1>
                <p className="band-auth__sub">Join the live music marketplace.</p>

                <div className="band-roles">
                    {ROLES.map((r) => (
                        <div
                            key={r.key}
                            className={`band-role ${role === r.key ? "band-role--active" : ""}`}
                            onClick={() => setRole(r.key)}
                        >
                            <div className="band-role__icon">{r.icon}</div>
                            <div className="band-role__label">{r.label}</div>
                            <div className="band-role__desc">{r.desc}</div>
                        </div>
                    ))}
                </div>

                {error && <div className="band-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="band-field">
                        <label className="band-field__label">{role === BAND_ROLES.VENUE_OWNER ? "Your name" : "Full name"}</label>
                        <input className="band-field__input" value={form.name} onChange={set("name")} required />
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Email address</label>
                        <input className="band-field__input" type="email" value={form.email} onChange={set("email")} required />
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Password</label>
                        <input className="band-field__input" type="password" placeholder="Min 8 characters" minLength={8} value={form.password} onChange={set("password")} required />
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Phone {role !== BAND_ROLES.CLIENT && "(optional)"}</label>
                        <input className="band-field__input" value={form.phone} onChange={set("phone")} />
                    </div>

                    {role === BAND_ROLES.ARTIST && (
                        <>
                            <div className="band-field">
                                <label className="band-field__label">Display / Band name</label>
                                <input className="band-field__input" value={form.display_name} onChange={set("display_name")} placeholder="e.g. The Midnight Revival" />
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Band type</label>
                                <select className="band-field__select" value={form.band_type} onChange={set("band_type")}>
                                    <option value="Solo">Solo</option>
                                    <option value="Duo">Duo</option>
                                    <option value="Band">Band</option>
                                    <option value="DJ">DJ</option>
                                    <option value="Orchestra">Orchestra</option>
                                </select>
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Base rate (₹/hour)</label>
                                <input className="band-field__input" type="number" min="0" value={form.base_rate} onChange={set("base_rate")} placeholder="0" />
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Bio</label>
                                <textarea className="band-field__textarea" value={form.bio} onChange={set("bio")} placeholder="Tell clients about your style…" />
                            </div>
                        </>
                    )}

                    {role === BAND_ROLES.VENUE_OWNER && (
                        <>
                            <div className="band-field">
                                <label className="band-field__label">Venue name</label>
                                <input className="band-field__input" value={form.venue_name} onChange={set("venue_name")} required />
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Address</label>
                                <textarea className="band-field__textarea" value={form.address} onChange={set("address")} required />
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Base price (₹)</label>
                                <input className="band-field__input" type="number" min="0" value={form.base_price} onChange={set("base_price")} placeholder="0" />
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Capacity</label>
                                <input className="band-field__input" type="number" min="0" value={form.capacity} onChange={set("capacity")} placeholder="0" />
                            </div>
                        </>
                    )}

                    <button type="submit" className="band-btn band-btn--primary" style={{ width: "100%" }} disabled={loading}>
                        {loading ? "Creating account…" : "Create account →"}
                    </button>
                </form>

                <div className="band-auth__footer">
                    Already have an account? <Link href="/band/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
