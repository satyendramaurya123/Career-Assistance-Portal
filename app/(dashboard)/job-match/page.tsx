"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Briefcase, Loader2, Brain, CheckCircle, XCircle, TrendingUp, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor, getScoreLabel } from "@/lib/utils";
import { jobMatchSchema, type JobMatchSchema } from "@/lib/validations";

interface JobMatch { id: string; target_role: string; match_percentage: number; matched_skills: string[]; missing_skills: string[]; recommended_skills: string[]; analysis: { insights: string[]; summary: string } }

export default function JobMatchPage() {
  const [result, setResult] = useState<JobMatch | null>(null);
  const [history, setHistory] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<JobMatchSchema>({ resolver: zodResolver(jobMatchSchema), defaultValues: { experience_level: "MID" } });

  useEffect(() => {
    fetch("/api/job-match").then((r) => r.json()).then((res) => { if (res.success) setHistory(res.data); }).finally(() => setLoadingHistory(false));
  }, []);

  const onSubmit = async (data: JobMatchSchema) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/job-match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data); setHistory((p) => [json.data, ...p]);
      toast.success("Job match analysis complete!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Job Match</h1><p className="text-muted-foreground mt-1">See how well your resume matches your target role</p></div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Match Configuration</CardTitle><CardDescription>Enter your target role details for an AI-powered match analysis</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Target Role *</Label>
                <Input placeholder="e.g. Senior Software Engineer" {...register("target_role")} />
                {errors.target_role && <p className="text-destructive text-xs">{errors.target_role.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Experience Level *</Label>
                <Select onValueChange={(v) => setValue("experience_level", v as JobMatchSchema["experience_level"])} defaultValue="MID">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[["ENTRY","Entry Level"],["MID","Mid Level"],["SENIOR","Senior"],["LEAD","Lead/Staff"],["EXECUTIVE","Executive"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location (optional)</Label>
                <Input placeholder="e.g. Remote, New York" {...register("location")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Job Description (optional)</Label>
              <Textarea placeholder="Paste the job description for more accurate matching…" rows={4} {...register("job_description")} />
              <p className="text-xs text-muted-foreground">Adding a job description significantly improves accuracy</p>
            </div>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Brain className="w-4 h-4" />Analyze Match</>}</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="grid lg:grid-cols-3 gap-6"><Skeleton className="h-64" /><Skeleton className="h-64 lg:col-span-2" /></div>}

      {result && !loading && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-4">Match Score</p>
              <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${result.match_percentage >= 80 ? "border-green-500" : result.match_percentage >= 60 ? "border-yellow-500" : "border-red-500"}`}>
                <div><p className={`text-3xl font-bold ${getScoreColor(result.match_percentage)}`}>{result.match_percentage}%</p><p className="text-xs text-muted-foreground">{getScoreLabel(result.match_percentage)}</p></div>
              </div>
              <p className="font-semibold mt-3">{result.target_role}</p>
            </Card>
            <Card className="lg:col-span-2"><CardHeader className="pb-3"><CardTitle className="text-base">Match Summary</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"><p className="text-2xl font-bold text-green-600">{result.matched_skills.length}</p><p className="text-xs text-muted-foreground mt-1">Matched Skills</p></div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg"><p className="text-2xl font-bold text-red-600">{result.missing_skills.length}</p><p className="text-xs text-muted-foreground mt-1">Missing Skills</p></div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"><p className="text-2xl font-bold text-blue-600">{result.recommended_skills.length}</p><p className="text-xs text-muted-foreground mt-1">Recommended</p></div>
              </div>
              {result.analysis?.insights && (
                <div className="space-y-2"><p className="text-sm font-medium">Key Insights</p>
                  {result.analysis.insights.map((insight, i) => <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />{insight}</div>)}
                </div>
              )}
            </CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Matched Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{result.matched_skills.map((s) => <Badge key={s} variant="success" className="text-xs">{s}</Badge>)}{result.matched_skills.length === 0 && <p className="text-sm text-muted-foreground">None matched</p>}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />Missing Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{result.missing_skills.map((s) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}{result.missing_skills.length === 0 && <p className="text-sm text-green-600 dark:text-green-400">No gaps!</p>}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />Recommended Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{result.recommended_skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</CardContent></Card>
          </div>

          {result.analysis?.summary && <Card className="bg-muted/30"><CardContent className="p-4"><p className="text-sm font-medium mb-1">AI Summary</p><p className="text-sm text-muted-foreground">{result.analysis.summary}</p></CardContent></Card>}
        </div>
      )}

      {!result && !loadingHistory && history.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Recent Matches</CardTitle></CardHeader><CardContent className="space-y-2">
          {history.slice(0, 5).map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setResult(h)}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${getScoreColor(h.match_percentage)} bg-muted`}>{h.match_percentage}%</div>
              <div className="flex-1"><p className="font-medium text-sm">{h.target_role}</p><p className="text-xs text-muted-foreground">{h.matched_skills.length} matched · {h.missing_skills.length} missing</p></div>
              <Badge variant={h.match_percentage >= 80 ? "success" : h.match_percentage >= 60 ? "warning" : "destructive"}>{getScoreLabel(h.match_percentage)}</Badge>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
