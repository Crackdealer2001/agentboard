import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    const { selectedText, projectId } = await req.json();
    if (!selectedText) return NextResponse.json({ error: "No text" }, { status: 400 });

    // projectId is accepted but not required for the AI call
    void projectId;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a freelance business advisor. A freelancer is reviewing this text from a client proposal:

"${selectedText}"

In 2-3 sentences, explain why this specific point matters for the freelancer — what risk, opportunity, or implication it carries. Be direct and practical.`
      }]
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    return NextResponse.json({ explanation: content.text });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
