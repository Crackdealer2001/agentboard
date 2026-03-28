import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, clientEmail, clientName, message, devSessionId } = body as {
      projectId: string;
      clientEmail?: string;
      clientName?: string;
      message?: string;
      devSessionId?: string;
    };

    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let userId: string;

    if (devSessionId) {
      const { data: devSession } = await serviceClient
        .from("dev_sessions")
        .select("id, is_active")
        .eq("id", devSessionId)
        .eq("is_active", true)
        .single();

      if (!devSession) return NextResponse.json({ error: "Invalid dev session" }, { status: 401 });
      userId = devSession.id;
    } else {
      const cookieStore = await cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    // Verify user owns the project
    const { data: project } = await serviceClient
      .from("scope_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Check if portal already exists
    const { data: existing } = await serviceClient
      .from("client_portals")
      .select("token")
      .eq("project_id", projectId)
      .single();

    if (existing?.token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      return NextResponse.json({
        token: existing.token,
        portalUrl: `${appUrl}/portal/${existing.token}`,
      });
    }

    // Create new portal with UUID token
    const token = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: insertError } = await serviceClient
      .from("client_portals")
      .insert({
        project_id: projectId,
        user_id: userId,
        token,
        status: "pending",
        client_name: clientName || null,
        client_email: clientEmail || null,
        message: message || null,
        view_count: 0,
        created_at: now,
        updated_at: now,
      });

    if (insertError) {
      console.error("Portal insert error:", insertError);
      return NextResponse.json({ error: "Failed to create portal" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.json({
      token,
      portalUrl: `${appUrl}/portal/${token}`,
    });
  } catch (err) {
    console.error("Portal create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
