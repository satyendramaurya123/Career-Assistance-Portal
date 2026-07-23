import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSkillGap } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { skillGapSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = skillGapSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("id, extracted_text").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Please upload a resume first" }, { status: 400 });

    const { target_role, current_skills } = v.data;
    const gap = await generateSkillGap(resume.extracted_text, target_role, current_skills);

    const { data: saved } = await admin.from("skill_gap_analysis").insert({
      user_id: user.id, resume_id: resume.id, target_role,
      current_skills: gap.currentSkills, required_skills: gap.requiredSkills,
      missing_skills: gap.missingSkills, learning_priorities: gap.learningPriorities,
      recommended_resources: gap.recommendedResources, estimated_learning_time: gap.estimatedLearningTime, raw_analysis: gap,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Skill gap error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Skill gap analysis failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data } = await supabase.from("skill_gap_analysis").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
