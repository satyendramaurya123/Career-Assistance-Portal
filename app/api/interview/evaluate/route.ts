import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateInterview } from "@/lib/gemini/service";
import { aiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!aiRateLimit(user.id).success) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    const { interview_id, answers } = await request.json();
    if (!interview_id || !answers?.length) return NextResponse.json({ success: false, error: "interview_id and answers required" }, { status: 400 });

    const admin = createAdminClient();
    const { data: interview } = await admin.from("interviews").select("*").eq("id", interview_id).eq("user_id", user.id).single();
    if (!interview) return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });

    const evaluation = await evaluateInterview(answers.map((a: { question: string; answer: string }) => ({ question: a.question, answer: a.answer })));

    const scoredAnswers = answers.map((a: { question_id: string; question: string; answer: string }, i: number) => ({
      question_id: a.question_id, question: a.question, answer: a.answer,
      score: (evaluation.questionEvaluations as { score: number; feedback: string }[])[i]?.score || 0,
      feedback: (evaluation.questionEvaluations as { score: number; feedback: string }[])[i]?.feedback || "",
    }));

    const { data: saved } = await admin.from("interview_results").insert({
      interview_id, user_id: user.id, answers: scoredAnswers,
      overall_score: evaluation.overallScore, communication_score: evaluation.communicationScore,
      technical_score: evaluation.technicalScore, confidence_score: evaluation.confidenceScore,
      feedback: evaluation.feedback, improvements: evaluation.improvements,
      strengths: evaluation.strengths, raw_evaluation: evaluation, completed_at: new Date().toISOString(),
    }).select().single();

    await admin.from("interviews").update({ status: "COMPLETED" }).eq("id", interview_id);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Interview evaluate error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Evaluation failed" }, { status: 500 });
  }
}
