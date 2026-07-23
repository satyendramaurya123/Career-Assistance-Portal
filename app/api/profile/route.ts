import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("profiles").select("*, users(email, full_name, avatar_url, role, created_at)").eq("user_id", user.id).single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { full_name, ...profileData } = body;
    const v = profileSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 });
    if (full_name) await supabase.from("users").update({ full_name }).eq("id", user.id);
    const { data, error } = await supabase.from("profiles").upsert({ user_id: user.id, ...profileData }, { onConflict: "user_id" }).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
