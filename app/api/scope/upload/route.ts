import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const filename = formData.get("filename") as string | null;
    const devSessionId = formData.get("devSessionId") as string | null;

    if (!file || !projectId || !filename) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Validate auth
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
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    // Verify project belongs to user
    const { data: project } = await serviceClient
      .from("scope_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, "_");
    const path = `${projectId}/${safeFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await serviceClient.storage
      .from("project-attachments")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from("project-attachments")
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
