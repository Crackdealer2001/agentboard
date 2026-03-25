import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: session } = await serviceClient
      .from("dev_sessions")
      .select("id, label, is_active")
      .eq("password", password)
      .eq("is_active", true)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await serviceClient
      .from("dev_sessions")
      .update({ last_used: new Date().toISOString() })
      .eq("id", session.id);

    return NextResponse.json({ success: true, sessionId: session.id, label: session.label });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
