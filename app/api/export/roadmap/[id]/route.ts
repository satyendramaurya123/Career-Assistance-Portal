import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoadmapPDF } from "@/lib/pdf/generators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: roadmap, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !roadmap) return NextResponse.json({ success: false, error: "Roadmap not found" }, { status: 404 });

    const pdfBytes = await generateRoadmapPDF({
      title: roadmap.title,
      target_role: roadmap.target_role,
      current_level: roadmap.current_level,
      estimated_completion: roadmap.estimated_completion,
      weekly_plan: roadmap.weekly_plan || [],
      monthly_plan: roadmap.monthly_plan || [],
      projects: roadmap.projects || [],
      created_at: roadmap.created_at,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="roadmap-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Roadmap PDF export error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
  }
}
