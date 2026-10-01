import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "@/components/app/AuthShell";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <AuthShell>
      <h1>Good to have you back.</h1>
      <p>Your memories, ideas, and almost-ready surprises are waiting.</p>
      <LoginForm />
    </AuthShell>
  );
}
