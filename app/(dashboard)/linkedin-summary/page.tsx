"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Brain, Copy, Check, Download } from "lucide-react";
import { Linkedin } from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { linkedInSchema, type LinkedInSchema } from "@/lib/validations";

interface LinkedInResult { id: string; headline: string | null; about_section: string | null; skills: string[]; recruiter_keywords: string[] }

export default function LinkedInSummaryPage() {
  const [result, setResult] = useState<LinkedInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LinkedInSchema>({ resolver: zodResolver(linkedInSchema) });

  const onSubmit = async (data: LinkedInSchema) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/linkedin-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      toast.success("LinkedIn summary generated!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Generation failed"); }
    finally { setLoading(false); }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field); toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/linkedin-summary/${result.id}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `linkedin-summary-${result.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export PDF"); }
    finally { setExporting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">LinkedIn Summary Generator</h1><p className="text-muted-foreground mt-1">Create an optimized LinkedIn profile that attracts recruiters</p></div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Generate LinkedIn Content</CardTitle><CardDescription>Uses your most recent resume as baseline</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target Role (optional)</Label>
              <Input placeholder="e.g. Product Manager, Data Scientist" {...register("target_role")} />
            </div>
            <div className="space-y-1.5">
              <Label>Key Achievements (optional)</Label>
              <Textarea placeholder="List your most impressive achievements — these will be highlighted in your summary…" rows={3} {...register("key_achievements")} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Brain className="w-4 h-4" />Generate LinkedIn Summary</>}</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>}

      {result && !loading && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>
          </div>
          {result.headline && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-600" />Professional Headline</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.headline!, "headline")}>{copiedField === "headline" ? <><Check className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-base font-medium">{result.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{result.headline.length}/220 characters</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result.about_section && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">About Section</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.about_section!, "about")}>{copiedField === "about" ? <><Check className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result.about_section}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {result.skills?.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Suggested Skills ({result.skills.length})</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">{result.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</CardContent>
              </Card>
            )}
            {result.recruiter_keywords?.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Recruiter Keywords ({result.recruiter_keywords.length})</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">{result.recruiter_keywords.map((k) => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}</CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
