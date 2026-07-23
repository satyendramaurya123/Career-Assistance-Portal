import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeResume } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const { resume_id } = await request.json();
    if (!resume_id) return NextResponse.json({ success: false, error: "resume_id is required" }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("*").eq("id", resume_id).eq("user_id", user.id).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Resume not found or text not extracted" }, { status: 404 });

    const analysis = await analyzeResume(resume.extracted_text);

    const { data: saved, error: dbError } = await admin.from("resume_analysis").upsert({
      user_id: user.id, resume_id,
      overall_score: analysis.score, ats_score: analysis.atsScore,
      readability_score: analysis.readabilityScore, structure_score: analysis.structureScore,
      strengths: analysis.strengths, weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations, missing_keywords: analysis.missingKeywords,
      technical_skills: analysis.technicalSkills, soft_skills: analysis.softSkills,
      formatting_issues: analysis.formattingIssues, grammar_issues: analysis.grammarIssues, raw_analysis: analysis,
    }, { onConflict: "resume_id" }).select().single();

    if (dbError) return NextResponse.json({ success: false, error: "Failed to save analysis" }, { status: 500 });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 });
  }
}
