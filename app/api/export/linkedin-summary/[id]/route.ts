import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLinkedInSummaryPDF } from "@/lib/pdf/generators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: summary, error } = await supabase
      .from("linkedin_summaries")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !summary) return NextResponse.json({ success: false, error: "Summary not found" }, { status: 404 });

    const pdfBytes = await generateLinkedInSummaryPDF({
      headline: summary.headline,
      about_section: summary.about_section,
      skills: summary.skills || [],
      recruiter_keywords: summary.recruiter_keywords || [],
      created_at: summary.created_at,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="linkedin-summary-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("LinkedIn summary PDF export error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
  }
}
