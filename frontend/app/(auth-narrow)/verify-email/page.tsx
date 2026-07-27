"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, CheckCircle, AlertTriangle, Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { getRoleDashboard } from "@/utils/role-routes";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";


function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  // States: A (verifying), B (success), C (already_verified), D (expired), E (invalid), F (resend_success), G (resend_failure / idle / error)
  const [status, setStatus] = React.useState<
    "idle" | "verifying" | "success" | "already_verified" | "expired" | "invalid" | "resend_success"
  >("idle");

  const [errorMsg, setErrorMsg] = React.useState("");
  const [emailInput, setEmailInput] = React.useState("");
  const [emailFromStorage, setEmailFromStorage] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState<number>(0);
  const [resending, setResending] = React.useState<boolean>(false);
  
  // Authenticated state check
  const [authRole, setAuthRole] = React.useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = React.useState<boolean>(false);

  // 1. Fetch user session to determine if they are already logged in and resolve role dashboard
  React.useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data?.success && response.data?.data) {
          const user = response.data.data;
          const roleName = user.roles?.[0]?.name || "client";
          setAuthRole(roleName);
          setIsSessionValid(true);
        }
      } catch (_err) {
        // Not authenticated, ignore
        setAuthRole(null);
        setIsSessionValid(false);
      }
    };
    checkAuthSession();
  }, []);

  // 2. Load email from session storage if exists
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("registration_email");
      setEmailFromStorage(storedEmail);
      if (storedEmail) {
        setEmailInput(storedEmail);
      }
    }
  }, []);

  // 3. Process verification if token is present
  React.useEffect(() => {
    if (!token) return;

    const performVerification = async () => {
      setStatus("verifying");
      try {
        const response = await api.post("/auth/verify-email", { token });
        const { success, data, message } = response.data;
        if (success) {
          // Check if already verified flag is set from backend payload
          if (data?.already_verified) {
            setStatus("already_verified");
            toast.success(message || "Email is already verified.");
            if (data?.role) {
              setAuthRole(data.role);
            }
          } else {
            setStatus("success");
            const role = data?.role || "client";
            setAuthRole(role);

            // First-time verification: Auto Login
            if (data?.access_token && data?.user) {
              useAuthStore.getState().setAuth(data.user, data.access_token);
              toast.success("Email verified! Redirecting to dashboard...");
              const targetDashboard = getRoleDashboard(role);
              setTimeout(() => {
                router.replace(targetDashboard);
              }, 1200);
            } else {
              toast.success(message || "Email verified successfully!");
            }
          }
        }
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || "";
        const code = err.response?.data?.error?.code || "";
        setErrorMsg(msg || "Verification failed. The token is invalid or has expired.");

        if (msg.toLowerCase().includes("expired") || code.includes("EXPIRED")) {
          setStatus("expired");
        } else if (msg.toLowerCase().includes("already verified") || code.includes("ALREADY_VERIFIED")) {
          setStatus("already_verified");
        } else {
          setStatus("invalid");
        }
      }
    };

    performVerification();
  }, [token, router]);

  // 4. Cooldown timer for email resends
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 5. Handles verification email resend
  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResending(true);
    try {
      const response = await api.post("/auth/resend-verification", { email: emailInput });
      const { success, message } = response.data;
      if (success) {
        setStatus("resend_success");
        toast.success(message || "Verification email sent successfully!");
        setResendCooldown(60);
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error("Network failure. Please check your internet connection.");
        return;
      }
      if (err.response.status >= 500) {
        toast.error("Server failure. Please try again later.");
        return;
      }
      const errData = err.response?.data?.error;
      const msg = errData?.message || "";
      const code = errData?.code || "";

      // Truthful error mapping (STATE G)
      if (msg.toLowerCase().includes("already verified") || code === "RESOURCE_CONFLICT") {
        toast.error("This email is already verified. Please proceed to log in.");
        setStatus("already_verified");
      } else if (msg.toLowerCase().includes("cooldown") || msg.toLowerCase().includes("wait")) {
        // Extract wait seconds if present, or default to 60
        const match = msg.match(/\d+/);
        const seconds = match ? parseInt(match[0], 10) : 60;
        setResendCooldown(seconds);
        toast.error(msg || `Please wait before requesting another email.`);
      } else if (msg.toLowerCase().includes("not found") || code === "RESOURCE_NOT_FOUND") {
        toast.error("This email address is not registered on BandConnect.");
      } else {
        toast.error(msg || "Failed to resend verification. Please try again later.");
      }
    } finally {
      setResending(false);
    }
  };

  const getContinueUrl = () => {
    if (isSessionValid && authRole) {
      return getRoleDashboard(authRole);
    }
    return "/login";
  };

  const getContinueLabel = () => {
    if (isSessionValid && authRole) {
      return "Go to Dashboard";
    }
    return "Continue to Login";
  };

  // Mask email for privacy
  const maskEmail = (emailStr: string | null) => {
    if (!emailStr) return "";
    const [user, domain] = emailStr.split("@");
    if (user.length <= 2) return `***@${domain}`;
    return `${user[0]}${"*".repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
  };

  // Render Page States
  // ─── STATE A: VERIFYING ───
  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-14 w-14 text-primary animate-spin" />
          <Mail className="absolute h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">Verifying Email</h1>
          <p className="text-sm text-text-secondary max-w-sm">
            Please wait while we verify your email token with the server...
          </p>
        </div>
      </div>
    );
  }

  // ─── STATE B: VERIFIED SUCCESSFULLY ───
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
          <CheckCircle className="h-12 w-12 animate-scale-up" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            Email Verified Successfully
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            Your email has been successfully verified. You can now continue onto your profile portal.
          </p>
        </div>
        <div className="w-full pt-4">
          <Link href={getContinueUrl()} className="block w-full">
            <Button className="w-full font-bold h-11 text-base shadow-lg shadow-primary/20">
              {getContinueLabel()}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── STATE C: ALREADY VERIFIED ───
  if (status === "already_verified") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400">
          <CheckCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            Email Already Verified
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            Your BandConnect account is already verified.
          </p>
        </div>
        <div className="w-full pt-4">
          <Link href={getContinueUrl()} className="block w-full">
            <Button className="w-full font-bold h-11 text-base">
              {getContinueLabel()}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── STATE D: EXPIRED TOKEN ───
  // ─── STATE D: EXPIRED TOKEN ───
  if (status === "expired") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            Verification Link Expired
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            {errorMsg || "This verification link is no longer valid."} Please enter your email below to request a new verification link.
          </p>
        </div>

        <form onSubmit={handleResend} className="w-full space-y-4 pt-2 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="resend-email-expired">Email Address</Label>
            <Input
              id="resend-email-expired"
              type="email"
              placeholder="name@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={resending || resendCooldown > 0}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full font-bold h-11"
            disabled={resending || resendCooldown > 0}
          >
            {resending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
            ) : resendCooldown > 0 ? (
              `Resend Email (${resendCooldown}s)`
            ) : (
              "Resend Verification Link"
            )}
          </Button>
        </form>

        <div className="w-full border-t border-border/50 pt-4 flex items-center justify-center">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ─── STATE E: INVALID TOKEN ───
  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full text-red-400">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            Invalid Verification Link
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            {errorMsg || "This verification link is invalid or has been tampered with."} If you need a new link, enter your email below.
          </p>
        </div>


        <form onSubmit={handleResend} className="w-full space-y-4 pt-2 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="resend-email-invalid">Email Address</Label>
            <Input
              id="resend-email-invalid"
              type="email"
              placeholder="name@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={resending || resendCooldown > 0}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full font-bold h-11"
            disabled={resending || resendCooldown > 0}
          >
            {resending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
            ) : resendCooldown > 0 ? (
              `Resend Email (${resendCooldown}s)`
            ) : (
              "Send New Verification Link"
            )}
          </Button>
        </form>

        <div className="w-full border-t border-border/50 pt-4 flex items-center justify-center">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ─── STATE F: RESEND SUCCESS ───
  if (status === "resend_success") {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-full text-primary">
          <Send className="h-12 w-12 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
            Verification Email Sent
          </h1>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            We have sent a new verification link to your registered email address. Please check your inbox.
          </p>
        </div>
        <div className="w-full pt-4">
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full font-bold h-11">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── DEFAULT STATE: PENDING EMAIL LINK (Idle / Registration Redirect) ───
  const emailSentParam = searchParams.get("email_sent");
  const isEmailSentFailed = emailSentParam === "false";

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
      <div className={`p-4 rounded-full border ${
        isEmailSentFailed 
          ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
          : "bg-primary/10 border-primary/20 text-primary"
      }`}>
        {isEmailSentFailed ? (
          <AlertTriangle className="h-12 w-12" />
        ) : (
          <Mail className="h-12 w-12 animate-bounce-slow" />
        )}
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
          {isEmailSentFailed ? "Account Created" : "Verify your email"}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
          {isEmailSentFailed 
            ? "Your BandConnect account was created successfully, but we could not send the verification email." 
            : "We have sent a verification link to your email address:"}
        </p>
        {emailFromStorage && (
          <p className="text-sm font-semibold text-text-primary bg-bg-elevated px-3 py-1.5 rounded-lg border border-border inline-block">
            {maskEmail(emailFromStorage)}
          </p>
        )}
        <p className="text-xs text-text-muted max-w-sm pt-1">
          {isEmailSentFailed 
            ? "Please click below to request/resend the email verification link to activate your account." 
            : "Please check your inbox and click the verification URL link to activate your account."}
        </p>
      </div>

      <form onSubmit={handleResend} className="w-full space-y-3 pt-2 text-left">
        {!emailFromStorage && (
          <div className="space-y-1.5">
            <Label htmlFor="resend-email-idle">Email Address</Label>
            <Input
              id="resend-email-idle"
              type="email"
              placeholder="name@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={resending || resendCooldown > 0}
              required
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full font-bold h-11"
          disabled={resending || resendCooldown > 0}
        >
          {resending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
          ) : resendCooldown > 0 ? (
            `Resend Email (${resendCooldown}s)`
          ) : (
            "Resend Verification Email"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium"
          onClick={() => router.push("/login")}
        >
          Check Verification Status (Log In)
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs pt-4 border-t border-border/50 w-full">
        <Link href="/register" className="text-primary hover:underline flex items-center gap-1 font-semibold">
          <ArrowLeft className="h-3 w-3" />
          <span>Change email / Register again</span>
        </Link>
        <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
          Back to Home
        </Link>
      </div>


    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </React.Suspense>
  );
}

