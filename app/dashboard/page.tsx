import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default async function DashboardPage() {
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
    .select("id, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const total = projects?.length || 0;
  const drafts = projects?.filter((p) => p.status === "draft").length || 0;
  const complete = projects?.filter((p) => p.status === "complete").length || 0;
  const recent = projects?.slice(0, 5) || [];

  const { data: profile } = await serviceSupabase.from("profiles").select("full_name").eq("id", user.id).single();
  const name = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg2)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Welcome back, {name}</h1>
            <p style={{ fontSize: 15, color: "var(--text3)", margin: 0 }}>Here&apos;s an overview of your projects.</p>
          </div>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", borderRadius: 9, padding: "10px 20px", fontSize: 14, fontWeight: 600, display: "inline-block" }}>New project →</Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 36 }}>
          {[
            { label: "Total projects", value: total },
            { label: "In progress", value: drafts },
            { label: "Completed", value: complete },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Recent projects</h2>
            <Link href="/scope" style={{ fontSize: 13, color: "var(--text3)" }}>View all</Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, color: "var(--text4)", margin: "0 0 16px" }}>No projects yet.</p>
              <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600 }}>Create your first project →</Link>
            </div>
          ) : (
            recent.map((p) => (
              <Link key={p.id} href={`/scope/${p.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--bg3)", color: "inherit" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{p.title || "Untitled project"}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 100, background: p.status === "complete" ? "var(--accent)" : "var(--bg3)", color: p.status === "complete" ? "var(--accent-text)" : "var(--text3)", fontWeight: 500 }}>{p.status === "complete" ? "Complete" : "Draft"}</span>
                  <span style={{ fontSize: 12, color: "var(--text4)" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
