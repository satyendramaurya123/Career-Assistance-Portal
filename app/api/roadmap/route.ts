import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRoadmap } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";
import { roadmapSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const v = roadmapSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });

    const admin = createAdminClient();
    const { data: resume } = await admin.from("resumes").select("extracted_text").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
    const { target_role, current_level, available_hours_per_week } = v.data;
    const roadmapData = await generateRoadmap(target_role, current_level, available_hours_per_week, resume?.extracted_text);

    const { data: saved } = await admin.from("roadmaps").insert({
      user_id: user.id, title: roadmapData.title || `Roadmap to ${target_role}`, target_role, current_level,
      weekly_plan: roadmapData.weeklyPlan || [], monthly_plan: roadmapData.monthlyPlan || [],
      resources: roadmapData.resources || [], projects: roadmapData.projects || [],
      estimated_completion: roadmapData.estimatedCompletion || null, is_active: true,
    }).select().single();

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Roadmap error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Roadmap generation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data } = await supabase.from("roadmaps").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
