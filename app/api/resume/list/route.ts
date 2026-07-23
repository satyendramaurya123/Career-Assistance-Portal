import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("resumes").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await request.json();
    await supabase.from("resumes").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
