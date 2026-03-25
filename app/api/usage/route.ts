import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const devSessionId = req.nextUrl.searchParams.get("devSessionId");
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

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
    if (!devSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { data: rows } = await serviceClient
    .from("api_usage")
    .select("action, count")
    .eq("user_id", userId)
    .eq("month", monthKey);

  const usage: Record<string, number> = { extract: 0, build: 0, explain: 0 };
  for (const row of (rows ?? [])) {
    if (row.action in usage) usage[row.action] = row.count as number;
  }

  return NextResponse.json({ ...usage, monthKey });
}
