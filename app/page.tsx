export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: "var(--text)" }}>Scope</span>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/dashboard" style={{ padding: "8px 18px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Dashboard</a>
          <a href="/auth" style={{ padding: "8px 18px", background: "var(--accent)", color: "var(--accent-text)", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "var(--bg3)", borderRadius: 100, padding: "6px 16px", fontSize: 13, color: "var(--text3)", marginBottom: 32, fontWeight: 500 }}>
          Built for freelancers & agencies
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 24px" }}>
          Turn client briefs into<br />airtight proposals
        </h1>
        <p style={{ fontSize: 20, color: "var(--text3)", lineHeight: 1.6, margin: "0 0 48px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Paste any client enquiry. Get a structured scope, risk analysis, and ready-to-send proposal in minutes.
        </p>
        <a href="/auth" style={{ display: "inline-block", background: "var(--accent)", color: "var(--accent-text)", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Start for free →
        </a>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Paste the enquiry", desc: "Drop in the email, message, or brief exactly as received. No formatting needed." },
            { step: "02", title: "Clarify and scope", desc: "AI extracts goals, flags risks, and asks the right clarifying questions to fill the gaps." },
            { step: "03", title: "Export the proposal", desc: "Get a structured scope of work, deliverables, timeline, and contract-ready proposal." },
          ].map((item) => (
            <div key={item.step} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "32px 28px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text4)", marginBottom: 12, letterSpacing: "0.05em" }}>{item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>{item.title}</h3>
              <p style={{ fontSize: 15, color: "var(--text3)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontWeight: 700, color: "var(--text)" }}>Scope</span>
        <span style={{ fontSize: 13, color: "var(--text4)" }}>© 2025 Scope. All rights reserved.</span>
      </footer>
    </div>
  );
}
