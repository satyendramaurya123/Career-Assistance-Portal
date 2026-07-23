import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateResumeAnalysisPDF } from "@/lib/pdf/generators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: analysis, error } = await supabase
      .from("resume_analysis")
      .select("*, resumes(file_name)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !analysis) return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });

    const pdfBytes = await generateResumeAnalysisPDF({
      overall_score: analysis.overall_score,
      ats_score: analysis.ats_score,
      readability_score: analysis.readability_score,
      structure_score: analysis.structure_score,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
      missing_keywords: analysis.missing_keywords || [],
      technical_skills: analysis.technical_skills || [],
      soft_skills: analysis.soft_skills || [],
      formatting_issues: analysis.formatting_issues || [],
      grammar_issues: analysis.grammar_issues || [],
      raw_analysis: analysis.raw_analysis || {},
      created_at: analysis.created_at,
      resume_name: analysis.resumes?.file_name,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-analysis-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Resume analysis PDF export error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
  }
}
