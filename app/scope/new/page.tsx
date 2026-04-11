"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { INDUSTRY_TEMPLATES } from "@/lib/industryTemplates";

interface AttachedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
  preview?: string;
}

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx"];
const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name: string, max = 30): string {
  if (name.length <= max) return name;
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx > 0 && name.length - dotIdx <= 5) {
    const ext = name.slice(dotIdx);
    return name.slice(0, max - ext.length - 3) + "..." + ext;
  }
  return name.slice(0, max - 3) + "...";
}

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// SVG icons
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 22V10M10 16l6-6 6 6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 26h20" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DocIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="5" y="2" width="18" height="24" rx="2" fill="#1f1f1f" stroke="#333" strokeWidth="1.5"/>
    <path d="M9 9h10M9 13h10M9 17h6" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
    <circle cx="7" cy="7" r="5.5" stroke="#333" strokeWidth="2"/>
    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="#c8f135" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" fill="#c8f135"/>
    <path d="M4.5 7l2 2 3-3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function NewScopePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Analysing...");
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [devSessionId, setDevSessionId] = useState<string | null>(null);

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dev_session");
      if (stored) {
        const parsed = JSON.parse(stored) as { sessionId?: string };
        setDevSessionId(parsed.sessionId ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const industryId = selectedIndustry || "general";
  const selectedTemplate = INDUSTRY_TEMPLATES.find((t) => t.id === industryId);

  function validateAndAdd(incoming: File[]): string {
    const slots = MAX_FILES - attachedFiles.length;
    if (incoming.length > slots) return `Maximum ${MAX_FILES} files allowed`;
    for (const f of incoming) {
      if (f.size > MAX_SIZE_BYTES) return "File too large. Maximum size is 10MB";
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
        return "File type not supported";
      }
    }
    return "";
  }

  async function addFiles(incoming: File[]) {
    setFileError("");
    const err = validateAndAdd(incoming);
    if (err) { setFileError(err); return; }

    const entries: AttachedFile[] = await Promise.all(incoming.map(async (f) => {
      let preview: string | undefined;
      if (isImageType(f.type)) {
        preview = await fileToBase64(f);
      }
      return { id: Math.random().toString(36).slice(2), file: f, status: "pending" as const, preview };
    }));

    setAttachedFiles((prev) => [...prev, ...entries]);
  }

  function removeFile(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
    setFileError("");
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) addFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enquiry.trim()) return;
    setLoading(true);
    setLoadingMsg("Analysing...");
    setError("");
    setLimitError(false);

    try {
      // Convert image files to base64 for Claude vision
      const imageFiles = attachedFiles.filter((af) => isImageType(af.file.type));
      const attachmentsForExtract = await Promise.all(
        imageFiles.map(async (af) => ({
          name: af.file.name,
          type: af.file.type,
          size: af.file.size,
          data: af.preview || (await fileToBase64(af.file)),
        }))
      );

      const body: Record<string, unknown> = { enquiry: enquiry.trim(), industryId };
      if (devSessionId) body.devSessionId = devSessionId;
      if (attachmentsForExtract.length > 0) body.attachments = attachmentsForExtract;

      const res = await fetch("/api/scope/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        if (res.status === 429) { setLimitError(true); setLoading(false); return; }
        throw new Error(d.error || "Failed to analyse enquiry");
      }

      const { projectId } = await res.json();

      // Upload files to storage
      if (attachedFiles.length > 0) {
        const uploaded: Array<{ name: string; url: string; type: string; size: number }> = [];

        for (let i = 0; i < attachedFiles.length; i++) {
          const af = attachedFiles[i];
          setLoadingMsg(`Uploading attachments... (${i + 1}/${attachedFiles.length})`);
          setAttachedFiles((prev) =>
            prev.map((f) => f.id === af.id ? { ...f, status: "uploading" } : f)
          );

          try {
            const formData = new FormData();
            formData.append("file", af.file);
            formData.append("projectId", projectId);
            formData.append("filename", af.file.name);
            if (devSessionId) formData.append("devSessionId", devSessionId);

            const upRes = await fetch("/api/scope/upload", { method: "POST", body: formData });
            if (!upRes.ok) {
              setAttachedFiles((prev) =>
                prev.map((f) => f.id === af.id ? { ...f, status: "error" } : f)
              );
              continue;
            }
            const { url } = await upRes.json() as { url: string };
            setAttachedFiles((prev) =>
              prev.map((f) => f.id === af.id ? { ...f, status: "done", url } : f)
            );
            uploaded.push({ name: af.file.name, url, type: af.file.type, size: af.file.size });
          } catch {
            setAttachedFiles((prev) =>
              prev.map((f) => f.id === af.id ? { ...f, status: "error" } : f)
            );
          }
        }

        if (uploaded.length > 0) {
          const saveBody: Record<string, unknown> = { projectId, attachments: uploaded };
          if (devSessionId) saveBody.devSessionId = devSessionId;
          await fetch("/api/scope/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saveBody),
          });
        }
      }

      router.push(`/scope/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <Sidebar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "80px 24px" }}>
          <div style={{ width: "100%", maxWidth: 720 }}>
            <a href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", display: "inline-block", marginBottom: 48 }}>
              ← Back to projects
            </a>

            <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              What type of project is this?
            </h1>
            <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 48px", lineHeight: 1.7 }}>
              Choose the closest match — this helps tailor the scope and contract clauses.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {INDUSTRY_TEMPLATES.map((t) => {
                const isSelected = selectedIndustry === t.id;
                const isHovered = hoveredId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedIndustry(t.id)}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: isSelected ? "#0a1a00" : "#000000",
                      border: isSelected || isHovered ? "1px solid #c8f135" : "1px solid #1f1f1f",
                      boxShadow: isSelected || isHovered ? "0 0 0 1px #c8f135" : "none",
                      padding: "20px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <div
                      style={{ color: isSelected ? "#c8f135" : "var(--text3)", marginBottom: 12, lineHeight: 0 }}
                      dangerouslySetInnerHTML={{ __html: t.icon }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#c8f135" : "var(--text)", marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text4)", lineHeight: 1.5 }}>{t.description}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedIndustry}
                style={{
                  background: selectedIndustry ? "var(--accent)" : "var(--bg3)",
                  color: selectedIndustry ? "var(--accent-text)" : "var(--text4)",
                  border: "none",
                  padding: "14px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: selectedIndustry ? "pointer" : "not-allowed",
                  letterSpacing: "0.02em",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "80px 24px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>

          <a href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", display: "inline-block", marginBottom: 48 }}>
            ← Back to projects
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 13, padding: "4px 10px", background: "var(--bg3)", color: "var(--text3)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {selectedTemplate?.name}
            </span>
            <button
              onClick={() => setStep(1)}
              style={{ fontSize: 12, color: "var(--text4)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, letterSpacing: "0.02em" }}
            >
              Change
            </button>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Paste the client enquiry
          </h1>
          <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 48px", lineHeight: 1.7 }}>
            Drop in the email, message, or brief exactly as received. No formatting needed.
          </p>

          {limitError && (
            <div style={{ border: "1px solid #f59e0b", padding: "20px 24px", marginBottom: 24, background: "rgba(245,158,11,0.06)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", margin: "0 0 6px" }}>
                You&rsquo;ve reached your monthly limit for enquiry analysis (80/80)
              </p>
              <p style={{ fontSize: 13, color: "#92400e", margin: "0 0 6px" }}>
                Your usage resets on the 1st of {(() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); })()}
              </p>
              <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
                Need more? <a href="mailto:support@scopeapp.io" style={{ color: "#f59e0b", fontWeight: 600 }}>Contact support.</a>
              </p>
            </div>
          )}
          {error && !limitError && (
            <div style={{ border: "1px solid #fecaca", padding: "12px 16px", fontSize: 14, color: "#991b1b", marginBottom: 24, background: "#fef2f2" }}>
              {error}
            </div>
          )}

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>

          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative" }}>
              <textarea
                value={enquiry}
                onChange={(e) => setEnquiry(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Hi, I need a website for my restaurant. We want online ordering, a menu page, and a booking system. The site needs to be ready by end of next month..."
                style={{
                  width: "100%",
                  minHeight: 300,
                  border: "1px solid var(--border)",
                  borderTop: focused ? "3px solid var(--text)" : "1px solid var(--border)",
                  padding: focused ? "14px 16px 40px" : "16px 16px 40px",
                  fontSize: 15,
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  color: "var(--text)",
                  background: "var(--surface)",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 12, color: "var(--text4)", fontWeight: 500, letterSpacing: "0.04em" }}>
                {enquiry.length} chars
              </div>
            </div>

            {/* File upload area */}
            <div style={{ marginTop: 16 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(",") + ",.doc,.docx"}
                multiple
                onChange={handleFileInput}
                style={{ display: "none" }}
              />

              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `1px dashed ${dragOver ? "#c8f135" : "#2a2a2a"}`,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: loading ? "default" : "pointer",
                  transition: "border-color 0.15s",
                  background: dragOver ? "rgba(200,241,53,0.03)" : "transparent",
                }}
              >
                <UploadIcon />
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>
                  Attach reference images or documents
                </span>
                <span style={{ fontSize: 12, color: "var(--text4)" }}>
                  PNG, JPG, PDF, up to 10MB each · max {MAX_FILES} files
                </span>
              </div>

              {fileError && (
                <div style={{ fontSize: 13, color: "#ef4444", marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {fileError}
                </div>
              )}

              {/* Attached files list */}
              {attachedFiles.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {attachedFiles.map((af) => (
                    <div
                      key={af.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {/* Thumbnail or doc icon */}
                      <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#111" }}>
                        {af.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={af.preview} alt={af.file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <DocIcon />
                        )}
                      </div>

                      {/* Name and size */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {truncateName(af.file.name)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>
                          {formatSize(af.file.size)}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div style={{ flexShrink: 0 }}>
                        {af.status === "uploading" && <SpinnerIcon />}
                        {af.status === "done" && <CheckIcon />}
                        {af.status === "error" && (
                          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Error</span>
                        )}
                      </div>

                      {/* Remove button */}
                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removeFile(af.id)}
                          style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 0 0 4px", flexShrink: 0 }}
                          aria-label="Remove file"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !enquiry.trim()}
              style={{
                width: "100%",
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                padding: 0,
                height: 56,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !enquiry.trim() ? "not-allowed" : "pointer",
                opacity: !enquiry.trim() ? 0.4 : 1,
                marginTop: 16,
                letterSpacing: "0.02em",
              }}
            >
              {loading ? loadingMsg : "Analyse enquiry →"}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
