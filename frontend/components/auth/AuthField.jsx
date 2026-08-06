import {
    authFieldErrorClass,
    authFieldErrorClassDark,
    authHintClass,
    authLabelClass,
    authLabelClassDark,
} from "./auth-classes";

export default function AuthField({
    label,
    htmlFor,
    required = false,
    error,
    children,
    hint,
    labelRight,
    variant = "light",
}) {
    const isDark = variant === "dark";
    const labelClass = isDark ? authLabelClassDark : authLabelClass;
    const errorClass = isDark ? authFieldErrorClassDark : authFieldErrorClass;
    const hintClass = isDark ? "text-xs text-[rgba(244,244,245,0.4)] mt-1 block" : authHintClass;

    if (isDark) {
        return (
            <div className="auth-field--dark">
                {(label || labelRight) && (
                    <div className="flex justify-between items-center gap-2 mb-[6px]">
                        {label ? (
                            <label htmlFor={htmlFor} className={`${labelClass} !mb-0`}>
                                {label}
                                {required ? <span className="text-red-400"> *</span> : null}
                            </label>
                        ) : (
                            <span />
                        )}
                        {labelRight}
                    </div>
                )}
                {children}
                {error ? <span className={errorClass}>{error}</span> : null}
                {!error && hint ? <span className={hintClass}>{hint}</span> : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 w-full max-w-[380px] mx-auto text-left">
            {(label || labelRight) && (
                <div className="flex justify-between items-center gap-2 w-full text-left">
                    {label ? (
                        <label htmlFor={htmlFor} className={`${labelClass} text-left w-full block`}>
                            {label}
                            {required ? <span className="text-red-600"> *</span> : null}
                        </label>
                    ) : (
                        <span />
                    )}
                    {labelRight}
                </div>
            )}
            {children}
            {error ? <span className={`${errorClass} text-left w-full block`}>{error}</span> : null}
            {!error && hint ? <span className={`${hintClass} text-left w-full block`}>{hint}</span> : null}
        </div>
    );
}
