"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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

interface KeyPoint {
  id: string;
  text: string;
  explanation: string;
  sectionName: string;
  loading?: boolean;
}

interface SelectionPopup {
  x: number;
  y: number;
  text: string;
  sectionName: string;
}

const SECTIONS = [
  { id: "section-summary", label: "Project Summary" },
  { id: "section-scope", label: "Scope of Work" },
  { id: "section-deliverables", label: "Deliverables" },
  { id: "section-timeline", label: "Timeline" },
  { id: "section-assumptions", label: "Assumptions" },
  { id: "section-terms", label: "Terms & Conditions" },
];

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
    });
    fetch(`/api/scope/save?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setProposal(data.proposal || "");
        if (data.key_points && Array.isArray(data.key_points)) {
          setKeyPoints(data.key_points);
        }
        setLoading(false);
      });
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopup(null);
      return;
    }
    const selectedText = selection.toString().trim();
    if (!documentRef.current) return;

    // Check if selection is inside the document container
    const range = selection.getRangeAt(0);
    if (!documentRef.current.contains(range.commonAncestorContainer)) {
      setSelectionPopup(null);
      return;
    }

    // Find section name
    let sectionName = "Proposal";
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== documentRef.current) {
      if (node instanceof HTMLElement && node.dataset.sectionName) {
        sectionName = node.dataset.sectionName;
        break;
      }
      node = node.parentNode;
    }

    const rect = range.getBoundingClientRect();
    setSelectionPopup({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 48,
      text: selectedText,
      sectionName,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  async function addKeyPoint() {
    if (!selectionPopup || !project) return;
    const { text, sectionName } = selectionPopup;
    setSelectionPopup(null);

    const id = `kp-${Date.now()}`;
    const newKeyPoint: KeyPoint = { id, text, explanation: "", sectionName, loading: true };
    const updated = [...keyPoints, newKeyPoint];
    setKeyPoints(updated);

    try {
      const res = await fetch("/api/scope/explain-keypoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText: text, projectId: project.id }),
      });
      const data = await res.json();
      const explanation = data.explanation || "No explanation available.";
      const finalKeyPoints = updated.map((kp) =>
        kp.id === id ? { ...kp, explanation, loading: false } : kp
      );
      setKeyPoints(finalKeyPoints);
      // Save to project
      await fetch("/api/scope/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          key_points: finalKeyPoints.map(({ id, text, explanation, sectionName }) => ({ id, text, explanation, sectionName })),
        }),
      });
    } catch {
      setKeyPoints((prev) => prev.map((kp) =>
        kp.id === id ? { ...kp, explanation: "Failed to load explanation.", loading: false } : kp
      ));
    }
  }

  async function deleteKeyPoint(id: string) {
    if (!project) return;
    const updated = keyPoints.filter((kp) => kp.id !== id);
    setKeyPoints(updated);
    await fetch("/api/scope/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        key_points: updated.map(({ id, text, explanation, sectionName }) => ({ id, text, explanation, sectionName })),
      }),
    });
  }

  async function saveProposal() {
    if (!project) return;
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, proposal }) });
  }

  async function copyText() {
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg2)" }}>
      <p style={{ color: "var(--text4)" }}>Loading proposal...</p>
    </div>
  );
  if (!project) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg2)" }}>
      <p style={{ color: "var(--text4)" }}>Proposal not found.</p>
    </div>
  );

  const scope = project.scope || {};

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg2)" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/scope/${params.id}`} style={{ fontSize: 13, color: "var(--text3)" }}>← Back to scope</Link>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", flex: 1 }}>{project.title || "Proposal"}</span>
        <button onClick={() => { setEditing(!editing); if (editing) saveProposal(); }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
          {editing ? "Save ✓" : "Edit"}
        </button>
        <button onClick={copyText} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={() => window.print()} style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Export PDF
        </button>
      </div>

      {/* Selection popup */}
      {selectionPopup && (
        <div
          style={{
            position: "absolute",
            left: selectionPopup.x,
            top: selectionPopup.y,
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "var(--accent)",
            color: "var(--accent-text)",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addKeyPoint}
        >
          Add key point ✦
        </div>
      )}

      {/* Three-column layout */}
      <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto", padding: "0 24px", gap: 0 }}>
        {/* Left sidebar — outline */}
        <aside style={{ width: 240, flexShrink: 0, paddingTop: 40 }}>
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Outline</div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{ display: "block", fontSize: 13, color: "var(--text3)", padding: "5px 0", lineHeight: 1.5 }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Center — document */}
        <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "40px 40px 80px" }} className="print-content">
          {editing ? (
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              style={{ width: "100%", minHeight: "80vh", border: "1px solid var(--border)", borderRadius: 10, padding: 24, fontSize: 15, lineHeight: 1.8, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", background: "var(--surface)", color: "var(--text)" }}
            />
          ) : (
            <div ref={documentRef} style={{ userSelect: "text" }}>
              {/* Document header */}
              <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Project Proposal</h1>
                <h2 style={{ fontSize: 20, fontWeight: 400, color: "var(--text3)", margin: "0 0 16px" }}>{project.title}</h2>
                <p style={{ fontSize: 13, color: "var(--text4)", margin: 0 }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>

              {/* Project Summary */}
              {project.extracted_info?.goals && project.extracted_info.goals.length > 0 && (
                <div id="section-summary" data-section-name="Project Summary">
                  <Section title="Project Summary">
                    <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>
                      This proposal outlines the scope, deliverables, timeline, and terms for {project.extracted_info.project_type ? `a ${project.extracted_info.project_type} project` : "this project"}.
                    </p>
                  </Section>
                </div>
              )}

              {/* Proposal text */}
              {proposal && (
                <div id="section-proposal" data-section-name="Proposal">
                  <Section title="Proposal">
                    <div style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{proposal}</div>
                  </Section>
                </div>
              )}

              {/* Scope of Work */}
              {(scope.included || scope.excluded) && (
                <div id="section-scope" data-section-name="Scope of Work">
                  <Section title="Scope of Work">
                    {scope.included && scope.included.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Included</p>
                        {scope.included.map((item, i) => <p key={i} style={{ fontSize: 14, color: "var(--text2)", margin: "0 0 6px" }}>✓ {item}</p>)}
                      </div>
                    )}
                    {scope.excluded && scope.excluded.length > 0 && (
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Not included</p>
                        {scope.excluded.map((item, i) => <p key={i} style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 6px" }}>✕ {item}</p>)}
                      </div>
                    )}
                  </Section>
                </div>
              )}

              {/* Deliverables */}
              {scope.deliverables && scope.deliverables.length > 0 && (
                <div id="section-deliverables" data-section-name="Deliverables">
                  <Section title="Deliverables">
                    {scope.deliverables.map((d, i) => <p key={i} style={{ fontSize: 14, color: "var(--text2)", margin: "0 0 8px" }}>{i + 1}. {d}</p>)}
                  </Section>
                </div>
              )}

              {/* Timeline */}
              {scope.timeline && scope.timeline.length > 0 && (
                <div id="section-timeline" data-section-name="Timeline">
                  <Section title="Timeline">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr>
                          {["Phase", "Duration", "Milestone"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 0", fontWeight: 600, color: "var(--text3)", borderBottom: "2px solid var(--border)" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {scope.timeline.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--bg3)", color: "var(--text2)" }}>{row.phase}</td>
                            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--bg3)", color: "var(--text3)" }}>{row.duration}</td>
                            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--bg3)", color: "var(--text3)" }}>{row.milestone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Section>
                </div>
              )}

              {/* Assumptions */}
              {scope.assumptions && scope.assumptions.length > 0 && (
                <div id="section-assumptions" data-section-name="Assumptions">
                  <Section title="Assumptions">
                    {scope.assumptions.map((a, i) => <p key={i} style={{ fontSize: 14, color: "var(--text2)", margin: "0 0 8px" }}>• {a}</p>)}
                  </Section>
                </div>
              )}

              {/* Terms */}
              {scope.contract_clauses && scope.contract_clauses.length > 0 && (
                <div id="section-terms" data-section-name="Terms & Conditions">
                  <Section title="Terms and Conditions">
                    {scope.contract_clauses.map((clause, i) => <p key={i} style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 14px" }}>{clause}</p>)}
                  </Section>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right panel — key points */}
        <aside style={{ width: 300, flexShrink: 0, paddingTop: 40 }}>
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Key Points {keyPoints.length > 0 && `(${keyPoints.length})`}
            </div>
            {keyPoints.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text4)", lineHeight: 1.6, margin: 0 }}>
                Select any text in the proposal to add a key point and get AI insight.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
              {keyPoints.map((kp, idx) => (
                <div key={kp.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", position: "relative", boxShadow: "var(--shadow)" }}>
                  {/* Delete button */}
                  <button
                    onClick={() => deleteKeyPoint(kp.id)}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text4)", lineHeight: 1, padding: "2px 4px" }}
                    title="Remove key point"
                  >
                    ×
                  </button>
                  {/* Number badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, paddingRight: 20 }}>
                    <span style={{ width: 22, height: 22, background: "var(--accent)", color: "var(--accent-text)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <p style={{ fontSize: 12, color: "var(--text4)", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
                      &ldquo;{kp.text.length > 80 ? kp.text.slice(0, 80) + "…" : kp.text}&rdquo;
                    </p>
                  </div>
                  {/* Explanation */}
                  {kp.loading ? (
                    <div style={{ fontSize: 13, color: "var(--text4)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--text3)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Analysing...
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{kp.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 16px", paddingBottom: 12, borderBottom: "2px solid var(--text)" }}>{title}</h2>
      {children}
    </div>
  );
}
