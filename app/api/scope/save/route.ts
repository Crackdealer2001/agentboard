import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

async function getServiceClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
}

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const allowed = await rateLimit(`save-get:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const id = req.nextUrl.searchParams.get("id");
    const devSessionId = req.nextUrl.searchParams.get("devSessionId");

    if (!id || typeof id !== "string") return NextResponse.json({ error: "id is required" }, { status: 400 });

    const serviceClient = await getServiceClient();
    let userId: string;

    if (devSessionId) {
      const { data: devSession } = await serviceClient
        .from("dev_sessions")
        .select("id, is_active")
        .eq("id", devSessionId)
        .eq("is_active", true)
        .single();
      if (!devSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = devSession.id;
    } else {
      const authClient = await getAuthClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    const { data, error } = await serviceClient
      .from("scope_projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await rateLimit(`save-post:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const serviceClient = await getServiceClient();
    const body = await req.json();
    const { projectId, devSessionId, ...fields } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    let userId: string;

    if (devSessionId) {
      const { data: devSession } = await serviceClient
        .from("dev_sessions")
        .select("id, is_active")
        .eq("id", devSessionId)
        .eq("is_active", true)
        .single();
      if (!devSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = devSession.id;
    } else {
      const authClient = await getAuthClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    const allowedFields = ["title", "clarification_answers", "proposal", "proposal_email", "status", "scope", "key_points", "attachments"];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in fields) {
        if (key === "title" && typeof fields[key] === "string") {
          update[key] = sanitizeText(fields[key] as string, 200);
        } else {
          update[key] = fields[key];
        }
      }
    }

    const { error } = await serviceClient
      .from("scope_projects")
      .update(update)
      .eq("id", projectId)
      .eq("user_id", userId);
    if (error) {
      console.error("Save error:", error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
