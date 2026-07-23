import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateATSScore } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const { resume_id, target_role } = await request.json();
    if (!resume_id) return NextResponse.json({ success: false, error: "resume_id is required" }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("extracted_text").eq("id", resume_id).eq("user_id", user.id).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });

    const report = await generateATSScore(resume.extracted_text, target_role);
    const { data: saved, error } = await admin.from("ats_reports").insert({
      user_id: user.id, resume_id, ats_score: report.atsScore, keyword_match_score: report.keywordMatchScore,
      structure_score: report.structureScore, readability_score: report.readabilityScore,
      matched_keywords: report.matchedKeywords, missing_keywords: report.missingKeywords,
      target_role: target_role || null, recommendations: report.recommendations, raw_report: report,
    }).select().single();

    if (error) return NextResponse.json({ success: false, error: "Failed to save report" }, { status: 500 });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("ATS error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to generate ATS report" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("ats_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
