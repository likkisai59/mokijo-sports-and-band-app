"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { bandLogin } from "../../../lib/bandAuth";

export default function BandLoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setError("");
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const data = await bandLogin(form.email, form.password);
            toast.success(`Welcome back, ${data.user.name}!`);
            router.push("/band/dashboard");
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (detail) {
                setError(typeof detail === "string" ? detail : "Login failed.");
            } else {
                setError("Cannot connect to server. Is the backend running?");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="band-auth">
            <div className="band-auth__card">
                <div className="band-auth__logo">Mukijo Band</div>
                <h1 className="band-auth__title">Sign in</h1>
                <p className="band-auth__sub">Welcome back — enter your credentials to continue.</p>

                {error && <div className="band-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="band-field">
                        <label className="band-field__label">Email address</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="band-field__input"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="band-field__input"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="band-btn band-btn--primary" style={{ width: "100%" }} disabled={loading}>
                        {loading ? "Signing in…" : "Sign in →"}
                    </button>
                </form>

                <div className="band-auth__footer">
                    Don&apos;t have an account? <Link href="/band/register">Create one free</Link>
                </div>
            </div>
        </div>
    );
}
