"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, FileText, BarChart3, MessageSquare, Shield, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface AdminStats { totalUsers: number; activeUsers: number; newUsersThisMonth: number; uploadedResumes: number; newResumesThisMonth: number; generatedReports: number; interviewSessions: number; chatSessions: number }
interface AdminUser { id: string; email: string; full_name: string | null; role: string; is_active: boolean; created_at: string; last_login_at: string | null }

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, usersRes] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch(`/api/admin/users?page=${page}&search=${search}`).then((r) => r.json()),
    ]);
    if (statsRes.success) setStats(statsRes.data.stats);
    if (usersRes.success) { setUsers(usersRes.data); setTotal(usersRes.total); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [page, search]);

  const handleAction = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, action }) });
    const data = await res.json();
    if (data.success) { toast.success(`Action "${action}" applied`); loadData(); }
    else { toast.error(data.error); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This is irreversible.")) return;
    const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId }) });
    const data = await res.json();
    if (data.success) { toast.success("User deleted"); loadData(); }
  };

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { title: "Active Users", value: stats?.activeUsers ?? 0, icon: Users, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
    { title: "Resumes Uploaded", value: stats?.uploadedResumes ?? 0, icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { title: "AI Reports", value: stats?.generatedReports ?? 0, icon: BarChart3, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { title: "Interviews", value: stats?.interviewSessions ?? 0, icon: MessageSquare, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { title: "Chat Sessions", value: stats?.chatSessions ?? 0, icon: MessageSquare, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1><p className="text-muted-foreground mt-0.5">Platform management and analytics</p></div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={loadData}><RefreshCw className="w-4 h-4" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>
              <p className="text-2xl font-bold">{loading ? "…" : card.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">User Management ({total})</CardTitle>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users…" className="pl-9 w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-sm">{(user.full_name?.[0] || user.email[0]).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-xs">{user.role}</Badge>
                    <Badge variant={user.is_active ? "success" : "destructive"} className="text-xs">{user.is_active ? "Active" : "Suspended"}</Badge>
                    <p className="text-xs text-muted-foreground hidden md:block">{formatDate(user.created_at)}</p>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {user.is_active ? <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(user.id, "suspend")}>Suspend</Button> : <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(user.id, "activate")}>Activate</Button>}
                    {user.role === "USER" ? <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(user.id, "make_admin")}>Make Admin</Button> : <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(user.id, "remove_admin")}>Remove Admin</Button>}
                    <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDelete(user.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-muted-foreground py-8">No users found</p>}
            </div>
          )}

          {total > 20 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
