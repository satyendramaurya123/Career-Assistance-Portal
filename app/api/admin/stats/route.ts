import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
    if (userData?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [totalUsers, activeUsers, newUsers, resumes, newResumes, analyses, interviews, chats, logs] = await Promise.all([
      admin.from("users").select("id", { count: "exact" }).is("deleted_at", null),
      admin.from("users").select("id", { count: "exact" }).eq("is_active", true),
      admin.from("users").select("id", { count: "exact" }).gte("created_at", monthStart),
      admin.from("resumes").select("id", { count: "exact" }).is("deleted_at", null),
      admin.from("resumes").select("id", { count: "exact" }).gte("created_at", monthStart),
      admin.from("resume_analysis").select("id", { count: "exact" }),
      admin.from("interviews").select("id", { count: "exact" }),
      admin.from("chat_sessions").select("id", { count: "exact" }),
      admin.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    return NextResponse.json({ success: true, data: { stats: { totalUsers: totalUsers.count || 0, activeUsers: activeUsers.count || 0, newUsersThisMonth: newUsers.count || 0, uploadedResumes: resumes.count || 0, newResumesThisMonth: newResumes.count || 0, generatedReports: analyses.count || 0, interviewSessions: interviews.count || 0, chatSessions: chats.count || 0 }, recentLogs: logs.data || [] } });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
