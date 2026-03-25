"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

const LIMITS = { extract: 80, build: 40, explain: 150 };

const CARDS = [
  {
    action: "extract" as const,
    label: "ENQUIRY ANALYSIS",
    description: "Paste and analyse client enquiries",
  },
  {
    action: "build" as const,
    label: "SCOPE BUILDS",
    description: "Full scope and proposal generation",
  },
  {
    action: "explain" as const,
    label: "KEY EXPLANATIONS",
    description: "AI explanations for highlighted text",
  },
];

function barColor(count: number, limit: number): string {
  const pct = count / limit;
  if (pct >= 1) return "#ef4444";
  if (pct >= 0.7) return "#f59e0b";
  return "#c8f135";
}

function UsageCard({
  label,
  description,
  count,
  limit,
}: {
  label: string;
  description: string;
  count: number;
  limit: number;
}) {
  const pct = Math.min((count / limit) * 100, 100);
  const color = barColor(count, limit);
  const atLimit = count >= limit;
  const nearLimit = count / limit >= 0.7;

  return (
    <div style={{ background: "#000", border: "1px solid #1f1f1f", padding: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#c8f135", margin: "0 0 16px" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 56, fontWeight: 800, color: atLimit ? "#ef4444" : nearLimit ? "#f59e0b" : "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>
          {count}
        </span>
        <span style={{ fontSize: 14, color: "#404040", fontWeight: 500, paddingBottom: 8 }}>
          of {limit} this month
        </span>
      </div>
      <div style={{ height: 4, background: "#1a1a1a", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ fontSize: 12, color: "#808080", margin: 0 }}>{description}</p>
    </div>
  );
}

export default function UsagePage() {
  const [usage, setUsage] = useState<{ extract: number; build: number; explain: number } | null>(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setMonthLabel(now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }));

    let devSessionId: string | null = null;
    try {
      const stored = localStorage.getItem("dev_session");
      if (stored) {
        const parsed = JSON.parse(stored) as { sessionId?: string };
        devSessionId = parsed.sessionId ?? null;
      }
    } catch { /* ignore */ }

    const url = devSessionId ? `/api/usage?devSessionId=${devSessionId}` : "/api/usage";
    fetch(url)
      .then((r) => r.json())
      .then((data: { extract?: number; build?: number; explain?: number }) => {
        setUsage({
          extract: data.extract ?? 0,
          build: data.build ?? 0,
          explain: data.explain ?? 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "56px 48px", maxWidth: 960 }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#404040", margin: "0 0 12px" }}>
            Usage
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            Monthly usage
          </h1>
          <p style={{ fontSize: 14, color: "#808080", margin: 0 }}>
            Your current month usage — resets on the 1st &nbsp;·&nbsp; {monthLabel}
          </p>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1f1f1f" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: "#000", padding: 32, height: 160 }}>
                <div style={{ background: "#111", height: 12, width: "40%", marginBottom: 16 }} />
                <div style={{ background: "#111", height: 48, width: "30%", marginBottom: 12 }} />
                <div style={{ background: "#1a1a1a", height: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1f1f1f", marginBottom: 24 }}>
            {CARDS.map((card) => (
              <UsageCard
                key={card.action}
                label={card.label}
                description={card.description}
                count={usage?.[card.action] ?? 0}
                limit={LIMITS[card.action]}
              />
            ))}
          </div>
        )}

        {/* Info box */}
        <div style={{ background: "#000", border: "1px solid #1f1f1f", padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="7" stroke="#c8f135" strokeWidth="1.5" />
            <path d="M8 7v4" stroke="#c8f135" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="5" r="0.75" fill="#c8f135" />
          </svg>
          <p style={{ fontSize: 13, color: "#808080", margin: 0, lineHeight: 1.65 }}>
            Usage resets automatically on the 1st of every month. Limits apply to all accounts including developer accounts.
          </p>
        </div>

      </main>
    </div>
  );
}
