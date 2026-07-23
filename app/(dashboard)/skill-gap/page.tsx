"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TrendingUp, Loader2, Brain, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { skillGapSchema, type SkillGapSchema } from "@/lib/validations";

interface SkillGapResult { target_role: string; current_skills: string[]; required_skills: string[]; missing_skills: string[]; learning_priorities: { skill: string; priority: string; reason: string }[]; recommended_resources: { title: string; type: string; platform: string; duration: string; skill: string; url: string | null }[]; estimated_learning_time: string; raw_analysis: { summary: string } }

const PRIORITY_COLORS: Record<string, string> = { HIGH: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400", LOW: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" };
const RESOURCE_ICONS: Record<string, string> = { COURSE: "🎓", BOOK: "📚", VIDEO: "🎬", ARTICLE: "📄", PROJECT: "💻" };

export default function SkillGapPage() {
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SkillGapSchema>({ resolver: zodResolver(skillGapSchema) });

  const onSubmit = async (data: SkillGapSchema) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/skill-gap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data); toast.success("Skill gap analysis complete!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setLoading(false); }
  };

  const totalSkills = result?.required_skills?.length || 0;
  const matchedPct = totalSkills > 0 ? Math.round(((result?.current_skills?.length || 0) / totalSkills) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Skill Gap Analysis</h1><p className="text-muted-foreground mt-1">Identify what skills you need to land your target role</p></div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Analyze Your Skill Gap</CardTitle><CardDescription>Uses your most recent uploaded resume as baseline</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px] space-y-1.5">
              <Label>Target Role *</Label>
              <Input placeholder="e.g. Machine Learning Engineer" {...register("target_role")} />
              {errors.target_role && <p className="text-destructive text-xs">{errors.target_role.message}</p>}
            </div>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Brain className="w-4 h-4" />Analyze Gap</>}</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>}

      {result && !loading && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{result.current_skills?.length || 0}</p><p className="text-sm text-muted-foreground mt-1">Current Skills</p></CardContent></Card>
            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-600">{result.missing_skills?.length || 0}</p><p className="text-sm text-muted-foreground mt-1">Missing Skills</p></CardContent></Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-600">{result.estimated_learning_time || "TBD"}</p><p className="text-sm text-muted-foreground mt-1">Est. Learning Time</p></CardContent></Card>
          </div>

          <Card><CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Skill Coverage</span><span className="text-sm font-bold">{matchedPct}%</span></div>
            <Progress value={matchedPct} className="h-3" />
            <p className="text-xs text-muted-foreground">You have {result.current_skills?.length} of {result.required_skills?.length} required skills for {result.target_role}</p>
          </CardContent></Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Current Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{result.current_skills?.map((s) => <Badge key={s} variant="success" className="text-xs">{s}</Badge>)}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Missing Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{result.missing_skills?.map((s) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}</CardContent></Card>
          </div>

          {result.learning_priorities?.length > 0 && (
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />Learning Priorities</CardTitle></CardHeader><CardContent className="space-y-2">
              {result.learning_priorities.map((p) => (
                <div key={p.skill} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                  <Badge className={PRIORITY_COLORS[p.priority]}>{p.priority}</Badge>
                  <div><p className="text-sm font-medium">{p.skill}</p><p className="text-xs text-muted-foreground">{p.reason}</p></div>
                </div>
              ))}
            </CardContent></Card>
          )}

          {result.recommended_resources?.length > 0 && (
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" />Recommended Resources</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-3">
              {result.recommended_resources.map((res, i) => (
                <div key={i} className="p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{RESOURCE_ICONS[res.type] || "📌"}</span>
                      <div><p className="text-sm font-medium">{res.title}</p><p className="text-xs text-muted-foreground">{res.platform}{res.duration ? ` · ${res.duration}` : ""}</p><Badge variant="outline" className="text-xs mt-1">{res.skill}</Badge></div>
                    </div>
                    {res.url && <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><ExternalLink className="w-4 h-4" /></a>}
                  </div>
                </div>
              ))}
            </CardContent></Card>
          )}

          {result.raw_analysis?.summary && <Card className="bg-muted/30"><CardContent className="p-4"><p className="text-sm font-medium mb-1">AI Summary</p><p className="text-sm text-muted-foreground">{result.raw_analysis.summary}</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}
