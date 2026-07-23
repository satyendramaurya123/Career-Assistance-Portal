import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInterviewQuestions } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { interviewSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = interviewSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const { target_role, interview_type, num_questions } = v.data;
    const { questions } = await generateInterviewQuestions(target_role, interview_type, num_questions);

    const admin = createAdminClient();
    const { data: saved } = await admin.from("interviews").insert({
      user_id: user.id, title: `${interview_type} Interview – ${target_role}`, target_role,
      interview_type, status: "PENDING", questions,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Interview create error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate interview" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data } = await supabase.from("interviews").select("*, interview_results(overall_score, completed_at)").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
