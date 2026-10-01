import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "@/components/app/AuthShell";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <AuthShell signup>
      <h1>Let’s make their day.</h1>
      <p>Create your account and turn a few favourite memories into something special.</p>
      <SignupForm />
    </AuthShell>
  );
}
