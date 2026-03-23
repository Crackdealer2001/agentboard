"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface ScopeData {
  included?: string[];
  excluded?: string[];
  deliverables?: string[];
  phases?: { name: string; tasks: string[]; duration: string }[];
  timeline?: { phase: string; duration: string; milestone: string }[];
  assumptions?: string[];
  contract_clauses?: string[];
}

interface Project {
  id: string;
  title: string;
  proposal: string;
  scope: ScopeData;
  extracted_info: {
    project_type?: string;
    goals?: string[];
  };
}

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
    });
    fetch(`/api/scope/save?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setProposal(data.proposal || "");
        setLoading(false);
      });
  }, [params.id]);

  async function saveProposal() {
    if (!project) return;
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, proposal }) });
  }

  async function copyText() {
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p style={{ color: "#9ca3af" }}>Loading proposal...</p></div>;
  if (!project) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p style={{ color: "#9ca3af" }}>Proposal not found.</p></div>;

  const scope = project.scope || {};

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/scope/${params.id}`} style={{ fontSize: 13, color: "#6b7280" }}>← Back to scope</Link>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", flex: 1 }}>{project.title || "Proposal"}</span>
        <button onClick={() => { setEditing(!editing); if (editing) saveProposal(); }} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#0a0a0a", cursor: "pointer" }}>
          {editing ? "Save ✓" : "Edit"}
        </button>
        <button onClick={copyText} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#0a0a0a", cursor: "pointer" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={() => window.print()} style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Export PDF
        </button>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }} className="print-content">
        {editing ? (
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            style={{ width: "100%", minHeight: "80vh", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, fontSize: 15, lineHeight: 1.8, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        ) : (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 48 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0a0a0a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Project Proposal</h1>
              <h2 style={{ fontSize: 20, fontWeight: 400, color: "#6b7280", margin: "0 0 16px" }}>{project.title}</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            {/* Project Summary */}
            {project.extracted_info?.goals && project.extracted_info.goals.length > 0 && (
              <Section title="Project Summary">
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, margin: 0 }}>
                  This proposal outlines the scope, deliverables, timeline, and terms for {project.extracted_info.project_type ? `a ${project.extracted_info.project_type} project` : "this project"}.
                </p>
              </Section>
            )}

            {/* Proposal text */}
            {proposal && (
              <Section title="Proposal">
                <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{proposal}</div>
              </Section>
            )}

            {/* Scope of Work */}
            {(scope.included || scope.excluded) && (
              <Section title="Scope of Work">
                {scope.included && scope.included.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Included</p>
                    {scope.included.map((item, i) => <p key={i} style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>✓ {item}</p>)}
                  </div>
                )}
                {scope.excluded && scope.excluded.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Not included</p>
                    {scope.excluded.map((item, i) => <p key={i} style={{ fontSize: 14, color: "#6b7280", margin: "0 0 6px" }}>✕ {item}</p>)}
                  </div>
                )}
              </Section>
            )}

            {/* Deliverables */}
            {scope.deliverables && scope.deliverables.length > 0 && (
              <Section title="Deliverables">
                {scope.deliverables.map((d, i) => <p key={i} style={{ fontSize: 14, color: "#374151", margin: "0 0 8px" }}>{i + 1}. {d}</p>)}
              </Section>
            )}

            {/* Timeline */}
            {scope.timeline && scope.timeline.length > 0 && (
              <Section title="Timeline">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      {["Phase", "Duration", "Milestone"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 0", fontWeight: 600, color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {scope.timeline.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{row.phase}</td>
                        <td style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.duration}</td>
                        <td style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.milestone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Assumptions */}
            {scope.assumptions && scope.assumptions.length > 0 && (
              <Section title="Assumptions">
                {scope.assumptions.map((a, i) => <p key={i} style={{ fontSize: 14, color: "#374151", margin: "0 0 8px" }}>• {a}</p>)}
              </Section>
            )}

            {/* Terms */}
            {scope.contract_clauses && scope.contract_clauses.length > 0 && (
              <Section title="Terms and Conditions">
                {scope.contract_clauses.map((clause, i) => <p key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: "0 0 14px" }}>{clause}</p>)}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px", paddingBottom: 12, borderBottom: "2px solid #0a0a0a" }}>{title}</h2>
      {children}
    </div>
  );
}
