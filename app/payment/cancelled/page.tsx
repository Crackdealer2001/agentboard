"use client";

export default function PaymentCancelledPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1 style={{
          fontSize: 36, fontWeight: 800, color: "#fff",
          letterSpacing: "-0.03em", margin: "0 0 14px",
        }}>
          Payment cancelled
        </h1>
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.65,
        }}>
          No charge was made. You can subscribe whenever you&apos;re ready.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <a href="/payment" style={{
            display: "inline-block",
            background: "#c8f135",
            color: "#000",
            padding: "16px 40px",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textDecoration: "none",
          }}>
            Try again →
          </a>
          <a href="/" style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
            fontWeight: 500,
          }}>
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
