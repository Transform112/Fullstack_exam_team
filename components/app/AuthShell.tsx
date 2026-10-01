import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Brand } from "./Brand";
import { CelebrationCard } from "./CelebrationCard";

type AuthShellProps = {
  children: ReactNode;
  signup?: boolean;
};

export function AuthShell({ children, signup = false }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <aside className="auth-story" aria-label="Wishly celebration studio">
        <Brand caption />
        <h2>A little place for<br />your biggest feelings.</h2>
        <CelebrationCard />
        <p>Thoughtfully made. Joyfully shared.</p>
      </aside>
      <section className="auth-form-side" aria-label={signup ? "Create an account" : "Log in"}>
        <div className="auth-form-content">
          <Link href="/" className="auth-home-link"><ArrowLeft size={14} aria-hidden /> Back to the studio</Link>
          <p className="eyebrow">
            {signup ? "YOUR NEXT LOVELY IDEA STARTS HERE" : "BACK TO YOUR LITTLE STUDIO"}
          </p>
          {children}
          <p className="auth-assurance">
            <LockKeyhole size={13} aria-hidden />
            <span>{signup ? "Your pages start as drafts. You choose when to share." : "Your drafts stay in your account, ready when you are."}</span>
          </p>
          <div className="auth-footer">
            {signup ? "Already have an account? " : "New to Wishly? "}
            <Link className="text-link" href={signup ? "/login" : "/signup"}>
              {signup ? "Log in" : "Create an account"}
            </Link>
          </div>
          <div className="auth-explore-links">
            <Link href="/templates">Explore the collection</Link>
            <span aria-hidden>·</span>
            <Link href="/help">A little help</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
