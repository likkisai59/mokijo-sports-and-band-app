"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await api.post("/auth/forgot-password", data);
      const { success, message } = response.data;
      if (success) {
        toast.success(message || "Password reset email dispatched successfully.");
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = error.response?.data?.error?.message || "Failed to initiate password reset.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">Reset password</h1>
        <p className="text-sm text-text-secondary">
          Enter your email to receive a password reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        <Button type="submit" className="w-full font-bold h-10 mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="text-center text-sm text-text-secondary">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Log in
        </Link>
      </div>
    </div>
  );
}
