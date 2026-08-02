import "./auth.css";

export default function AuthShell({ children, variant = "light" }) {
    const isDark = variant === "dark";
    return (
        <div
            className={
                isDark
                    ? "auth-root auth-root--dark min-h-screen flex justify-center items-center overflow-x-hidden relative px-5 py-[60px] md:py-20"
                    : "auth-root min-h-screen flex justify-center items-center overflow-x-hidden relative p-6 bg-[#f7f7f8] bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(198,255,61,0.12)_0%,transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_100%,rgba(10,10,15,0.04)_0%,transparent_50%)]"
            }
        >
            <div className="relative z-10 w-full flex justify-center">{children}</div>
        </div>
    );
}
