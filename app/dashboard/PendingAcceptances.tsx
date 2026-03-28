"use client";
import { useState } from "react";

interface PendingPortal {
  project_id: string;
  project_title: string;
  portal_sent_at: string;
  token: string;
}

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function PendingAcceptances({ portals }: { portals: PendingPortal[] }) {
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function sendReminder(projectId: string) {
    setSending((prev) => ({ ...prev, [projectId]: true }));
    setErrors((prev) => ({ ...prev, [projectId]: "" }));
    try {
      const res = await fetch("/api/portal/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [projectId]: d.error || "Failed" }));
      } else {
        setSent((prev) => ({ ...prev, [projectId]: true }));
        setTimeout(() => setSent((prev) => ({ ...prev, [projectId]: false })), 3000);
      }
    } catch {
      setErrors((prev) => ({ ...prev, [projectId]: "Something went wrong" }));
    } finally {
      setSending((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  return (
    <div style={{ background: "#000", border: "1px solid #1f1f1f" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1f1f1f" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#404040" }}>
          Pending acceptances
        </span>
        <span style={{ fontSize: 12, color: "#808080", fontWeight: 500 }}>{portals.length} awaiting</span>
      </div>
      {portals.map((p, i) => (
        <div
          key={p.project_id}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: i < portals.length - 1 ? "1px solid #1f1f1f" : "none", gap: 12 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.project_title}
            </p>
            <p style={{ fontSize: 12, color: "#404040", margin: 0, fontWeight: 500 }}>
              Sent {daysAgo(p.portal_sent_at)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {errors[p.project_id] && (
              <span style={{ fontSize: 12, color: "#ef4444" }}>{errors[p.project_id]}</span>
            )}
            <button
              onClick={() => sendReminder(p.project_id)}
              disabled={sending[p.project_id] || sent[p.project_id]}
              style={{
                background: sent[p.project_id] ? "#16a34a" : "none",
                border: `1px solid ${sent[p.project_id] ? "#16a34a" : "#2a2a2a"}`,
                color: sent[p.project_id] ? "#fff" : "#808080",
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: sending[p.project_id] || sent[p.project_id] ? "default" : "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {sent[p.project_id] ? "✓ Sent!" : sending[p.project_id] ? "Sending..." : "Send reminder"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
