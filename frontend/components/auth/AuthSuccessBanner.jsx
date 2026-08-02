export default function AuthSuccessBanner({ children, title = "Registration successful!", variant = "light" }) {
    if (!children && !title) return null;
    if (variant === "dark") {
        return (
            <div className="bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#6ee7b7] px-[14px] py-3 rounded-[10px] text-[13px] text-center mb-4">
                {title ? <strong className="block mb-1 text-[#a7f3d0]">{title}</strong> : null}
                {children}
            </div>
        );
    }
    return (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl text-sm text-center">
            {title ? <strong className="block mb-1 text-emerald-900">{title}</strong> : null}
            {children}
        </div>
    );
}
