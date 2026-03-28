import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: portal, error } = await supabase
    .from("client_portals")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !portal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch project and profile in parallel
  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase
      .from("scope_projects")
      .select("id, title, scope, proposal, extracted_info, created_at")
      .eq("id", portal.project_id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("id", portal.user_id)
      .single(),
  ]);

  // Get freelancer email from auth admin API
  let freelancerEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(portal.user_id);
    freelancerEmail = authData?.user?.email ?? null;
  } catch { /* ignore */ }

  // Increment view_count and set viewed_at
  const now = new Date().toISOString();
  if (!portal.viewed_at) {
    await supabase
      .from("client_portals")
      .update({ view_count: 1, viewed_at: now, updated_at: now })
      .eq("id", portal.id);
  } else {
    await supabase
      .from("client_portals")
      .update({ view_count: (portal.view_count || 0) + 1, updated_at: now })
      .eq("id", portal.id);
  }

  return NextResponse.json({
    portal: {
      id: portal.id,
      status: portal.status,
      client_name: portal.client_name,
      client_email: portal.client_email,
      message: portal.message,
      accepted_at: portal.accepted_at,
      created_at: portal.created_at,
    },
    project: project ?? null,
    freelancer: {
      name: (profile?.business_name || profile?.full_name || "Freelancer") as string,
      email: freelancerEmail,
    },
  });
}
