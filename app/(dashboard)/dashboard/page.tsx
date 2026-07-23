"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, BarChart3, Briefcase, MessageSquareMore, TrendingUp, Upload, ArrowRight, Bot, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { getScoreColor, getScoreLabel, formatRelativeTime } from "@/lib/utils";

interface DashboardData {
  stats: { totalResumes: number; totalAnalyses: number; completedInterviews: number; totalInterviews: number; chatSessions: number; avgAtsScore: number; avgAnalysisScore: number; bestJobMatch: number };
  recentResumes: { id: string; file_name: string; created_at: string; status: string }[];
  recentJobMatches: { match_percentage: number; target_role: string; created_at: string }[];
  scoreTrends: { name: string; score: number; atsScore: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((res) => { if (res.success) setData(res.data); }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: "Resumes Uploaded", value: data?.stats.totalResumes ?? 0, icon: Upload, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", href: "/resume-upload" },
    { title: "Avg ATS Score", value: `${data?.stats.avgAtsScore ?? 0}%`, icon: BarChart3, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", href: "/ats-score" },
    { title: "Best Job Match", value: `${data?.stats.bestJobMatch ?? 0}%`, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", href: "/job-match" },
    { title: "Interviews Done", value: data?.stats.completedInterviews ?? 0, icon: MessageSquareMore, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", href: "/mock-interview" },
  ];

  const quickActions = [
    { title: "Analyze Resume", href: "/resume-analysis", icon: FileText, desc: "AI-powered review" },
    { title: "Check ATS Score", href: "/ats-score", icon: BarChart3, desc: "Optimize for ATS" },
    { title: "Match a Job", href: "/job-match", icon: Briefcase, desc: "See your fit %" },
    { title: "Find Skill Gaps", href: "/skill-gap", icon: TrendingUp, desc: "Learn what's missing" },
    { title: "Get a Roadmap", href: "/roadmap", icon: Map, desc: "Plan your path" },
    { title: "Chat with AI", href: "/ai-chat", icon: Bot, desc: "Career guidance" },
  ];

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <div className="grid lg:grid-cols-2 gap-6">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
    </div>
  );

  const isEmpty = !data || data.stats.totalResumes === 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="text-muted-foreground mt-1">Your career intelligence at a glance</p></div>

      {isEmpty && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload your first resume</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Start by uploading your resume to unlock AI-powered analysis, ATS scoring, and personalized career insights.</p>
          <Button asChild><Link href="/resume-upload"><Upload className="w-4 h-4" />Upload Resume</Link></Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>
                <div><p className="text-xs text-muted-foreground font-medium">{card.title}</p><p className="text-2xl font-bold mt-0.5">{card.value}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!isEmpty && data?.scoreTrends && data.scoreTrends.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Score Trends</CardTitle><CardDescription>Resume & ATS score over time</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.scoreTrends}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0}/></linearGradient>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="score" name="Overall" stroke="hsl(221,83%,53%)" fill="url(#sg)" strokeWidth={2} dot={{ r: 4 }} />
                <Area type="monotone" dataKey="atsScore" name="ATS" stroke="hsl(142,71%,45%)" fill="url(#ag)" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Jump into AI-powered tools</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary/30 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><action.icon className="w-4 h-4 text-primary" /></div>
                  <div className="min-w-0"><p className="text-sm font-medium leading-tight">{action.title}</p><p className="text-xs text-muted-foreground">{action.desc}</p></div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Resumes</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/resume-upload">View all <ArrowRight className="w-3 h-3" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentResumes && data.recentResumes.length > 0 ? data.recentResumes.map((resume) => (
              <div key={resume.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-red-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{resume.file_name}</p><p className="text-xs text-muted-foreground">{formatRelativeTime(resume.created_at)}</p></div>
                <Badge variant={resume.status === "COMPLETED" ? "success" : "secondary"} className="text-xs">{resume.status}</Badge>
              </div>
            )) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No resumes uploaded yet
                <div className="mt-3"><Button size="sm" asChild><Link href="/resume-upload"><Upload className="w-3 h-3" />Upload</Link></Button></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
