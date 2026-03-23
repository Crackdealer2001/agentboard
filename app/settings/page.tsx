"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      supabase.from("profiles").select("full_name").eq("id", data.user.id).single().then(({ data: p }: { data: { full_name?: string } | null }) => {
        if (p) setFullName(p.full_name || "");
      });
    });
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "delete") return;
    await fetch("/api/delete-account", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/");
  }

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 15, outline: "none", background: "#fff", color: "#0a0a0a", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "40px 40px", maxWidth: 600 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0a0a0a", margin: "0 0 32px" }}>Settings</h1>

        {/* Profile */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "28px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px", color: "#0a0a0a" }}>Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Full name</label>
              <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
              <input style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }} value={user?.email || ""} disabled />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{ marginTop: 20, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 12, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#991b1b" }}>Delete account</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px" }}>This will permanently delete your account and all projects. This cannot be undone.</p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} style={{ background: "#fff", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Delete account</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>Type <strong>delete</strong> to confirm:</p>
              <input style={inputStyle} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="delete" />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={deleteAccount} disabled={deleteConfirm !== "delete"} style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: deleteConfirm !== "delete" ? 0.5 : 1 }}>Confirm delete</button>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }} style={{ background: "none", border: "1px solid #e5e7eb", color: "#0a0a0a", borderRadius: 8, padding: "9px 18px", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
