import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { SignupForm } from "./SignupForm";

// Server wrapper: a visitor who is already logged in never sees the form again.
export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-canvas px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2" aria-label="Wishly home">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
          <Heart className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
        </span>
        <span className="font-heading text-xl font-bold text-ink">Wishly</span>
      </Link>

      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-ink">Create your account</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          It takes a minute and your first surprise is free.
        </p>
        <SignupForm />
      </Card>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
