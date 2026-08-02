export default function AuthErrorBanner({ children, variant = "light" }) {
    if (!children) return null;
    if (variant === "dark") {
        return (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] px-[14px] py-2.5 rounded-[10px] text-[13px] mb-4">
                {children}
            </div>
        );
    }
    return (
        <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-center">
            {children}
        </div>
    );
}
