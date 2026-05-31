"use client";

import { useEffect } from "react";

/** Global error boundary for the App Router. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics (forwarded to the error reporter if set).
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 460, width: "100%" }}>
        <div className="card-bd" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
            Insight<span style={{ color: "var(--accent, #3b82f6)" }}>XI</span>
          </div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 20 }}>
            Something went wrong
          </div>
          <p className="dim" style={{ marginBottom: 20 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
