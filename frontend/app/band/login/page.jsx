"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { bandLogin } from "@/lib/bandAuth";

const loginSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Email is invalid.").trim().toLowerCase(),
    password: z.string().min(1, "Password is required.")
});

export default function BandLoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const onSubmit = async (data) => {
        setError("");
        try {
            const res = await bandLogin(data.email, data.password);
            toast.success(`Welcome back, ${res.user.name}!`);
            router.push("/band/dashboard");
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (detail) {
                setError(typeof detail === "string" ? detail : "Login failed.");
            } else {
                setError("Cannot connect to server. Is the backend running?");
            }
        }
    };

    return (
        <div className="band-auth">
            <div className="band-auth__card">
                <div className="band-auth__logo">Mukijo Band</div>
                <h1 className="band-auth__title">Sign in</h1>
                <p className="band-auth__sub">Welcome back — enter your credentials to continue.</p>

                {error && <div className="band-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="band-field">
                        <label className="band-field__label">Email address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className={`band-field__input ${errors.email ? "border-red-500" : ""}`}
                            {...register("email")}
                        />
                        {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`band-field__input ${errors.password ? "border-red-500" : ""}`}
                                style={{ paddingRight: "40px" }}
                                {...register("password")}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-white transition-colors"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="band-btn band-btn--primary" style={{ width: "100%" }} disabled={isSubmitting || !isValid}>
                        {isSubmitting ? "Signing in…" : "Sign in →"}
                    </button>
                </form>

                <div className="band-auth__footer">
                    Don&apos;t have an account? <Link href="/band/register">Create one free</Link>
                </div>
            </div>
        </div>
    );
}
