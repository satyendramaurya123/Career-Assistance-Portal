import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoverLetterPDF } from "@/lib/pdf/generators";
import { generateCoverLetterDOCX } from "@/lib/docx/generators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const format = (request.nextUrl.searchParams.get("format") || "pdf").toLowerCase();
    if (format !== "pdf" && format !== "docx") {
      return NextResponse.json({ success: false, error: "format must be 'pdf' or 'docx'" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const [{ data: letter, error }, { data: profile }, { data: userRow }] = await Promise.all([
      supabase.from("cover_letters").select("*").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    ]);

    if (error || !letter) return NextResponse.json({ success: false, error: "Cover letter not found" }, { status: 404 });

    const applicantName = userRow?.full_name || profile?.headline || null;
    const payload = {
      job_title: letter.job_title,
      company_name: letter.company_name,
      content: letter.content,
      tone: letter.tone || "professional",
      created_at: letter.created_at,
      applicant_name: applicantName,
    };

    if (format === "docx") {
      const buffer = await generateCoverLetterDOCX(payload);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="cover-letter-${id.slice(0, 8)}.docx"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdfBytes = await generateCoverLetterPDF(payload);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cover-letter-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Cover letter export error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate document" }, { status: 500 });
  }
}
