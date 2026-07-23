import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userRole={userData?.role || "USER"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={userData} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
