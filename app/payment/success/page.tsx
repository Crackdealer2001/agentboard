"use client";

export default function PaymentSuccessPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(0, 0) rotate(0deg);   opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(720deg); opacity: 0; }
        }
        .confetti-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          top: 50%;
          left: 50%;
          animation: confetti-fall 1.4s ease-out forwards;
        }
      `}</style>

      {/* Confetti dots */}
      {CONFETTI.map((c, i) => (
        <div
          key={i}
          className="confetti-dot"
          style={{
            background: c.color,
            animationDelay: `${c.delay}s`,
            // @ts-expect-error CSS custom properties
            "--tx": c.tx,
            "--ty": c.ty,
          }}
        />
      ))}

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Checkmark */}
        <div style={{ marginBottom: 32 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#c8f135" />
            <path d="M18 32l10 10 18-18" stroke="#000" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 40, fontWeight: 800, color: "#fff",
          letterSpacing: "-0.03em", margin: "0 0 14px",
        }}>
          You&apos;re all set!
        </h1>
        <p style={{
          fontSize: 16, color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.6,
        }}>
          Your subscription is active. Welcome to Scope Pro.
        </p>

        <a href="/dashboard" style={{
          display: "inline-block",
          background: "#fff",
          color: "#000",
          padding: "16px 40px",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textDecoration: "none",
        }}>
          Go to dashboard →
        </a>
      </div>
    </div>
  );
}

const CONFETTI = [
  { color: "#c8f135", tx: "-120px", ty: "-180px", delay: 0 },
  { color: "#fff",    tx: "140px",  ty: "-160px", delay: 0.05 },
  { color: "#c8f135", tx: "80px",   ty: "-220px", delay: 0.1 },
  { color: "#6ee7b7", tx: "-180px", ty: "-100px", delay: 0.08 },
  { color: "#fff",    tx: "200px",  ty: "-80px",  delay: 0.15 },
  { color: "#c8f135", tx: "-60px",  ty: "-240px", delay: 0.12 },
  { color: "#fbbf24", tx: "160px",  ty: "-200px", delay: 0.03 },
  { color: "#6ee7b7", tx: "-200px", ty: "-60px",  delay: 0.18 },
  { color: "#fbbf24", tx: "100px",  ty: "160px",  delay: 0.07 },
  { color: "#fff",    tx: "-100px", ty: "180px",  delay: 0.13 },
  { color: "#c8f135", tx: "180px",  ty: "120px",  delay: 0.06 },
  { color: "#6ee7b7", tx: "-140px", ty: "140px",  delay: 0.2 },
  { color: "#fbbf24", tx: "60px",   ty: "200px",  delay: 0.09 },
  { color: "#fff",    tx: "-80px",  ty: "220px",  delay: 0.16 },
  { color: "#c8f135", tx: "220px",  ty: "60px",   delay: 0.04 },
  { color: "#fbbf24", tx: "-220px", ty: "80px",   delay: 0.11 },
];
