export default function AuthBrand({ title, subtitle, align = "left", variant = "light", logoText = "MUKIJO" }) {
    const isDark = variant === "dark";
    const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

    if (isDark) {
        return (
            <div className={align === "center" ? "text-center" : "text-left"}>
                <div className="auth-brand--dark">{logoText}</div>
                {title ? <h1 className="auth-title--dark">{title}</h1> : null}
                {subtitle ? <p className="auth-sub--dark">{subtitle}</p> : null}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-1.5 ${alignClass}`}>
            <span className="auth-brand text-[22px] md:text-[26px] leading-none mb-1">{logoText}</span>
            {title ? (
                <h1 className="text-[22px] md:text-2xl font-semibold tracking-tight text-[#0a0a0f]">{title}</h1>
            ) : null}
            {subtitle ? <p className="text-sm text-[#5c5c66] leading-relaxed">{subtitle}</p> : null}
        </div>
    );
}
