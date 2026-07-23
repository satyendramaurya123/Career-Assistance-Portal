import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCoverLetter } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { coverLetterSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = coverLetterSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("id, extracted_text").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).single();
    if (!resume?.extracted_text) return NextResponse.json({ success: false, error: "Please upload a resume first" }, { status: 400 });

    const { job_title, company_name, job_description, tone } = v.data;
    const content = await generateCoverLetter(job_title, company_name, resume.extracted_text, job_description || "", tone);

    const { data: saved } = await admin.from("cover_letters").insert({
      user_id: user.id, resume_id: resume.id, job_title, company_name,
      job_description: job_description || null, content, tone, version: 1, is_favorite: false,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Cover letter error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Cover letter generation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data } = await supabase.from("cover_letters").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
