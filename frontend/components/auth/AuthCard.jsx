const SIZE_CLASS = {
    sm: "max-w-[440px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
    register: "max-w-[500px]",
};

export default function AuthCard({ children, size = "sm", className = "", variant = "light" }) {
    const width = SIZE_CLASS[size] || SIZE_CLASS.sm;
    const isDark = variant === "dark";
    return (
        <div className={`w-full ${width} ${className}`}>
            <div
                className={
                    isDark
                        ? "auth-card--dark"
                        : "bg-white border border-[rgba(10,10,15,0.08)] rounded-2xl px-10 py-9 md:px-12 md:py-10 flex flex-col gap-6 shadow-[0_8px_30px_rgba(10,10,15,0.06)]"
                }
            >
                {children}
            </div>
        </div>
    );
}
