import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import ProjectsClient from "./ProjectsClient";

function DevBanner({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: "#0a1a00",
      border: "1px solid rgba(200,241,53,0.2)",
      padding: "10px 16px",
      marginBottom: 32,
    }}>
      <span style={{ fontSize: 13, color: "#c8f135", fontWeight: 600 }}>
        DEV MODE — {label}
      </span>
    </div>
  );
}

export default async function ScopePage() {
  const cookieStore = await cookies();

  const devSessionId = cookieStore.get("dev_session")?.value;
  if (devSessionId) {
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: devSession } = await serviceSupabase
      .from("dev_sessions")
      .select("id, label, is_active")
      .eq("id", devSessionId)
      .eq("is_active", true)
      .single();

    if (devSession) {
      const { data: devProjects } = await serviceSupabase
        .from("scope_projects")
        .select("id, title, status, created_at, original_enquiry")
        .eq("user_id", devSession.id)
        .order("created_at", { ascending: false });

      return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "64px 48px" }}>
            <DevBanner label={devSession.label} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>All projects</p>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>Projects</h1>
              </div>
              <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block", letterSpacing: "0.02em" }}>
                New project →
              </Link>
            </div>
            <ProjectsClient initialProjects={devProjects ?? []} />
          </main>
        </div>
      );
    }
  }

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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>All projects</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>Projects</h1>
          </div>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block", letterSpacing: "0.02em" }}>
            New project →
          </Link>
        </div>

        <ProjectsClient initialProjects={projects ?? []} />

      </main>
    </div>
  );
}
