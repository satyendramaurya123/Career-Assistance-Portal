import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamCareerChat } from "@/lib/gemini/service";
import { chatRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!chatRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const { message, session_id } = await request.json();
    if (!message?.trim()) return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });

    const admin = createAdminClient();
    let sessionId = session_id;
    if (!sessionId) {
      const { data: newSession } = await admin.from("chat_sessions").insert({
        user_id: user.id, title: message.substring(0, 50), is_active: true, message_count: 0,
      }).select().single();
      sessionId = newSession?.id;
    }

    const { data: history } = await admin.from("chat_messages").select("role, content").eq("session_id", sessionId).order("created_at", { ascending: true }).limit(20);
    const formattedHistory = (history || []).map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("model" as const), parts: [{ text: m.content }] }));

    await admin.from("chat_messages").insert({ session_id: sessionId, user_id: user.id, role: "USER", content: message });

    const result = await streamCareerChat(formattedHistory, message);
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          await admin.from("chat_messages").insert({ session_id: sessionId, user_id: user.id, role: "ASSISTANT", content: fullResponse });
          await admin.from("chat_sessions").update({ message_count: (history?.length || 0) + 2, updated_at: new Date().toISOString() }).eq("id", sessionId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, session_id: sessionId })}\n\n`));
          controller.close();
        } catch (err) { controller.error(err); }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Session-Id": sessionId || "" } });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ success: false, error: "Chat failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).eq("user_id", user.id).order("created_at", { ascending: true });
      if (error) { console.error("Chat messages fetch error:", error); return NextResponse.json({ success: false, error: error.message }, { status: 500 }); }
      return NextResponse.json({ success: true, data: data ?? [] });
    }
    const { data, error } = await supabase.from("chat_sessions").select("*").eq("user_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50);
    if (error) { console.error("Chat sessions fetch error:", error); return NextResponse.json({ success: false, error: error.message }, { status: 500 }); }
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err) { console.error("Chat GET error:", err); return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { session_id } = await request.json();
    await supabase.from("chat_sessions").update({ deleted_at: new Date().toISOString() }).eq("id", session_id).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
