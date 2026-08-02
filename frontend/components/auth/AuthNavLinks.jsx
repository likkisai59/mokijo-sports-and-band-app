import Link from "next/link";
import {
    authAccentLinkClass,
    authBackLinkClass,
    authBackLinkClassDark,
    authMutedTextClass,
} from "./auth-classes";

export default function AuthNavLinks({
    showBackHome = true,
    footerPrompt,
    footerHref,
    footerLabel,
    showWrongPortal = true,
    variant = "light",
}) {
    const isDark = variant === "dark";

    if (isDark) {
        return (
            <div>
                {showBackHome ? (
                    <Link href="/" className={authBackLinkClassDark}>
                        ← Back to Home
                    </Link>
                ) : null}
                {footerPrompt && footerHref && footerLabel ? (
                    <div className="auth-footer--dark">
                        {footerPrompt}{" "}
                        <Link href={footerHref}>{footerLabel}</Link>
                    </div>
                ) : null}
                {showWrongPortal ? (
                    <p
                        className={`text-center text-[12px] text-[rgba(244,244,245,0.35)] mb-0 ${
                            footerPrompt && footerHref && footerLabel ? "mt-3" : "mt-[22px]"
                        }`}
                    >
                        Wrong portal?{" "}
                        <Link href="/" className="text-[#d9ff6e] font-semibold no-underline hover:underline">
                            Pick a role on the home page
                        </Link>
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {showBackHome ? (
                <Link href="/" className={authBackLinkClass}>
                    ← Back to Home
                </Link>
            ) : null}
            {footerPrompt && footerHref && footerLabel ? (
                <p className={`${authMutedTextClass} text-center`}>
                    {footerPrompt}{" "}
                    <Link href={footerHref} className={authAccentLinkClass}>
                        {footerLabel}
                    </Link>
                </p>
            ) : null}
            {showWrongPortal ? (
                <p className="text-[12px] text-[#5c5c66]/80 text-center">
                    Wrong portal?{" "}
                    <Link href="/" className={authAccentLinkClass}>
                        Pick a role on the home page
                    </Link>
                </p>
            ) : null}
        </div>
    );
}
