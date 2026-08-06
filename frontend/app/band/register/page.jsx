"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import bandApi from "@/lib/bandApi";
import { bandLogin, saveBandSession, BAND_ROLES } from "@/lib/bandAuth";

const ROLES = [
    { key: BAND_ROLES.CLIENT, icon: "🎵", label: "Client", desc: "Book artists & venues" },
    { key: BAND_ROLES.ARTIST, icon: "🎤", label: "Artist / Band", desc: "Get booked & perform" },
    { key: BAND_ROLES.VENUE_OWNER, icon: "🎪", label: "Venue Owner", desc: "List your event space" },
];

const registerSchema = z.object({
    role: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().min(1, "Email is required.").email("Invalid email format."),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[@$!%*?&]/, "Must contain a special character (@$!%*?&)"),
    phone: z.string().optional(),
    
    // Artist fields
    display_name: z.string().optional(),
    band_type: z.string().optional(),
    base_rate: z.coerce.number().min(0, "Rate cannot be negative").optional(),
    bio: z.string().optional(),
    
    // Venue fields
    venue_name: z.string().optional(),
    address: z.string().optional(),
    base_price: z.coerce.number().min(0, "Price cannot be negative").optional(),
    capacity: z.coerce.number().min(0, "Capacity cannot be negative").optional(),
}).superRefine((data, ctx) => {
    if (data.role === BAND_ROLES.VENUE_OWNER) {
        if (!data.venue_name || data.venue_name.trim() === "") {
            ctx.addIssue({ path: ["venue_name"], message: "Venue name is required.", code: z.ZodIssueCode.custom });
        }
        if (!data.address || data.address.trim() === "") {
            ctx.addIssue({ path: ["address"], message: "Address is required.", code: z.ZodIssueCode.custom });
        }
    }
});

export default function BandRegisterPage() {
    const router = useRouter();
    const [role, setRole] = useState(BAND_ROLES.CLIENT);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting, isValid },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            role: BAND_ROLES.CLIENT,
            band_type: "Solo"
        }
    });

    useEffect(() => {
        setValue("role", role, { shouldValidate: true });
    }, [role, setValue]);

    const num = (v) => (v === "" || v === undefined || v === null || isNaN(v) ? undefined : Number(v));

    const onSubmit = async (data) => {
        setError("");

        try {
            if (role === BAND_ROLES.CLIENT) {
                const { data: resData } = await bandApi.post("/auth/register", {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    phone: data.phone || undefined,
                    role: "client",
                });
                saveBandSession(resData);
            } else if (role === BAND_ROLES.ARTIST) {
                await bandApi.post("/artists/register", {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    mobile_number: data.phone || undefined,
                    display_name: data.display_name || undefined,
                    band_type: data.band_type || "Solo",
                    base_rate: num(data.base_rate) ?? 0,
                    bio: data.bio || undefined,
                });
                await bandLogin(data.email, data.password);
            } else {
                await bandApi.post("/venues/register", {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    venue_name: data.venue_name,
                    address: data.address,
                    base_price: num(data.base_price) ?? 0,
                    capacity: num(data.capacity) ?? 0,
                });
                await bandLogin(data.email, data.password);
            }

            toast.success("Account created successfully!");
            router.push("/band/dashboard");
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail ? (typeof detail === "string" ? detail : "Registration failed.") : "Cannot connect to server.");
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="band-field">
                        <label className="band-field__label">{role === BAND_ROLES.VENUE_OWNER ? "Your name" : "Full name"}</label>
                        <input className={`band-field__input ${errors.name ? "border-red-500" : ""}`} {...register("name")} />
                        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Email address</label>
                        <input className={`band-field__input ${errors.email ? "border-red-500" : ""}`} type="email" {...register("email")} />
                        {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                    </div>

                    <div className="band-field">
                        <label className="band-field__label">Password</label>
                        <div className="relative">
                            <input
                                className={`band-field__input ${errors.password ? "border-red-500" : ""}`}
                                type={showPassword ? "text" : "password"}
                                placeholder="Min 8 characters"
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

                    <div className="band-field">
                        <label className="band-field__label">Phone {role !== BAND_ROLES.CLIENT && "(optional)"}</label>
                        <input className={`band-field__input ${errors.phone ? "border-red-500" : ""}`} {...register("phone")} />
                        {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone.message}</span>}
                    </div>

                    {role === BAND_ROLES.ARTIST && (
                        <>
                            <div className="band-field">
                                <label className="band-field__label">Display / Band name</label>
                                <input className={`band-field__input ${errors.display_name ? "border-red-500" : ""}`} {...register("display_name")} placeholder="e.g. The Midnight Revival" />
                                {errors.display_name && <span className="text-red-500 text-xs mt-1">{errors.display_name.message}</span>}
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Band type</label>
                                <select className="band-field__select" {...register("band_type")}>
                                    <option value="Solo">Solo</option>
                                    <option value="Duo">Duo</option>
                                    <option value="Band">Band</option>
                                    <option value="DJ">DJ</option>
                                    <option value="Orchestra">Orchestra</option>
                                </select>
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Base rate (₹/hour)</label>
                                <input className={`band-field__input ${errors.base_rate ? "border-red-500" : ""}`} type="number" step="any" min="0" {...register("base_rate")} placeholder="0" />
                                {errors.base_rate && <span className="text-red-500 text-xs mt-1">{errors.base_rate.message}</span>}
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Bio</label>
                                <textarea className={`band-field__textarea ${errors.bio ? "border-red-500" : ""}`} {...register("bio")} placeholder="Tell clients about your style…" />
                                {errors.bio && <span className="text-red-500 text-xs mt-1">{errors.bio.message}</span>}
                            </div>
                        </>
                    )}

                    {role === BAND_ROLES.VENUE_OWNER && (
                        <>
                            <div className="band-field">
                                <label className="band-field__label">Venue name</label>
                                <input className={`band-field__input ${errors.venue_name ? "border-red-500" : ""}`} {...register("venue_name")} />
                                {errors.venue_name && <span className="text-red-500 text-xs mt-1">{errors.venue_name.message}</span>}
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Address</label>
                                <textarea className={`band-field__textarea ${errors.address ? "border-red-500" : ""}`} {...register("address")} />
                                {errors.address && <span className="text-red-500 text-xs mt-1">{errors.address.message}</span>}
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Base price (₹)</label>
                                <input className={`band-field__input ${errors.base_price ? "border-red-500" : ""}`} type="number" step="any" min="0" {...register("base_price")} placeholder="0" />
                                {errors.base_price && <span className="text-red-500 text-xs mt-1">{errors.base_price.message}</span>}
                            </div>
                            <div className="band-field">
                                <label className="band-field__label">Capacity</label>
                                <input className={`band-field__input ${errors.capacity ? "border-red-500" : ""}`} type="number" step="1" min="0" {...register("capacity")} placeholder="0" />
                                {errors.capacity && <span className="text-red-500 text-xs mt-1">{errors.capacity.message}</span>}
                            </div>
                        </>
                    )}

                    <button type="submit" className="band-btn band-btn--primary" style={{ width: "100%" }} disabled={isSubmitting || !isValid}>
                        {isSubmitting ? "Creating account…" : "Create account →"}
                    </button>
                </form>

                <div className="band-auth__footer">
                    Already have an account? <Link href="/band/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
