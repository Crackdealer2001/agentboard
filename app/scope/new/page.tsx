"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function NewScopePage() {
  const router = useRouter();
  const [enquiry, setEnquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enquiry.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/scope/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiry: enquiry.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to analyse enquiry");
      }
      const { projectId } = await res.json();
      router.push(`/scope/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <a href="/scope" style={{ fontSize: 13, color: "#6b7280", display: "inline-block", marginBottom: 32 }}>← Back to projects</a>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px" }}>Paste the client enquiry</h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 32px" }}>Drop in the email, message, or brief exactly as received. No formatting needed.</p>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#991b1b", marginBottom: 20 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <textarea
              value={enquiry}
              onChange={(e) => setEnquiry(e.target.value)}
              placeholder="Hi, I need a website for my restaurant. We want online ordering, a menu page, and a booking system. The site needs to be ready by end of next month..."
              style={{ width: "100%", minHeight: 280, border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px", fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none", color: "#0a0a0a", background: "#fff", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{enquiry.length} characters</span>
            </div>
            <button
              type="submit"
              disabled={loading || !enquiry.trim()}
              style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: loading || !enquiry.trim() ? "not-allowed" : "pointer", opacity: !enquiry.trim() ? 0.5 : 1, marginTop: 16 }}
            >
              {loading ? "Analysing..." : "Analyse enquiry →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
