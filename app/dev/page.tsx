"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const DEV_ACCOUNTS = [
  { label: "Developer 1", email: "dev1@scopeapp.internal", password: "ScopeDevAlpha#2024" },
  { label: "Developer 2", email: "dev2@scopeapp.internal", password: "ScopeDevBeta#2024" },
  { label: "Developer 3", email: "dev3@scopeapp.internal", password: "ScopeDevGamma#2024" },
  { label: "Developer 4", email: "dev4@scopeapp.internal", password: "ScopeDevDelta#2024" },
  { label: "Developer 5", email: "dev5@scopeapp.internal", password: "ScopeDevEpsilon#2024" },
];

export default function DevPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [signingIn, setSigningIn] = useState<number | null>(null);
  const [signInError, setSignInError] = useState("");

  function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== "VitaminC2014") {
      setError("Incorrect password");
      return;
    }
    setStep(2);
  }

  async function handleSelectAccount(index: number) {
    setSigningIn(index);
    setSignInError("");
    const account = DEV_ACCOUNTS[index];
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    if (authError) {
      setSignInError(authError.message);
      setSigningIn(null);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div style={containerStyle}>
      <a href="/" style={backLinkStyle}>← Back to home</a>

      {step === 1 ? (
        <div style={cardStyle}>
          <p style={labelStyle}>DEVELOPER ACCESS</p>
          <h1 style={headingStyle}>Developer Portal</h1>
          <p style={subtitleStyle}>Enter the developer password to continue</p>

          <form onSubmit={handlePassword} style={{ width: "100%" }}>
            <input
              type="password"
              placeholder="Enter developer password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={inputStyle}
              className="dev-input"
              autoFocus
            />
            {error && (
              <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>
                {error}
              </p>
            )}
            <button type="submit" style={buttonStyle}>
              Continue →
            </button>
          </form>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={labelStyle}>DEVELOPER ACCESS</p>
          <h1 style={headingStyle}>Choose your developer account</h1>
          <p style={subtitleStyle}>Each session uses a separate developer account</p>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            {DEV_ACCOUNTS.map((account, i) => (
              <button
                key={account.email}
                onClick={() => handleSelectAccount(i)}
                disabled={signingIn !== null}
                style={{
                  background: signingIn === i ? "#111" : "#0a0a0a",
                  border: "1px solid #2a2a2a",
                  padding: "16px 20px",
                  cursor: signingIn !== null ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  opacity: signingIn !== null && signingIn !== i ? 0.4 : 1,
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                  {signingIn === i ? "Signing in..." : account.label}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                  {account.email}
                </span>
              </button>
            ))}
          </div>

          {signInError && (
            <p style={{ color: "#f44336", fontSize: 13, margin: "16px 0 0", fontWeight: 500 }}>
              {signInError}
            </p>
          )}

          <button
            onClick={() => { setStep(1); setSignInError(""); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", marginTop: 20, padding: 0 }}
          >
            ← Back
          </button>
        </div>
      )}

      <style>{`.dev-input:focus { border-color: #c8f135 !important; outline: none; }`}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  position: "relative",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const backLinkStyle: React.CSSProperties = {
  position: "absolute",
  top: 28,
  left: 32,
  fontSize: 13,
  color: "rgba(255,255,255,0.35)",
  textDecoration: "none",
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#c8f135",
  margin: "0 0 20px",
};

const headingStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: "#fff",
  margin: "0 0 10px",
  letterSpacing: "-0.03em",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(255,255,255,0.4)",
  margin: "0 0 32px",
  lineHeight: 1.6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#000",
  border: "1px solid #2a2a2a",
  color: "#fff",
  padding: "14px 16px",
  fontSize: 14,
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#c8f135",
  color: "#000",
  border: "none",
  height: 52,
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  marginTop: 12,
  textDecoration: "none",
  lineHeight: "52px",
  textAlign: "center",
  boxSizing: "border-box",
};
