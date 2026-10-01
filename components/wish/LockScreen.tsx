"use client";

// Countdown lock screen for SCHEDULED pages (docs/04 5.1). The client clock only drives
// the display: the server decides when the page really unlocks.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Gift } from "lucide-react";
import { translate } from "@/lib/i18n";
import { rise } from "@/lib/motion";
import { LockBackground } from "./LockBackground";
import { FlipUnit } from "./FlipUnit";

type Parts = { days: string; hours: string; minutes: string; seconds: string };

function partsUntil(target: number): Parts {
  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function LockScreen({
  firstName,
  revealAt,
}: {
  firstName: string;
  revealAt: string | null;
}) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const target = revealAt ? new Date(revealAt).getTime() : 0;
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<Parts>({
    days: "--",
    hours: "--",
    minutes: "--",
    seconds: "--",
  });
  const [dateLabel, setDateLabel] = useState("--");

  useEffect(() => {
    setMounted(true);
    setParts(partsUntil(target));
    if (revealAt) {
      setDateLabel(
        new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(
          new Date(revealAt),
        ),
      );
    }
  }, [target, revealAt]);

  // Ticks every second, then asks the server to re-render once the time has come.
  useEffect(() => {
    if (!mounted) return;
    const tick = setInterval(() => {
      setParts(partsUntil(target));
      if (target - Date.now() <= 0) router.refresh();
    }, 1000);
    return () => clearInterval(tick);
  }, [mounted, target, router]);

  const units: { key: keyof Parts; label: string }[] = [
    { key: "days", label: translate("ENGLISH", "lock.days") },
    { key: "hours", label: translate("ENGLISH", "lock.hours") },
    { key: "minutes", label: translate("ENGLISH", "lock.minutes") },
    { key: "seconds", label: translate("ENGLISH", "lock.seconds") },
  ];

  return (
    <div
      className="wish-root"
      style={{ position: "relative", minHeight: "100svh", background: "#352c32" }}
    >
      <LockBackground firstName={firstName} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "48px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "#70566f",
            animation: "wish-pulse 2.4s ease-in-out infinite",
          }}
        >
          <Gift size={34} color="#FFFFFF" aria-hidden />
        </div>

        <motion.h1
          {...rise(reduced)}
          style={{
            margin: 0,
            maxWidth: 560,
            fontFamily: "var(--font-poppins), system-ui, sans-serif",
            fontSize: "clamp(24px, 6vw, 40px)",
            lineHeight: 1.3,
            color: "#FFFFFF",
          }}
        >
          {translate("ENGLISH", "lock.teaser", { name: firstName })}
        </motion.h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {units.map((unit) => (
            <div
              key={unit.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 64,
                  height: 80,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  position: "relative",
                }}
                className="md:h-[104px] md:w-[84px] md:text-[48px]"
              >
                <FlipUnit value={parts[unit.key]} reduced={reduced} />
              </div>
              <span style={{ fontSize: 12, letterSpacing: 1, color: "rgba(255,255,255,0.6)" }}>
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
          {translate("ENGLISH", "lock.opens", { date: dateLabel })}
        </p>
      </div>
    </div>
  );
}
