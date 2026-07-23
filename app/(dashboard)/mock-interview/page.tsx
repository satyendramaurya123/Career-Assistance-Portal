"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageSquareMore, Loader2, Brain, CheckCircle, Send, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getScoreColor } from "@/lib/utils";
import { interviewSchema, type InterviewSchema } from "@/lib/validations";

interface Question { id: string; question: string; type: string; difficulty: string; tips?: string[] }
interface Answer { question_id: string; question: string; answer: string }
interface Result { overall_score: number; communication_score: number; technical_score: number; confidence_score: number; feedback: string; improvements: string[]; strengths: string[] }

type Stage = "setup" | "interview" | "result";

export default function MockInterviewPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [interview, setInterview] = useState<{ id: string; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<InterviewSchema>({ resolver: zodResolver(interviewSchema), defaultValues: { interview_type: "HR", num_questions: 5 } });

  const onSetup = async (data: InterviewSchema) => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setInterview(json.data); setStage("interview"); setCurrentQ(0); setAnswers([]);
      toast.success("Interview started! Answer each question honestly.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to start interview"); }
    finally { setLoading(false); }
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) { toast.error("Please enter an answer"); return; }
    const q = interview!.questions[currentQ];
    setAnswers((prev) => [...prev, { question_id: q.id, question: q.question, answer: currentAnswer }]);
    setCurrentAnswer("");
    if (currentQ + 1 < interview!.questions.length) { setCurrentQ(currentQ + 1); }
    else { handleSubmitInterview([...answers, { question_id: q.id, question: q.question, answer: currentAnswer }]); }
  };

  const handleSubmitInterview = async (finalAnswers: Answer[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interview_id: interview!.id, answers: finalAnswers }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data); setStage("result");
      toast.success("Interview evaluated!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Evaluation failed"); }
    finally { setLoading(false); }
  };

  if (stage === "setup") return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">AI Mock Interview</h1><p className="text-muted-foreground mt-1">Practice with AI-generated questions and get detailed feedback</p></div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Setup Your Interview</CardTitle><CardDescription>Configure your practice interview session</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSetup)} className="space-y-4">
            <div className="space-y-1.5"><Label>Target Role *</Label><Input placeholder="e.g. Frontend Engineer" {...register("target_role")} />{errors.target_role && <p className="text-destructive text-xs">{errors.target_role.message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Interview Type</Label>
                <Select onValueChange={(v) => setValue("interview_type", v as InterviewSchema["interview_type"])} defaultValue="HR">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="HR">HR / Behavioral</SelectItem><SelectItem value="TECHNICAL">Technical</SelectItem><SelectItem value="BEHAVIORAL">Behavioral</SelectItem><SelectItem value="SYSTEM_DESIGN">System Design</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Number of Questions</Label>
                <Input type="number" min={3} max={20} defaultValue={5} {...register("num_questions", { valueAsNumber: true })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Questions…</> : <><MessageSquareMore className="w-4 h-4" />Start Interview</>}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (stage === "interview" && interview) {
    const q = interview.questions[currentQ];
    const progress = ((currentQ) / interview.questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Interview in Progress</h1>
          <Badge variant="secondary">Question {currentQ + 1} of {interview.questions.length}</Badge>
        </div>
        <div className="space-y-2"><div className="flex justify-between text-sm text-muted-foreground"><span>Progress</span><span>{Math.round(progress)}%</span></div><Progress value={progress} className="h-2" /></div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "destructive"}>{q.difficulty}</Badge>
              <Badge variant="outline">{q.type}</Badge>
            </div>
            <CardTitle className="text-base leading-relaxed mt-2">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {q.tips && q.tips.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">💡 Tips</p>
                {q.tips.map((tip, i) => <p key={i} className="text-xs text-blue-600 dark:text-blue-300">• {tip}</p>)}
              </div>
            )}
            <Textarea placeholder="Type your answer here..." rows={6} value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} className="resize-none" />
            <Button className="w-full" onClick={handleNextQuestion} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating…</> : currentQ + 1 === interview.questions.length ? <><CheckCircle className="w-4 h-4" />Submit & Evaluate</> : <><Send className="w-4 h-4" />Next Question</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "result" && result) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setStage("setup")}><ArrowLeft className="w-4 h-4" />New Interview</Button>
        <h1 className="text-2xl font-bold tracking-tight">Interview Results</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Overall", value: result.overall_score }, { label: "Communication", value: result.communication_score }, { label: "Technical", value: result.technical_score }, { label: "Confidence", value: result.confidence_score }].map((m) => (
          <Card key={m.label}><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground font-medium">{m.label}</p><p className={`text-4xl font-bold mt-1 ${getScoreColor(m.value)}`}>{m.value}</p><Progress value={m.value} className="h-1.5 mt-2" /></CardContent></Card>
        ))}
      </div>

      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Overall Feedback</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p></CardContent></Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Strengths</CardTitle></CardHeader><CardContent className="space-y-2">{result.strengths?.map((s, i) => <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><p className="text-sm">{s}</p></div>)}</CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-blue-500" />Areas to Improve</CardTitle></CardHeader><CardContent className="space-y-2">{result.improvements?.map((imp, i) => <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg"><span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span><p className="text-sm">{imp}</p></div>)}</CardContent></Card>
      </div>

      <Button className="w-full" onClick={() => { setStage("setup"); setResult(null); setAnswers([]); }}>
        <MessageSquareMore className="w-4 h-4" /> Start Another Interview
      </Button>
    </div>
  );

  return null;
}
