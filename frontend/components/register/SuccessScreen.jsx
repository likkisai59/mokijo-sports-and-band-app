import Link from "next/link";

export default function SuccessScreen({ role }) {
    const isCustomRole = role && role !== "admin";

    return (
        <div className="flex flex-col items-center text-center p-6 bg-white/3 border border-white/8 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#c6ff3d]/10 border border-[#c6ff3d]/20 text-[#c6ff3d] flex items-center justify-center text-xl font-bold mb-4 shadow-[0_0_15px_rgba(198,255,61,0.15)]">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">Application Submitted</h2>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                {isCustomRole
                    ? `Club admin has to approve your application as a ${role}. You can log in only after the admin accepts it.`
                    : "Your club has been registered successfully. A verification link has been sent to your email. Please verify your email before logging in."}
            </p>
            <Link
                href={isCustomRole ? "/" : "/login?registered=true"}
                className="inline-block mt-6 bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-8 py-3 rounded-xl transition-all duration-200 hover:bg-[#b5eb29]"
            >
                OK
            </Link>
        </div>
    );
}
