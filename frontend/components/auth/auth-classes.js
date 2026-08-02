/** Shared class strings for light (registers) and dark Band-matched (logins) auth forms. */

export const authInputClass =
    "w-full h-11 bg-white border border-[rgba(10,10,15,0.12)] rounded-xl px-4 text-sm text-[#0a0a0f] placeholder:text-[#5c5c66]/55 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:ring-2 focus:ring-[rgba(198,255,61,0.35)]";

export const authSelectClass =
    "w-full h-11 bg-white border border-[rgba(10,10,15,0.12)] rounded-xl px-4 text-sm text-[#0a0a0f] focus:outline-none focus:border-[#c6ff3d] focus:ring-2 focus:ring-[rgba(198,255,61,0.35)]";

export const authLabelClass = "text-[13px] font-medium text-[#0a0a0f]";

export const authPrimaryBtnClass =
    "w-full h-11 bg-[#c6ff3d] text-[#0a0a0f] font-semibold text-sm px-6 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] disabled:opacity-50 disabled:cursor-not-allowed";

export const authSecondaryBtnClass =
    "w-full h-11 bg-white border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] font-semibold text-sm px-6 rounded-xl transition-all duration-200 hover:border-[rgba(10,10,15,0.2)] hover:bg-[#f7f7f8] disabled:opacity-50 disabled:cursor-not-allowed";

export const authLinkClass =
    "font-semibold text-[#0a0a0f] hover:text-[#5c5c66] transition-colors underline-offset-2 hover:underline";

export const authAccentLinkClass =
    "font-semibold text-[#0a0a0f] hover:text-[#5c5c66] transition-colors";

export const authBackLinkClass =
    "text-[13px] font-medium text-[#5c5c66] hover:text-[#0a0a0f] transition-colors w-fit no-underline";

export const authFieldErrorClass = "text-red-600 text-xs mt-1 block";

export const authHintClass = "text-xs text-[#5c5c66] mt-1 block";

export const authMutedTextClass = "text-sm text-[#5c5c66]";

/* Dark / Band-matched — CSS classes mirror .band-field* / .band-btn* sizing */
export const authInputClassDark = "auth-input--dark";

export const authSelectClassDark = "auth-input--dark";

export const authLabelClassDark = "auth-field__label";

export const authPrimaryBtnClassDark = "auth-btn--primary-dark";

export const authSecondaryBtnClassDark = "auth-btn--secondary-dark";

export const authAccentLinkClassDark =
    "text-[13px] font-semibold text-[#d9ff6e] no-underline hover:underline";

export const authBackLinkClassDark = "auth-back--dark";

export const authMutedTextClassDark = "text-[13px] text-[rgba(244,244,245,0.5)]";

export const authFieldErrorClassDark = "text-[#fca5a5] text-xs mt-1 block";

export const authCheckListClassDark = "auth-check-list--dark";

export const authHeadingClassDark = "text-xl font-semibold text-[#f4f4f5] tracking-tight";

export const authSubtextClassDark = "text-sm text-[rgba(244,244,245,0.5)]";

export function getAuthClasses(variant = "light") {
    if (variant === "dark") {
        return {
            input: authInputClassDark,
            select: authSelectClassDark,
            label: authLabelClassDark,
            primaryBtn: authPrimaryBtnClassDark,
            secondaryBtn: authSecondaryBtnClassDark,
            accentLink: authAccentLinkClassDark,
            backLink: authBackLinkClassDark,
            mutedText: authMutedTextClassDark,
            fieldError: authFieldErrorClassDark,
            checkList: authCheckListClassDark,
            heading: authHeadingClassDark,
            subtext: authSubtextClassDark,
            footer: "auth-footer--dark",
        };
    }
    return {
        input: authInputClass,
        select: authSelectClass,
        label: authLabelClass,
        primaryBtn: authPrimaryBtnClass,
        secondaryBtn: authSecondaryBtnClass,
        accentLink: authAccentLinkClass,
        backLink: authBackLinkClass,
        mutedText: authMutedTextClass,
        fieldError: authFieldErrorClass,
        checkList:
            "max-h-[180px] overflow-y-auto border border-[rgba(10,10,15,0.12)] rounded-[10px] p-3 bg-[#f7f7f8] flex flex-col gap-2",
        heading: "text-xl font-semibold text-[#0a0a0f] tracking-tight",
        subtext: "text-sm text-[#5c5c66]",
    };
}
