import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const admin = createAdminClient();

    const [resumesRes, analysisRes, atsRes, jobMatchRes, interviewRes, chatRes, recentResumesRes] = await Promise.all([
      admin.from("resumes").select("id", { count: "exact" }).eq("user_id", user.id).is("deleted_at", null),
      admin.from("resume_analysis").select("overall_score, ats_score, created_at", { count: "exact" }).eq("user_id", user.id),
      admin.from("ats_reports").select("ats_score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      admin.from("job_matches").select("match_percentage, target_role, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      admin.from("interviews").select("id, status", { count: "exact" }).eq("user_id", user.id),
      admin.from("chat_sessions").select("id", { count: "exact" }).eq("user_id", user.id),
      admin.from("resumes").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(3),
    ]);

    const stats = {
      totalResumes: resumesRes.count || 0,
      totalAnalyses: analysisRes.count || 0,
      completedInterviews: interviewRes.data?.filter((i) => i.status === "COMPLETED").length || 0,
      totalInterviews: interviewRes.count || 0,
      chatSessions: chatRes.count || 0,
      avgAtsScore: atsRes.data?.length ? Math.round(atsRes.data.reduce((s, r) => s + (r.ats_score || 0), 0) / atsRes.data.length) : 0,
      avgAnalysisScore: analysisRes.data?.length ? Math.round(analysisRes.data.reduce((s, r) => s + (r.overall_score || 0), 0) / analysisRes.data.length) : 0,
      bestJobMatch: jobMatchRes.data?.length ? Math.max(...jobMatchRes.data.map((j) => j.match_percentage || 0)) : 0,
    };

    const scoreTrends = (analysisRes.data || []).slice(0, 8).reverse().map((a, i) => ({ name: `#${i + 1}`, score: a.overall_score, atsScore: a.ats_score }));

    return NextResponse.json({ success: true, data: { stats, recentResumes: recentResumesRes.data || [], recentJobMatches: jobMatchRes.data || [], scoreTrends } });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ success: false, error: "Failed to load dashboard" }, { status: 500 });
  }
}
