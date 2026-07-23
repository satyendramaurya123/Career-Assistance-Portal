"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useResumeStore } from "@/store/resume-store";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export default function ResumeUploadPage() {
  const { resumes, setResumes, addResume, isUploading, uploadProgress, setUploading, setUploadProgress, removeResume } = useResumeStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/resume/list").then((r) => r.json()).then((res) => { if (res.success) setResumes(res.data); });
  }, [setResumes]);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 10, 85)), 200);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
      clearInterval(interval); setUploadProgress(100);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      addResume(data.data);
      setSelectedFile(null);
      if (data.warning) toast.warning(data.warning); else toast.success("Resume uploaded successfully!");
    } catch (err) {
      clearInterval(interval);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/resume/list", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.success) { removeResume(id); toast.success("Resume deleted"); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Resume Upload</h1><p className="text-muted-foreground mt-1">Upload your resume (PDF) to unlock AI-powered analysis</p></div>

      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : selectedFile ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"}`}
          >
            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {selectedFile ? (
              <div className="space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-semibold text-green-700 dark:text-green-400">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-muted-foreground">Choose different file</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div><p className="font-semibold">Drop your resume here</p><p className="text-sm text-muted-foreground mt-1">or <span className="text-primary">browse to upload</span></p></div>
                <p className="text-xs text-muted-foreground">PDF only · Max 10MB</p>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Uploading...</span><span className="font-medium">{uploadProgress}%</span></div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {selectedFile && !isUploading && (
            <div className="mt-4">
              <Button className="w-full" onClick={handleUpload}><Upload className="w-4 h-4" />Upload Resume</Button>
            </div>
          )}
          {isUploading && <div className="mt-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Tips for best results</p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
            {["Use a text-based PDF (not a scanned image)", "Ensure your resume is up-to-date", "Standard sections (Experience, Education, Skills) improve accuracy", "Avoid graphics-heavy templates that confuse ATS systems"].map((tip) => (
              <li key={tip} className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Your Resumes</CardTitle><CardDescription>Manage your uploaded resumes</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {resumes.map((resume) => (
              <div key={resume.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-red-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{resume.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(resume.file_size)} · {formatRelativeTime(resume.created_at)}</p>
                </div>
                <Badge variant={resume.status === "COMPLETED" ? "success" : resume.status === "FAILED" ? "destructive" : "secondary"} className="text-xs gap-1">
                  {resume.status === "COMPLETED" ? <><CheckCircle className="w-3 h-3" />Ready</> : resume.status === "FAILED" ? <><AlertCircle className="w-3 h-3" />Failed</> : <><RefreshCw className="w-3 h-3 animate-spin" />Processing</>}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(resume.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {resumes.some((r) => r.status === "COMPLETED") && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-4">
            <p className="font-medium mb-3">Next Steps</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[{ title: "Analyze Resume", href: "/resume-analysis" }, { title: "Check ATS Score", href: "/ats-score" }, { title: "Find Job Matches", href: "/job-match" }, { title: "Generate Cover Letter", href: "/cover-letter" }].map((step) => (
                <Button key={step.href} variant="outline" size="sm" asChild className="justify-between">
                  <Link href={step.href}>{step.title} <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
