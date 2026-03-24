"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function DevPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notSignedIn, setNotSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) {
        setNotSignedIn(true);
        setChecking(false);
        return;
      }
      // Already a developer? Redirect to dashboard.
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_developer")
        .eq("id", u.id)
        .single();
      if (profile?.is_developer) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/dev/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Incorrect password");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (checking) return null;

  if (notSignedIn) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>DEVELOPER ACCESS</p>
          <h1 style={headingStyle}>Developer Portal</h1>
          <p style={subtitleStyle}>You need to be signed in to access the developer portal.</p>
          <a
            href="/auth?redirect=/dev"
            style={{
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
              textDecoration: "none",
              textAlign: "center",
              lineHeight: "52px",
              boxSizing: "border-box",
            }}
          >
            Sign in first →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <a href="/" style={backLinkStyle}>← Back to home</a>
      <div style={cardStyle}>
        <p style={labelStyle}>DEVELOPER ACCESS</p>
        <h1 style={headingStyle}>Developer Portal</h1>
        <p style={subtitleStyle}>Enter the developer password to access the full app</p>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="password"
            placeholder="Enter developer password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          {error && (
            <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              background: loading ? "#9ab52a" : "#c8f135",
              color: "#000",
              border: "none",
              height: 52,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 12,
            }}
          >
            {loading ? "Verifying..." : "Enter developer mode →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DevPage() {
  return (
    <Suspense>
      <DevPageInner />
    </Suspense>
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
  gap: 0,
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
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
