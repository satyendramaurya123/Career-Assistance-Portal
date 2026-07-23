import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLinkedInSummary } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { linkedInSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = linkedInSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("id, extracted_text").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Please upload a resume first" }, { status: 400 });

    const { target_role, key_achievements } = v.data;
    const summary = await generateLinkedInSummary(resume.extracted_text, target_role, key_achievements);

    const { data: saved } = await admin.from("linkedin_summaries").insert({
      user_id: user.id, resume_id: resume.id, headline: summary.headline,
      about_section: summary.aboutSection, skills: summary.skills,
      recruiter_keywords: summary.recruiterKeywords, is_active: false,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("LinkedIn summary error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "LinkedIn summary generation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data } = await supabase.from("linkedin_summaries").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
