import Link from "next/link";
import { authPrimaryBtnClass, authPrimaryBtnClassDark } from "./auth-classes";

export default function AuthSuccess({
    title = "Registration Successful",
    message,
    ctaHref,
    ctaLabel = "Continue",
    variant = "dark",
}) {
    const isDark = variant === "dark";
    const btnClass = isDark ? authPrimaryBtnClassDark : authPrimaryBtnClass;

    return (
        <div
            className={
                isDark
                    ? "flex flex-col items-center text-center p-6 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl"
                    : "flex flex-col items-center text-center p-6 bg-[#f7f7f8] border border-[rgba(10,10,15,0.08)] rounded-2xl"
            }
        >
            <div
                className={
                    isDark
                        ? "w-14 h-14 rounded-full bg-[rgba(198,255,61,0.15)] border border-[rgba(198,255,61,0.4)] text-[#c6ff3d] flex items-center justify-center text-xl font-bold mb-4"
                        : "w-14 h-14 rounded-full bg-[rgba(198,255,61,0.25)] border border-[rgba(198,255,61,0.5)] text-[#0a0a0f] flex items-center justify-center text-xl font-bold mb-4"
                }
            >
                ✓
            </div>
            <h2 className={isDark ? "text-xl font-semibold text-[#f4f4f5] mb-2" : "text-xl font-semibold text-[#0a0a0f] mb-2"}>
                {title}
            </h2>
            {message ? (
                <p
                    className={
                        isDark
                            ? "text-sm leading-relaxed text-[rgba(244,244,245,0.5)] max-w-sm"
                            : "text-sm leading-relaxed text-[#5c5c66] max-w-sm"
                    }
                >
                    {message}
                </p>
            ) : null}
            {ctaHref ? (
                <Link
                    href={ctaHref}
                    className={`${btnClass} mt-6 no-underline text-center flex items-center justify-center`}
                >
                    {ctaLabel}
                </Link>
            ) : null}
        </div>
    );
}
