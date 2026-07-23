"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, Loader2, Brain, Tag, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

interface Resume { id: string; file_name: string; status: string; }
interface ATSReport { id: string; ats_score: number; keyword_match_score: number; structure_score: number; readability_score: number; matched_keywords: string[]; missing_keywords: string[]; target_role: string | null; recommendations: string[]; raw_report: { summary: string } }

export default function ATSScorePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [report, setReport] = useState<ATSReport | null>(null);
  const [history, setHistory] = useState<ATSReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/resume/list").then((r) => r.json()), fetch("/api/ats/generate").then((r) => r.json())]).then(([rRes, aRes]) => {
      if (rRes.success) { const c = rRes.data.filter((r: Resume) => r.status === "COMPLETED"); setResumes(c); if (c.length) setSelectedId(c[0].id); }
      if (aRes.success) setHistory(aRes.data);
    }).finally(() => setInit(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true); setReport(null);
    try {
      const res = await fetch("/api/ats/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume_id: selectedId, target_role: targetRole || undefined }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setReport(data.data); setHistory((p) => [data.data, ...p]);
      toast.success("ATS report generated!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/ats-report/${report.id}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ats-report-${report.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export PDF"); }
    finally { setExporting(false); }
  };

  const scoreColor = report ? (report.ats_score >= 80 ? "hsl(142,71%,45%)" : report.ats_score >= 60 ? "hsl(48,96%,53%)" : "hsl(0,84%,60%)") : "hsl(221,83%,53%)";

  if (init) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 rounded-xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">ATS Score</h1><p className="text-muted-foreground mt-1">Check how well your resume passes ATS filters</p></div>
        {report && <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label>Resume</Label>
            {resumes.length === 0 ? <p className="text-sm text-muted-foreground">No resumes. <a href="/resume-upload" className="text-primary hover:underline">Upload one</a></p> : (
              <Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.file_name}</SelectItem>)}</SelectContent></Select>
            )}
          </div>
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label>Target Role (optional)</Label>
            <Input placeholder="e.g. Senior Software Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !selectedId}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Brain className="w-4 h-4" />Generate Report</>}</Button>
        </CardContent>
      </Card>

      {loading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}

      {report && !loading && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">ATS Score</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={[{ value: report.ats_score }, { value: 100 - report.ats_score }]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} dataKey="value">
                  <Cell fill={scoreColor} /><Cell fill="hsl(var(--muted))" />
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="-mt-10"><p className={`text-4xl font-bold ${getScoreColor(report.ats_score)}`}>{report.ats_score}</p><p className="text-sm text-muted-foreground">{getScoreLabel(report.ats_score)}</p></div>
            </Card>
            <Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-base">Score Breakdown</CardTitle></CardHeader><CardContent className="space-y-4">
              {[{ name: "ATS Score", value: report.ats_score }, { name: "Keyword Match", value: report.keyword_match_score }, { name: "Structure", value: report.structure_score }, { name: "Readability", value: report.readability_score }].map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between"><p className="text-sm font-medium">{m.name}</p><span className={`text-lg font-bold ${getScoreColor(m.value)}`}>{m.value}%</span></div>
                  <Progress value={m.value} className="h-2" />
                </div>
              ))}
            </CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Matched Keywords<Badge variant="success" className="ml-auto">{report.matched_keywords.length}</Badge></CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{report.matched_keywords.map((k) => <Badge key={k} variant="success" className="text-xs">{k}</Badge>)}{report.matched_keywords.length === 0 && <p className="text-sm text-muted-foreground">No keywords matched</p>}</CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" />Missing Keywords<Badge variant="destructive" className="ml-auto">{report.missing_keywords.length}</Badge></CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{report.missing_keywords.map((k) => <Badge key={k} variant="destructive" className="text-xs">{k}</Badge>)}{report.missing_keywords.length === 0 && <p className="text-sm text-green-600 dark:text-green-400">All keywords present!</p>}</CardContent></Card>
          </div>

          {report.recommendations.length > 0 && <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4 text-blue-500" />ATS Optimization Tips</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-2">{report.recommendations.map((r, i) => <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"><BarChart3 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /><p className="text-sm">{r}</p></div>)}</CardContent></Card>}
          {report.raw_report?.summary && <Card className="bg-muted/30"><CardContent className="p-4"><p className="text-sm font-medium mb-1">AI Summary</p><p className="text-sm text-muted-foreground">{report.raw_report.summary}</p></CardContent></Card>}
        </div>
      )}

      {history.length > 0 && !report && !loading && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Recent ATS Reports</CardTitle></CardHeader><CardContent className="space-y-2">
          {history.slice(0, 5).map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setReport(h)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getScoreColor(h.ats_score)} bg-muted`}>{h.ats_score}</div>
              <div className="flex-1"><p className="text-sm font-medium">{h.target_role || "General ATS Check"}</p><p className="text-xs text-muted-foreground">Keyword Match: {h.keyword_match_score}%</p></div>
              <Badge variant={h.ats_score >= 80 ? "success" : h.ats_score >= 60 ? "warning" : "destructive"}>{getScoreLabel(h.ats_score)}</Badge>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
