import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  if (data?.role !== "ADMIN") return null;
  return { user, admin };
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const from = (page - 1) * pageSize;

    let query = ctx.admin.from("users").select("*", { count: "exact" }).is("deleted_at", null);
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data, total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const { user_id, action } = await request.json();
    const updates: Record<string, unknown> = {};
    if (action === "suspend") updates.is_active = false;
    else if (action === "activate") updates.is_active = true;
    else if (action === "make_admin") updates.role = "ADMIN";
    else if (action === "remove_admin") updates.role = "USER";
    else return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    await ctx.admin.from("users").update(updates).eq("id", user_id);
    await ctx.admin.from("admin_logs").insert({ admin_id: ctx.user.id, action: `USER_${action.toUpperCase()}`, target_user_id: user_id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const { user_id } = await request.json();
    await ctx.admin.from("users").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", user_id);
    await ctx.admin.from("admin_logs").insert({ admin_id: ctx.user.id, action: "USER_DELETE", target_user_id: user_id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
}
