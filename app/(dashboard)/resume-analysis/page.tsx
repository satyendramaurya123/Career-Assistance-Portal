"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { Brain, Loader2, CheckCircle, XCircle, AlertTriangle, Lightbulb, Tag, Code2, Users, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

interface Resume { id: string; file_name: string; status: string; }
interface Analysis { id: string; overall_score: number; ats_score: number; readability_score: number; structure_score: number; strengths: string[]; weaknesses: string[]; recommendations: string[]; missing_keywords: string[]; technical_skills: string[]; soft_skills: string[]; formatting_issues: string[]; grammar_issues: string[]; raw_analysis: { summary: string } }

export default function ResumeAnalysisPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/resume/list").then((r) => r.json()).then((res) => {
      if (res.success) { const c = res.data.filter((r: Resume) => r.status === "COMPLETED"); setResumes(c); if (c.length) setSelectedId(c[0].id); }
    }).finally(() => setLoadingResumes(false));
  }, []);

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setLoading(true); setAnalysis(null);
    try {
      const res = await fetch("/api/resume/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume_id: selectedId }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAnalysis(data.data);
      toast.success("Analysis complete!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    if (!analysis) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/resume-analysis/${analysis.id}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `resume-analysis-${analysis.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export PDF"); }
    finally { setExporting(false); }
  };

  const scoreData = analysis ? [{ name: "Overall", score: analysis.overall_score }, { name: "ATS", score: analysis.ats_score }, { name: "Readability", score: analysis.readability_score }, { name: "Structure", score: analysis.structure_score }] : [];
  const radarData = analysis ? [{ subject: "ATS", score: analysis.ats_score }, { subject: "Structure", score: analysis.structure_score }, { subject: "Readability", score: analysis.readability_score }, { subject: "Keywords", score: Math.max(0, 100 - analysis.missing_keywords.length * 5) }, { subject: "Grammar", score: Math.max(0, 100 - analysis.grammar_issues.length * 10) }] : [];

  if (loadingResumes) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 rounded-xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Resume Analysis</h1><p className="text-muted-foreground mt-1">AI-powered resume evaluation with actionable insights</p></div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-sm font-medium">Select Resume</label>
            {resumes.length === 0 ? <p className="text-sm text-muted-foreground">No resumes found. <a href="/resume-upload" className="text-primary hover:underline">Upload one first</a></p> : (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Select a resume" /></SelectTrigger>
                <SelectContent>{resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.file_name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <Button onClick={handleAnalyze} disabled={loading || !selectedId}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Brain className="w-4 h-4" />Analyze with AI</>}</Button>
          {analysis && <Button variant="outline" onClick={handleAnalyze} disabled={loading}><RefreshCw className="w-4 h-4" />Re-analyze</Button>}
          {analysis && <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>}
        </CardContent>
      </Card>

      {loading && <div className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div><Skeleton className="h-64 rounded-xl" /></div>}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {scoreData.map((item) => (
              <Card key={item.name}><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">{item.name} Score</p>
                <p className={`text-4xl font-bold ${getScoreColor(item.score)}`}>{item.score}</p>
                <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(item.score)}</p>
                <Progress value={item.score} className="h-1.5 mt-2" />
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-base">Score Breakdown</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="score" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-base">Resume Profile</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="hsl(221,83%,53%)" fill="hsl(221,83%,53%)" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Strengths</CardTitle></CardHeader><CardContent className="space-y-2">
              {analysis.strengths.map((s, i) => <div key={i} className="flex items-start gap-2.5 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><p className="text-sm">{s}</p></div>)}
              {analysis.strengths.length === 0 && <p className="text-sm text-muted-foreground">No strengths identified</p>}
            </CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />Weaknesses</CardTitle></CardHeader><CardContent className="space-y-2">
              {analysis.weaknesses.map((w, i) => <div key={i} className="flex items-start gap-2.5 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg"><XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /><p className="text-sm">{w}</p></div>)}
              {analysis.weaknesses.length === 0 && <p className="text-sm text-muted-foreground">No weaknesses identified</p>}
            </CardContent></Card>
          </div>

          <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" />Recommendations</CardTitle><CardDescription>Actionable steps to improve your resume</CardDescription></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-2">
              {analysis.recommendations.map((rec, i) => <div key={i} className="flex items-start gap-2.5 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"><span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span><p className="text-sm">{rec}</p></div>)}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Code2 className="w-4 h-4 text-blue-500" />Technical Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.technical_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />Soft Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.soft_skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-red-500" />Missing Keywords</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{analysis.missing_keywords.map((k) => <Badge key={k} variant="destructive" className="text-xs">{k}</Badge>)}{analysis.missing_keywords.length === 0 && <p className="text-sm text-green-600 dark:text-green-400">All key terms present!</p>}</CardContent></Card>
          </div>

          {analysis.raw_analysis?.summary && <Card className="bg-muted/30"><CardContent className="p-4"><p className="text-sm font-medium mb-1">AI Summary</p><p className="text-sm text-muted-foreground">{analysis.raw_analysis.summary}</p></CardContent></Card>}
        </div>
      )}

      {!analysis && !loading && resumes.length > 0 && <div className="text-center py-16 text-muted-foreground"><Brain className="w-12 h-12 mx-auto mb-4 opacity-40" /><p className="font-medium">Select a resume and click Analyze</p><p className="text-sm mt-1">AI will evaluate your resume in about 15-30 seconds</p></div>}
    </div>
  );
}
