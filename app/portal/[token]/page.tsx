"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ScopeData {
  included?: string[];
  excluded?: string[];
  deliverables?: string[];
  timeline?: { phase: string; duration: string; milestone: string }[];
  contract_clauses?: string[];
}

interface PortalData {
  portal: {
    id: string;
    status: string;
    client_name?: string;
    client_email?: string;
    message?: string;
    accepted_at?: string;
    created_at: string;
  };
  project: {
    id: string;
    title: string;
    scope: ScopeData;
    proposal: string;
    extracted_info: { project_type?: string; goals?: string[] };
    created_at: string;
  } | null;
  freelancer: {
    name: string;
    email: string | null;
  };
}

export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("portal-theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d: PortalData | null) => {
        if (!d) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("portal-theme", next ? "dark" : "light");
  };

  const theme = {
    bg: isDark ? "#000000" : "#ffffff",
    surface: isDark ? "#0d0d0d" : "#f9fafb",
    text: isDark ? "#ffffff" : "#0a0a0a",
    text2: isDark ? "#808080" : "#6b7280",
    border: isDark ? "#1f1f1f" : "#e5e7eb",
  };

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: "background 0.2s ease" }}>
        <p style={{ color: theme.text2, fontSize: 14 }}>Loading proposal...</p>
      </div>
    );
  }

  if (notFound || !data || !data.project) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: "background 0.2s ease" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: theme.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Proposal not found</p>
          <p style={{ color: theme.text2, fontSize: 14 }}>This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  async function handleAccept() {
    if (!clientName.trim()) { setAcceptError("Please enter your full name."); return; }
    if (!clientEmail.trim() || !clientEmail.includes("@")) { setAcceptError("Please enter a valid email address."); return; }
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await fetch("/api/portal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientName: clientName.trim(), clientEmail: clientEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setAcceptError(d.error || "Something went wrong."); return; }
      setAcceptedAt(d.acceptedAt);
      if (data) {
        setData({
          ...data,
          portal: {
            ...data.portal,
            status: "accepted",
            client_name: clientName.trim(),
            accepted_at: d.acceptedAt,
          },
        });
      }
    } catch {
      setAcceptError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  const { portal, project, freelancer } = data;
  const scope = project.scope || {};
  const isAccepted = portal.status === "accepted";

  const sentDate = new Date(portal.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const acceptedDateStr = (portal.accepted_at || acceptedAt)
    ? new Date(portal.accepted_at || acceptedAt!).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";

  const acceptedTimeStr = (portal.accepted_at || acceptedAt)
    ? new Date(portal.accepted_at || acceptedAt!).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <>
      <style>{`body { background: ${theme.bg} !important; transition: background 0.2s ease; }`}</style>
      <div style={{ background: theme.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: theme.text, transition: "background 0.2s ease, color 0.2s ease" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${theme.border}`, transition: "border-color 0.2s ease" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.text, letterSpacing: "-0.01em" }}>
              {freelancer.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: theme.text2, fontWeight: 500 }}>Proposal</span>
              <button
                onClick={toggleTheme}
                title="Toggle dark mode"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
              >
                {isDark ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {project.title}
            </h1>
            {portal.client_name && (
              <p style={{ fontSize: 15, color: theme.text2, margin: "0 0 6px" }}>
                Prepared for {portal.client_name}
              </p>
            )}
            <p style={{ fontSize: 14, color: theme.text2, margin: "0 0 20px" }}>Sent {sentDate}</p>

            {/* Status badge */}
            {isAccepted ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 4 }}>
                <span>✓</span> Accepted
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 4 }}>
                Awaiting your acceptance
              </span>
            )}
          </div>

          {/* Personal message */}
          {portal.message && (
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderLeft: `3px solid ${theme.text}`, padding: "20px 24px", marginBottom: 48, transition: "background 0.2s ease, border-color 0.2s ease" }}>
              <p style={{ fontSize: 14, color: theme.text2, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                {portal.message}
              </p>
            </div>
          )}

          {/* Project Summary */}
          {project.extracted_info?.goals && project.extracted_info.goals.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Project Summary
              </h2>
              <p style={{ fontSize: 15, color: theme.text2, lineHeight: 1.8, margin: 0 }}>
                This proposal outlines the scope, deliverables, timeline, and terms
                {project.extracted_info.project_type ? ` for a ${project.extracted_info.project_type} project` : ""}.
              </p>
            </section>
          )}

          {/* Proposal text */}
          {project.proposal && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Proposal
              </h2>
              <div style={{ fontSize: 15, color: theme.text2, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {project.proposal}
              </div>
            </section>
          )}

          {/* Scope of Work */}
          {(scope.included?.length || scope.excluded?.length) ? (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Scope of Work
              </h2>
              <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                {scope.included && scope.included.length > 0 && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: theme.text2, margin: "0 0 12px" }}>Included</p>
                    {scope.included.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
                        <span style={{ color: "#16a34a", flexShrink: 0, fontSize: 16 }}>✓</span>
                        <span style={{ fontSize: 14, color: theme.text, lineHeight: 1.7 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {scope.excluded && scope.excluded.length > 0 && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: theme.text2, margin: "0 0 12px" }}>Not included</p>
                    {scope.excluded.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
                        <span style={{ color: theme.text2, flexShrink: 0, fontSize: 16 }}>×</span>
                        <span style={{ fontSize: 14, color: theme.text2, lineHeight: 1.7 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Deliverables */}
          {scope.deliverables && scope.deliverables.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Deliverables
              </h2>
              {scope.deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${theme.border}` }}>
                  <span style={{ width: 26, height: 26, background: theme.text, color: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, borderRadius: 2 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: theme.text, lineHeight: 1.7, paddingTop: 2 }}>{d}</span>
                </div>
              ))}
            </section>
          )}

          {/* Timeline */}
          {scope.timeline && scope.timeline.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Timeline
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.text}` }}>
                    {["Phase", "Duration", "Milestone"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 0", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.text2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scope.timeline.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "16px 0", color: theme.text, fontWeight: 600, fontSize: 14 }}>{row.phase}</td>
                      <td style={{ padding: "16px 0", color: theme.text2, fontSize: 14 }}>{row.duration}</td>
                      <td style={{ padding: "16px 0", color: theme.text2, fontSize: 14 }}>{row.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Terms and Conditions */}
          {scope.contract_clauses && scope.contract_clauses.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${theme.border}`, letterSpacing: "-0.02em" }}>
                Terms and Conditions
              </h2>
              {scope.contract_clauses.map((clause, i) => (
                <p key={i} style={{ fontSize: 13, color: theme.text2, lineHeight: 1.8, margin: "0 0 16px", paddingBottom: 16, borderBottom: i < scope.contract_clauses!.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                  {clause}
                </p>
              ))}
            </section>
          )}

          {/* Acceptance section */}
          {!isAccepted ? (
            <div style={{ borderTop: `3px solid ${theme.text}`, paddingTop: 40, marginTop: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                Ready to proceed?
              </h2>
              <p style={{ fontSize: 15, color: theme.text2, margin: "0 0 32px", lineHeight: 1.6, maxWidth: 540 }}>
                By clicking accept you confirm you have read and agree to the scope, deliverables, timeline and terms outlined above.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  style={{ border: `1px solid ${theme.border}`, padding: "14px 16px", fontSize: 15, outline: "none", background: theme.surface, color: theme.text, boxSizing: "border-box", width: "100%", transition: "background 0.2s ease, border-color 0.2s ease" }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  style={{ border: `1px solid ${theme.border}`, padding: "14px 16px", fontSize: 15, outline: "none", background: theme.surface, color: theme.text, boxSizing: "border-box", width: "100%", transition: "background 0.2s ease, border-color 0.2s ease" }}
                />
              </div>

              {acceptError && (
                <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 16px", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px" }}>
                  {acceptError}
                </p>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{ width: "100%", maxWidth: 480, background: accepting ? "#15803d" : "#16a34a", color: "#ffffff", border: "none", height: 56, fontSize: 16, fontWeight: 700, cursor: accepting ? "not-allowed" : "pointer", letterSpacing: "0.01em", opacity: accepting ? 0.8 : 1 }}
              >
                {accepting ? "Processing..." : "I accept this scope →"}
              </button>
              <p style={{ fontSize: 12, color: theme.text2, margin: "12px 0 0" }}>
                This acceptance is recorded with a timestamp for your records.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: "3px solid #16a34a", paddingTop: 40, marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                <span style={{ width: 40, height: 40, background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, borderRadius: "50%", flexShrink: 0 }}>✓</span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: theme.text, margin: 0 }}>
                    Scope accepted by {portal.client_name || "client"}
                  </p>
                  {(portal.accepted_at || acceptedAt) && (
                    <p style={{ fontSize: 14, color: theme.text2, margin: "4px 0 0" }}>
                      Accepted on {acceptedDateStr} at {acceptedTimeStr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 12, color: theme.text2, margin: 0, opacity: 0.5 }}>Powered by Scope</p>
            {freelancer.email && (
              <a href={`mailto:${freelancer.email}`} style={{ fontSize: 12, color: theme.text2, textDecoration: "none" }}>
                {freelancer.email}
              </a>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
