"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Map, Loader2, Brain, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roadmapSchema, type RoadmapSchema } from "@/lib/validations";

interface WeeklyPlan { week: number; title: string; tasks: string[]; skills: string[]; hours: number }
interface MonthlyPlan { month: number; title: string; goals: string[]; milestones: string[] }
interface Project { title: string; description: string; skills: string[]; difficulty: string; estimated_hours: number }
interface RoadmapResult { id: string; title: string; target_role: string; estimated_completion: string | null; weekly_plan: WeeklyPlan[]; monthly_plan: MonthlyPlan[]; projects: Project[] }

const DIFF_COLORS: Record<string, string> = { BEGINNER: "success", INTERMEDIATE: "warning", ADVANCED: "destructive" };

export default function RoadmapPage() {
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(1);
  const [exporting, setExporting] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RoadmapSchema>({ resolver: zodResolver(roadmapSchema), defaultValues: { current_level: "BEGINNER", available_hours_per_week: 10 } });

  const onSubmit = async (data: RoadmapSchema) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data); toast.success("Roadmap generated!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Generation failed"); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/roadmap/${result.id}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `roadmap-${result.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export PDF"); }
    finally { setExporting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">AI Roadmap Generator</h1><p className="text-muted-foreground mt-1">Get a personalized learning roadmap to reach your career goal</p></div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Configure Your Roadmap</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Target Role *</Label>
              <Input placeholder="e.g. Full Stack Developer" {...register("target_role")} />
              {errors.target_role && <p className="text-destructive text-xs">{errors.target_role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Current Level</Label>
              <Select onValueChange={(v) => setValue("current_level", v as RoadmapSchema["current_level"])} defaultValue="BEGINNER">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="BEGINNER">Beginner</SelectItem><SelectItem value="INTERMEDIATE">Intermediate</SelectItem><SelectItem value="ADVANCED">Advanced</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hours/Week</Label>
              <Input type="number" min={1} max={80} defaultValue={10} {...register("available_hours_per_week", { valueAsNumber: true })} />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Brain className="w-4 h-4" />Generate Roadmap</>}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>}

      {result && !loading && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div><h2 className="text-xl font-bold">{result.title}</h2><p className="text-muted-foreground text-sm mt-1">Target: <strong>{result.target_role}</strong></p></div>
              <div className="flex items-center gap-3">
                {result.estimated_completion && <Badge variant="secondary" className="text-sm px-4 py-2">⏱ {result.estimated_completion}</Badge>}
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Map className="w-4 h-4 text-blue-500" />Weekly Plan</CardTitle><CardDescription>{result.weekly_plan?.length || 0} weeks</CardDescription></CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {result.weekly_plan?.map((week) => (
                  <div key={week.week} className="border rounded-lg overflow-hidden">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left" onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}>
                      <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">{week.week}</span><div><p className="text-sm font-medium">{week.title}</p><p className="text-xs text-muted-foreground">{week.hours}h · {week.skills?.length} skills</p></div></div>
                      {expandedWeek === week.week ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedWeek === week.week && (
                      <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
                        {week.tasks?.length > 0 && <div className="mt-2"><p className="text-xs font-medium mb-1 text-muted-foreground">Tasks</p>{week.tasks.map((t, i) => <p key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground">• {t}</p>)}</div>}
                        {week.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{week.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Map className="w-4 h-4 text-purple-500" />Monthly Plan</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.monthly_plan?.map((month) => (
                  <div key={month.month} className="border rounded-lg overflow-hidden">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left" onClick={() => setExpandedMonth(expandedMonth === month.month ? null : month.month)}>
                      <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">M{month.month}</span><p className="text-sm font-medium">{month.title}</p></div>
                      {expandedMonth === month.month ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedMonth === month.month && (
                      <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
                        {month.goals?.length > 0 && <div className="mt-2"><p className="text-xs font-medium mb-1 text-muted-foreground">Goals</p>{month.goals.map((g, i) => <p key={i} className="text-xs text-muted-foreground">• {g}</p>)}</div>}
                        {month.milestones?.length > 0 && <div><p className="text-xs font-medium mb-1 text-muted-foreground">Milestones</p>{month.milestones.map((m, i) => <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">✓ {m}</p>)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {result.projects?.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Suggested Projects</CardTitle><CardDescription>Hands-on projects to build your portfolio</CardDescription></CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.projects.map((p, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium text-sm">{p.title}</p><Badge variant={DIFF_COLORS[p.difficulty] as "success" | "warning" | "destructive"} className="text-xs flex-shrink-0">{p.difficulty}</Badge></div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="flex items-center justify-between"><div className="flex flex-wrap gap-1">{p.skills?.slice(0, 3).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div><span className="text-xs text-muted-foreground">{p.estimated_hours}h</span></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
