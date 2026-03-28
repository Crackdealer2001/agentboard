import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Greeting } from "./Greeting";
import { DateDisplay } from "./DateDisplay";
import PendingAcceptances from "./PendingAcceptances";

type Project = { id: string; title: string; status: string; created_at: string };

const TIPS = [
  "Always define what's NOT included in your scope. This is where scope creep starts.",
  "Ask clients for 3 websites they love before starting any design project.",
  "Set a revision limit in every proposal. 2 rounds is the industry standard.",
  "Define who provides content — client or you. This affects your timeline significantly.",
  "Add a 'silence = approval' clause. If client doesn't respond in 5 days feedback is accepted.",
  "Always get 50% upfront. It filters out unserious clients immediately.",
  "Scope your own time for project management — it's never free.",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getContributionGrid(projects: Project[]): { date: string; count: number }[] {
  const grid: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a map of date → count
  const countMap: Record<string, number> = {};
  for (const p of projects) {
    const d = new Date(p.created_at);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    countMap[key] = (countMap[key] || 0) + 1;
  }

  // Last 84 days (12 weeks)
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    grid.push({ date: key, count: countMap[key] || 0 });
  }
  return grid;
}

function getProjectTypes(projects: Project[]): { label: string; count: number }[] {
  // We don't have explicit project_type, so derive from title keywords
  const types: Record<string, number> = {};
  for (const p of projects) {
    const t = (p.title || "").toLowerCase();
    if (t.includes("website") || t.includes("web") || t.includes("site")) {
      types["Website"] = (types["Website"] || 0) + 1;
    } else if (t.includes("app") || t.includes("mobile")) {
      types["App"] = (types["App"] || 0) + 1;
    } else if (t.includes("design") || t.includes("brand") || t.includes("logo")) {
      types["Design"] = (types["Design"] || 0) + 1;
    } else if (t.includes("market") || t.includes("seo") || t.includes("content")) {
      types["Marketing"] = (types["Marketing"] || 0) + 1;
    } else {
      types["Other"] = (types["Other"] || 0) + 1;
    }
  }
  return Object.entries(types)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function DashboardPage() {
  const cookieStore = await cookies();

  let name = "there";
  let isDevAccount = false;
  let projects: Project[] = [];
  let pendingPortals: { project_id: string; project_title: string; portal_sent_at: string; token: string }[] = [];

  const devSessionCookieId = cookieStore.get("dev_session")?.value;

  if (devSessionCookieId) {
    const authCheck = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user: realUser } } = await authCheck.auth.getUser();

    if (!realUser) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: devSession } = await adminClient
        .from("dev_sessions")
        .select("id, label, is_active")
        .eq("id", devSessionCookieId)
        .eq("is_active", true)
        .single();

      if (devSession) {
        name = devSession.label;
        isDevAccount = true;
        const { data: devProjects } = await adminClient
          .from("scope_projects")
          .select("id, title, status, created_at")
          .eq("user_id", devSession.id)
          .order("created_at", { ascending: false });
        projects = devProjects ?? [];
      }
    }
  }

  if (!isDevAccount) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    isDevAccount = user.email?.endsWith("@scopeapp.internal") === true;

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: userProjects }, { data: profile }, { data: pendingPortalRows }] = await Promise.all([
      serviceClient
        .from("scope_projects")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      serviceClient
        .from("profiles")
        .select("full_name, business_name")
        .eq("id", user.id)
        .single(),
      serviceClient
        .from("client_portals")
        .select("project_id, token, created_at, status")
        .eq("user_id", user.id)
        .eq("status", "pending"),
    ]);

    projects = userProjects ?? [];
    name = profile?.full_name || profile?.business_name || user.email?.split("@")[0] || "there";

    // Build pending portals with project titles
    if (pendingPortalRows && pendingPortalRows.length > 0 && userProjects) {
      const projectTitleMap: Record<string, string> = {};
      for (const p of userProjects) projectTitleMap[p.id] = p.title || "Untitled project";
      pendingPortals = pendingPortalRows.map((pr) => ({
        project_id: pr.project_id,
        project_title: projectTitleMap[pr.project_id] || "Untitled project",
        portal_sent_at: pr.created_at,
        token: pr.token,
      }));
    }
  }

  // Compute stats
  const total = projects.length;
  const complete = projects.filter((p) => p.status === "complete").length;
  const inProgress = projects.filter((p) => p.status === "draft").length;
  const now = new Date();
  const thisMonth = projects.filter((p) => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recent = projects.slice(0, 5);
  const grid = getContributionGrid(projects);
  const projectTypes = getProjectTypes(projects);
  const tipIndex = now.getDay(); // 0–6
  const tip = TIPS[tipIndex % TIPS.length];
  const firstName = name.split(" ")[0];

  const CARD: React.CSSProperties = {
    background: "#000",
    border: "1px solid #1f1f1f",
    borderRadius: 0,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "56px 48px", maxWidth: 1200, fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* ── SECTION 1: Header ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              <Greeting name={firstName} />
            </h1>
            {isDevAccount && (
              <span style={{ background: "#c8f135", color: "#000", fontSize: 9, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em" }}>
                DEV MODE
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#404040", margin: 0, fontWeight: 500 }}>
            <DateDisplay />
          </p>
        </div>

        {/* ── SECTION 2: Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 40, background: "#1f1f1f" }}>
          {[
            { value: total,      label: "Total projects",    sub: "All time" },
            { value: complete,   label: "Completed",         sub: "Proposals sent" },
            { value: inProgress, label: "In progress",       sub: "Being scoped" },
            { value: thisMonth,  label: "This month",        sub: "New this month" },
          ].map((s) => (
            <div key={s.label} style={{ ...CARD, padding: 28 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#404040" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── SECTION 3: Two columns ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* LEFT: Recent activity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1f1f1f" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#404040" }}>Activity</span>
                <Link href="/scope" style={{ fontSize: 12, color: "#808080", textDecoration: "none", fontWeight: 500 }}>View all →</Link>
              </div>
              {recent.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "#404040", margin: "0 0 16px" }}>No projects yet.</p>
                  <Link href="/scope/new" style={{ color: "#c8f135", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    Start your first →
                  </Link>
                </div>
              ) : (
                recent.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/scope/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      borderBottom: i < recent.length - 1 ? "1px solid #1f1f1f" : "none",
                      textDecoration: "none",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title || "Untitled project"}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.06em", textTransform: "uppercase" as const, flexShrink: 0,
                      background: p.status === "complete" ? "#c8f135" : "#111",
                      color: p.status === "complete" ? "#000" : "#808080",
                      border: p.status === "complete" ? "none" : "1px solid #2a2a2a",
                    }}>
                      {p.status === "complete" ? "Complete" : "Draft"}
                    </span>
                    <span style={{ fontSize: 12, color: "#404040", flexShrink: 0, fontWeight: 500 }}>
                      {timeAgo(p.created_at)}
                    </span>
                  </Link>
                ))
              )}
            </div>

            {/* Quick start */}
            <div style={{ ...CARD, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                Start a new project
              </h3>
              <p style={{ fontSize: 13, color: "#808080", margin: "0 0 24px", lineHeight: 1.6 }}>
                Paste a client brief and get a full scope in minutes.
              </p>
              <Link
                href="/scope/new"
                style={{
                  display: "block",
                  background: "#c8f135",
                  color: "#000",
                  textAlign: "center",
                  height: 52,
                  lineHeight: "52px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                New project →
              </Link>
            </div>
          </div>

          {/* RIGHT: Project breakdown + Tips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Project breakdown */}
            <div style={{ ...CARD, padding: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#404040", margin: "0 0 24px" }}>
                Project types
              </p>
              {projectTypes.length === 0 ? (
                <p style={{ fontSize: 13, color: "#404040", margin: 0 }}>No projects yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {projectTypes.map((t) => {
                    const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                    return (
                      <div key={t.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "#808080", fontWeight: 500 }}>{t.label}</span>
                          <span style={{ fontSize: 12, color: "#404040", fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: "#1a1a1a", width: "100%" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#c8f135" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tip of the day */}
            <div style={{ ...CARD, padding: 28 }}>
              <span style={{ display: "inline-block", background: "#c8f135", color: "#000", fontSize: 9, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.12em", marginBottom: 16 }}>
                TIP
              </span>
              <p style={{ fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.7, fontWeight: 500, letterSpacing: "-0.01em" }}>
                {tip}
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3b: Pending acceptances ── */}
        {pendingPortals.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <PendingAcceptances portals={pendingPortals} />
          </div>
        )}

        {/* ── SECTION 4: Contribution grid ── */}
        <div style={{ ...CARD, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#404040", margin: 0 }}>
              Projects created
            </p>
            <span style={{ fontSize: 12, color: "#404040", fontWeight: 500 }}>
              {total} total
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(84, 1fr)", gap: 3 }}>
            {grid.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} project${cell.count !== 1 ? "s" : ""}`}
                style={{
                  aspectRatio: "1",
                  background: cell.count === 0 ? "#1a1a1a" : cell.count === 1 ? "#c8f135" : "#d8ff45",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <span style={{ fontSize: 11, color: "#404040" }}>Less</span>
            {["#1a1a1a", "#c8f135", "#d8ff45"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, background: c, borderRadius: 1 }} />
            ))}
            <span style={{ fontSize: 11, color: "#404040" }}>More</span>
          </div>
        </div>

      </main>
    </div>
  );
}
