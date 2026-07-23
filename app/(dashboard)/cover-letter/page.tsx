"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Loader2, Brain, Copy, Check, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { coverLetterSchema, type CoverLetterSchema } from "@/lib/validations";

interface CoverLetter { id: string; job_title: string; company_name: string; content: string; tone: string; created_at: string; }

export default function CoverLetterPage() {
  const [result, setResult] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CoverLetterSchema>({
    resolver: zodResolver(coverLetterSchema),
    defaultValues: { tone: "professional" },
  });

  const onSubmit = async (data: CoverLetterSchema) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/cover-letter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      toast.success("Cover letter generated!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Generation failed"); }
    finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!result) return;
    setExportingFormat(format);
    try {
      const res = await fetch(`/api/export/cover-letter/${result.id}?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `cover-letter-${result.id.slice(0, 8)}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error(`Failed to export ${format.toUpperCase()}`); }
    finally { setExportingFormat(null); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Cover Letter Generator</h1><p className="text-muted-foreground mt-1">Generate a professional cover letter tailored to any job</p></div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cover Letter Details</CardTitle><CardDescription>Uses your most recent resume as context</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input placeholder="e.g. Senior Frontend Developer" {...register("job_title")} />
                {errors.job_title && <p className="text-destructive text-xs">{errors.job_title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input placeholder="e.g. Google" {...register("company_name")} />
                {errors.company_name && <p className="text-destructive text-xs">{errors.company_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select onValueChange={(v) => setValue("tone", v as CoverLetterSchema["tone"])} defaultValue="professional">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Job Description (optional)</Label>
              <Textarea placeholder="Paste the job description for a more targeted cover letter…" rows={4} {...register("job_description")} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Brain className="w-4 h-4" />Generate Cover Letter</>}</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="h-64 rounded-xl bg-muted animate-pulse" />}

      {result && !loading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">{result.job_title} at {result.company_name}</CardTitle>
                <CardDescription className="mt-1">Tone: {result.tone} · Generated cover letter</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={exportingFormat !== null}>{exportingFormat === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}PDF</Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("docx")} disabled={exportingFormat !== null}>{exportingFormat === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}DOCX</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result.content}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
