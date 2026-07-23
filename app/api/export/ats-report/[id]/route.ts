import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateATSReportPDF } from "@/lib/pdf/generators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: report, error } = await supabase
      .from("ats_reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !report) return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });

    const pdfBytes = await generateATSReportPDF({
      ats_score: report.ats_score,
      keyword_match_score: report.keyword_match_score,
      structure_score: report.structure_score,
      readability_score: report.readability_score,
      matched_keywords: report.matched_keywords || [],
      missing_keywords: report.missing_keywords || [],
      target_role: report.target_role,
      recommendations: report.recommendations || [],
      raw_report: report.raw_report || {},
      created_at: report.created_at,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ats-report-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("ATS report PDF export error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
  }
}
