"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  original_enquiry: string;
  extracted_info: {
    project_type?: string;
    goals?: string[];
    features_requested?: string[];
    deadline?: string;
    budget_mentioned?: string;
    missing_details?: string[];
  };
  clarifying_questions: string[];
  clarification_answers: Record<string, string>;
  scope: {
    included?: string[];
    excluded?: string[];
    deliverables?: string[];
    phases?: { name: string; tasks: string[]; duration: string }[];
    timeline?: { phase: string; duration: string; milestone: string }[];
    assumptions?: string[];
    contract_clauses?: string[];
  };
  risk_flags: string[];
  proposal: string;
  status: string;
}

export default function ScopeProjectPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
    });
    loadProject();
  }, [params.id]);

  async function loadProject() {
    const res = await fetch(`/api/scope/save?id=${params.id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setProject(data);
    setTitle(data.title || "");
    setAnswers(data.clarification_answers || {});
    setLoading(false);
  }

  async function saveTitle() {
    if (!project) return;
    setEditTitle(false);
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, title }) });
  }

  async function saveAnswer(index: number, value: string) {
    if (!project) return;
    const newAnswers = { ...answers, [index]: value };
    setAnswers(newAnswers);
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, clarification_answers: newAnswers }) });
  }

  async function buildScope() {
    if (!project) return;
    setBuilding(true); setError("");
    try {
      const res = await fetch("/api/scope/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, answers }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to build scope"); }
      const data = await res.json();
      setProject((prev) => prev ? { ...prev, ...data, status: "complete" } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBuilding(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 15 }}>Loading project...</p>
      </main>
    </div>
  );

  if (!project) return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af" }}>Project not found. <Link href="/scope">Back to projects</Link></p>
      </main>
    </div>
  );

  const info = project.extracted_info || {};
  const scope = project.scope || {};

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/scope" style={{ fontSize: 13, color: "#6b7280" }}>← Projects</Link>
          <div style={{ flex: 1, minWidth: 200 }}>
            {editTitle ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} autoFocus style={{ fontSize: 16, fontWeight: 700, border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", color: "#0a0a0a", outline: "none" }} />
            ) : (
              <button onClick={() => setEditTitle(true)} style={{ background: "none", border: "none", fontSize: 16, fontWeight: 700, color: "#0a0a0a", cursor: "text", padding: 0 }}>{title || "Untitled project"} <span style={{ fontSize: 12, color: "#9ca3af" }}>✎</span></button>
            )}
          </div>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 100, background: project.status === "complete" ? "#0a0a0a" : "#f3f4f6", color: project.status === "complete" ? "#fff" : "#6b7280", fontWeight: 600 }}>{project.status === "complete" ? "Complete" : "Draft"}</span>
          {project.status === "complete" && (
            <Link href={`/scope/${project.id}/proposal`} style={{ background: "#0a0a0a", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>View proposal →</Link>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left panel */}
          <div style={{ width: 380, borderRight: "1px solid #e5e7eb", background: "#fff", overflowY: "auto", padding: "24px 20px", flexShrink: 0 }}>
            {/* Original enquiry */}
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setEnquiryOpen(!enquiryOpen)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                {enquiryOpen ? "▾" : "▸"} Original enquiry
              </button>
              {enquiryOpen && <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "10px 0 0", padding: "12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>{project.original_enquiry}</p>}
            </div>

            {/* Extracted info */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Extracted info</h3>
              {info.project_type && <span style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", background: "#f3f4f6", borderRadius: 100, color: "#374151", fontWeight: 500, marginBottom: 12 }}>{info.project_type}</span>}
              {info.goals && info.goals.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Goals</div>
                  {info.goals.map((g, i) => <div key={i} style={{ fontSize: 13, color: "#374151", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>• {g}</div>)}
                </div>
              )}
              {info.features_requested && info.features_requested.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Features requested</div>
                  {info.features_requested.map((f, i) => <div key={i} style={{ fontSize: 13, color: "#374151", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>• {f}</div>)}
                </div>
              )}
              {info.deadline && <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}><strong>Deadline:</strong> {info.deadline}</div>}
              {info.budget_mentioned && <div style={{ fontSize: 13, color: "#374151", marginBottom: 12 }}><strong>Budget:</strong> {info.budget_mentioned}</div>}
              {info.missing_details && info.missing_details.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {info.missing_details.map((d, i) => (
                    <div key={i} style={{ fontSize: 12, padding: "8px 12px", background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, color: "#92400e", marginBottom: 6 }}>⚠ {d}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk flags */}
            {project.risk_flags && project.risk_flags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk flags</h3>
                {project.risk_flags.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, padding: "10px 12px", background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, color: "#92400e", marginBottom: 8, display: "flex", gap: 8 }}>
                    <span>▲</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clarifying questions */}
            {project.clarifying_questions && project.clarifying_questions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Clarifying questions</h3>
                {project.clarifying_questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px", lineHeight: 1.5 }}>{i + 1}. {q}</p>
                    <textarea
                      defaultValue={answers[i] || ""}
                      onBlur={(e) => saveAnswer(i, e.target.value)}
                      placeholder="Your answer..."
                      style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13, minHeight: 64, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#991b1b", marginBottom: 16 }}>{error}</div>}

            <button onClick={buildScope} disabled={building} style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 9, padding: "13px 20px", fontSize: 15, fontWeight: 700, cursor: building ? "not-allowed" : "pointer", opacity: building ? 0.7 : 1 }}>
              {building ? "Building scope..." : "Build scope →"}
            </button>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            {!scope.included && !scope.deliverables ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 15, color: "#9ca3af", margin: 0 }}>Answer the clarifying questions and click <strong>Build scope →</strong></p>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 700 }}>
                {/* Scope of work */}
                {(scope.included || scope.excluded) && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Scope of Work</h2>
                    {scope.included && scope.included.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Included</div>
                        {scope.included.map((item, i) => <div key={i} style={{ fontSize: 14, color: "#374151", padding: "5px 0", display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>{item}</div>)}
                      </div>
                    )}
                    {scope.excluded && scope.excluded.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Excluded</div>
                        {scope.excluded.map((item, i) => <div key={i} style={{ fontSize: 14, color: "#6b7280", padding: "5px 0", display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ flexShrink: 0 }}>✕</span>{item}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Deliverables */}
                {scope.deliverables && scope.deliverables.length > 0 && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Deliverables</h2>
                    {scope.deliverables.map((d, i) => (
                      <div key={i} style={{ fontSize: 14, color: "#374151", padding: "6px 0", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
                        <span style={{ color: "#9ca3af", minWidth: 20, flexShrink: 0 }}>{i + 1}.</span>{d}
                      </div>
                    ))}
                  </div>
                )}

                {/* Project phases */}
                {scope.phases && scope.phases.length > 0 && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Project Phases</h2>
                    {scope.phases.map((phase, i) => (
                      <details key={i} style={{ marginBottom: 12 }}>
                        <summary style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", cursor: "pointer", padding: "8px 0", borderBottom: "1px solid #e5e7eb", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                          <span>Phase {i + 1}: {phase.name}</span>
                          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>{phase.duration}</span>
                        </summary>
                        <div style={{ paddingLeft: 16, paddingTop: 8 }}>
                          {phase.tasks.map((task, j) => <div key={j} style={{ fontSize: 13, color: "#374151", padding: "4px 0" }}>• {task}</div>)}
                        </div>
                      </details>
                    ))}
                  </div>
                )}

                {/* Timeline */}
                {scope.timeline && scope.timeline.length > 0 && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Timeline</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Phase", "Duration", "Milestone"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 0", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {scope.timeline.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{row.phase}</td>
                            <td style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.duration}</td>
                            <td style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.milestone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Contract Clauses */}
                {scope.contract_clauses && scope.contract_clauses.length > 0 && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Contract Clauses</h2>
                    {scope.contract_clauses.map((clause, i) => (
                      <p key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: "0 0 12px", paddingBottom: 12, borderBottom: i < scope.contract_clauses!.length - 1 ? "1px solid #f3f4f6" : "none" }}>{clause}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
