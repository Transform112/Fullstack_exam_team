"use client";

// Password gate for PASSWORD pages (docs/04 5.1). Submitting calls EP-19 and the server
// sets the short-lived view cookie.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/client-api";
import { translate } from "@/lib/i18n";
import { LockBackground } from "./LockBackground";

export function PasswordGate({ slug, firstName }: { slug: string; firstName: string }) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await api(`/public/pages/${slug}/unlock`, { method: "POST", body: { password } });
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setError(translate("ENGLISH", "lock.password.wrong"));
        setPassword("");
        setShake(true);
        setTimeout(() => setShake(false), 450);
      } else if (apiErr.status === 429) {
        setError(translate("ENGLISH", "lock.password.limit"));
      } else {
        toast.error(apiErr.message ?? translate("ENGLISH", "lock.password.wrong"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="wish-root"
      style={{ position: "relative", minHeight: "100svh", background: "#0F0A1E" }}
    >
      <LockBackground firstName={firstName} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
        }}
      >
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.3 : 0.6 }}
          className={shake ? "wish-shake" : undefined}
          style={{
            width: "100%",
            maxWidth: 380,
            padding: 28,
            borderRadius: 20,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700 }}>{firstName}</p>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "12px auto 16px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <Lock size={24} aria-hidden />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 20 }}>
            {translate("ENGLISH", "lock.password.title")}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
            {translate("ENGLISH", "lock.password.hint")}
          </p>

          <form onSubmit={submit}>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label={translate("ENGLISH", "lock.password.input")}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(0,0,0,0.25)",
                color: "#FFFFFF",
                padding: "0 14px",
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              disabled={pending || password.length === 0}
              style={{
                width: "100%",
                height: 48,
                marginTop: 14,
                borderRadius: 9999,
                border: "none",
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 600,
                opacity: pending || password.length === 0 ? 0.6 : 1,
                cursor: pending ? "wait" : "pointer",
              }}
            >
              {pending ? "..." : translate("ENGLISH", "lock.password.button")}
            </button>
          </form>

          {error ? (
            <p style={{ margin: "12px 0 0", color: "#FCA5A5", fontSize: 14 }} role="alert">
              {error}
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
