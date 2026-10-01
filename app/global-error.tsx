"use client";

// Last-resort error boundary (docs/03 P4-14). It replaces the root layout, so it
// carries its own <html>/<body> and inline styles instead of Tailwind classes.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FAF7FF", color: "#0F0A1E" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "24px",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          <span
            aria-hidden
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            }}
          />
          <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "8px 0 0" }}>
            Wishly hit an unexpected error
          </h1>
          <p
            style={{
              maxWidth: "420px",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#6B6480",
              margin: 0,
            }}
          >
            Nothing you did caused this. Reload the page and it should come back.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "12px",
              minHeight: "48px",
              padding: "0 28px",
              border: "none",
              borderRadius: "9999px",
              background: "#7C3AED",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
