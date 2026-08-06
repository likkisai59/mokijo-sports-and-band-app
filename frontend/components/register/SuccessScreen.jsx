import AuthSuccess from "@/components/auth/AuthSuccess";

/**
 * Role-specific post-registration success screen.
 * @param {"admin"|"user"|"trainer"|"venue"|string} role
 */
export default function SuccessScreen({ role }) {
    const isCustomRole = role && !["admin", "user", "trainer", "venue"].includes(role);

    if (role === "admin") {
        return (
            <AuthSuccess
                title="Club Registered"
                message="Your club has been registered successfully. You can now sign in to access your admin dashboard."
                ctaHref="/login?registered=true"
                ctaLabel="Go to Admin Login"
            />
        );
    }

    if (role === "user") {
        return (
            <AuthSuccess
                title="Account Created"
                message="Your user account was created successfully. You can now sign in."
                ctaHref="/login-user?registered=true"
                ctaLabel="Go to User Login"
            />
        );
    }

    if (role === "trainer") {
        return (
            <AuthSuccess
                title="Trainer Account Created"
                message="Your trainer account has been created. You can now sign in and start creating trainings."
                ctaHref="/login-trainer?registered=true"
                ctaLabel="Go to Trainer Login"
            />
        );
    }

    if (role === "venue") {
        return (
            <AuthSuccess
                title="Venue Registered"
                message="Your venue owner account is ready. Sign in to manage your venues."
                ctaHref="/login-venue?registered=true"
                ctaLabel="Go to Venue Login"
            />
        );
    }

    return (
        <AuthSuccess
            title="Application Submitted"
            message={
                isCustomRole
                    ? `Club admin has to approve your application as a ${role}. You can log in only after the admin accepts it.`
                    : "Your application was submitted successfully."
            }
            ctaHref="/"
            ctaLabel="Back to Home"
        />
    );
}
