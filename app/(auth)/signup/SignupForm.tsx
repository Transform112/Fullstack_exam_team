"use client";

// Signup form (docs/03 P1-02): react-hook-form with zodResolver using registerSchema,
// inline field errors, a loading submit button and persistent feedback on API failure.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ApiError, api } from "@/lib/client-api";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupValues = z.infer<typeof registerSchema>;

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Creates the account, then moves the visitor to their dashboard.
  const onSubmit = async (values: SignupValues) => {
    setServerError(null);
    try {
      await api("/auth/register", { method: "POST", body: values });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create your account. Please try again.",
      );
    }
  };

  return (
    <form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {serverError && <p role="alert" className="auth-error-notice">{serverError}</p>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-name">Your name</Label>
        <Input
          id="signup-name"
          autoComplete="name"
          placeholder="Riya Sharma"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="signup-name-error" role="alert" className="text-sm text-red-600">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="signup-email-error" role="alert" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="pr-12"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "signup-password-error" : "signup-password-hint"}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? (
          <p id="signup-password-error" role="alert" className="text-sm text-red-600">
            {errors.password.message}
          </p>
        ) : (
          <p id="signup-password-hint" className="text-xs text-muted">
            At least 8 characters, with one letter and one number.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Creating your account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
