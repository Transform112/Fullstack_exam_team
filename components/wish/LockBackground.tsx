"use client";

// Shared cinematic background for the locked states. It only knows the recipient's
// first name, never the page language or template (docs/04 5.1).
import { useEffect, useState } from "react";
import { seededRandom } from "@/lib/text";

export function LockBackground({ firstName }: { firstName: string }) {
  // Rendered after mount so the seeded positions match on the server and the client.
  const [dots, setDots] = useState<
    { left: number; top: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const rand = seededRandom(firstName || "wishly");
    setDots(
      Array.from({ length: 18 }, () => ({
        left: Math.round(rand() * 96) + 2,
        top: Math.round(rand() * 92) + 2,
        size: rand() > 0.6 ? 5 : 4,
        duration: 3 + rand() * 3,
        delay: rand() * 4,
      })),
    );
  }, [firstName]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#0F0A1E",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#7C3AED",
          filter: "blur(80px)",
          opacity: 0.55,
          animation: "wish-drift 18s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-60px",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "#EC4899",
          filter: "blur(80px)",
          opacity: 0.5,
          animation: "wish-drift 22s ease-in-out infinite",
          animationDelay: "1.5s",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "45%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "#4F46E5",
          filter: "blur(80px)",
          opacity: 0.45,
          animation: "wish-drift 26s ease-in-out infinite",
          animationDelay: "3s",
        }}
      />
      {dots.map((dot, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            background: "#FFFFFF",
            opacity: 0.6,
            animation: `wish-twinkle ${dot.duration}s ease-in-out infinite`,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
