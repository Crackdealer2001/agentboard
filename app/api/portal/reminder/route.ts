import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId } = body as { projectId: string };
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership and get portal
    const [{ data: project }, { data: portal }] = await Promise.all([
      serviceClient.from("scope_projects").select("title").eq("id", projectId).eq("user_id", user.id).single(),
      serviceClient.from("client_portals").select("*").eq("project_id", projectId).single(),
    ]);

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!portal) return NextResponse.json({ error: "No portal for this project" }, { status: 404 });
    if (!portal.client_email) return NextResponse.json({ error: "No client email on file" }, { status: 400 });
    if (portal.status === "accepted") return NextResponse.json({ error: "Already accepted" }, { status: 400 });

    // Get freelancer name
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name, business_name")
      .eq("id", user.id)
      .single();

    const freelancerName = profile?.business_name || profile?.full_name || "Your freelancer";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const portalUrl = `${appUrl}/portal/${portal.token}`;

    await resend.emails.send({
      from: "Scope <noreply@scopeapp.io>",
      to: portal.client_email,
      subject: `Reminder: Your proposal from ${freelancerName} is awaiting your review`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e5e5e5;">
    <div style="padding:32px 40px;border-bottom:1px solid #f0f0f0;">
      <p style="margin:0;font-size:13px;color:#999;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${freelancerName}</p>
    </div>
    <div style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.03em;">Your proposal is ready to review</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">
        This is a friendly reminder that your proposal for <strong style="color:#111;">${project.title}</strong> from <strong style="color:#111;">${freelancerName}</strong> is awaiting your acceptance.
      </p>
      <a href="${portalUrl}" style="display:block;background:#16a34a;color:#ffffff;text-align:center;padding:16px 24px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
        Review and accept proposal →
      </a>
    </div>
    <div style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#bbb;">Powered by Scope</p>
    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reminder error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
