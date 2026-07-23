import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJobMatch } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { jobMatchSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = jobMatchSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("id, extracted_text").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Please upload a resume first" }, { status: 400 });

    const { target_role, experience_level, location, job_description } = v.data;
    const match = await generateJobMatch(resume.extracted_text, target_role, experience_level, location || "Remote", job_description);

    const { data: saved } = await admin.from("job_matches").insert({
      user_id: user.id, resume_id: resume.id, target_role, experience_level, location: location || null,
      match_percentage: match.matchPercentage, matched_skills: match.matchedSkills,
      missing_skills: match.missingSkills, recommended_skills: match.recommendedSkills,
      job_description: job_description || null, analysis: match,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Job match error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Job match failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("job_matches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
