import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default async function ScopePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: projects } = await serviceSupabase
    .from("scope_projects")
    .select("id, title, status, created_at, original_enquiry")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg2)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: 0 }}>Projects</h1>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", borderRadius: 9, padding: "10px 20px", fontSize: 14, fontWeight: 600, display: "inline-block" }}>New project →</Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "80px 24px", textAlign: "center", boxShadow: "var(--shadow)" }}>
            <p style={{ fontSize: 16, color: "var(--text4)", margin: "0 0 20px" }}>No projects yet. Create your first one.</p>
            <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", borderRadius: 9, padding: "11px 22px", fontSize: 15, fontWeight: 600, display: "inline-block" }}>New project →</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {projects.map((p) => (
              <Link key={p.id} href={`/scope/${p.id}`} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", boxShadow: "var(--shadow)", display: "block", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0, flex: 1, marginRight: 12 }}>{p.title || "Untitled project"}</h3>
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: p.status === "complete" ? "var(--accent)" : "var(--bg3)", color: p.status === "complete" ? "var(--accent-text)" : "var(--text3)", fontWeight: 600, flexShrink: 0 }}>{p.status === "complete" ? "Complete" : "Draft"}</span>
                </div>
                {p.original_enquiry && (
                  <p style={{ fontSize: 13, color: "var(--text4)", margin: "0 0 14px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{p.original_enquiry}</p>
                )}
                <span style={{ fontSize: 12, color: "var(--text4)" }}>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
