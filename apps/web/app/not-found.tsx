import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 460, width: "100%" }}>
        <div className="card-bd" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
            Insight<span style={{ color: "var(--accent, #3b82f6)" }}>XI</span>
          </div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 20 }}>404 — page not found</div>
          <p className="dim" style={{ marginBottom: 20 }}>
            We couldn&rsquo;t find that page. The match may have kicked off elsewhere.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Back to the dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
