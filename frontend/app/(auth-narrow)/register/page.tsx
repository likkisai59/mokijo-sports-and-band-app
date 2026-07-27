"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "@/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import toast from "react-hot-toast";
import * as React from "react";
import { Loader2 } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const roleParam = searchParams.get("role") || "client";
  const defaultRole = ["client", "artist", "venue_owner"].includes(roleParam) ? roleParam : "client";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", role_name: defaultRole as any, password: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    if (roleParam && ["client", "artist", "venue_owner"].includes(roleParam)) {
      setValue("role_name", roleParam as any);
    }
  }, [roleParam, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword: _cp, ...payload } = data;
      const response = await api.post("/auth/register", payload);
      const { success, message, email_sent } = response.data;
      if (success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("registration_email", String(data.email));
        }
        if (email_sent === false) {
          toast.success("Account Created (Verification email failed to send)");
          router.push("/verify-email?email_sent=false");
        } else {
          toast.success(message || "Account registered successfully! Verification email sent.");
          router.push("/verify-email?email_sent=true");
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = error.response?.data?.error?.message || "Registration failed. Please try again.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">Create an account</h1>
        <p className="text-sm text-text-secondary">
          Enter your details below to create your platform profile
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <Label htmlFor="name">Full Name / Band Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={errors.name ? "border-error focus-visible:border-error focus-visible:ring-error" : ""}
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-error font-medium mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={errors.email ? "border-error focus-visible:border-error focus-visible:ring-error" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-error font-medium mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="role_name">Account Type</Label>
          <Controller
            control={control}
            name="role_name"
            render={({ field }) => (
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                }}
                value={field.value}
              >
                <SelectTrigger id="role_name" className="w-full">
                  <SelectValue placeholder="Select account role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client (Event Host)</SelectItem>
                  <SelectItem value="artist">Artist / Music Band</SelectItem>
                  <SelectItem value="venue_owner">Venue Owner</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.role_name && (
            <p id="role_name-error" className="text-xs text-error font-medium mt-1">{errors.role_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Min 8 chars, uppercase, number, symbol"
            disabled={isSubmitting}
            error={!!errors.password}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-error font-medium mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter your password"
            disabled={isSubmitting}
            error={!!errors.confirmPassword}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-xs text-error font-medium mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          id="register-submit-btn"
          className="w-full font-bold h-10 mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
          ) : (
            "Sign Up"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Log in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <RegisterContent />
    </React.Suspense>
  );
}
