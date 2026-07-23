import { getGeminiModel, getGeminiProModel } from "./client";
import {
  RESUME_ANALYSIS_PROMPT, ATS_SCORE_PROMPT, JOB_MATCH_PROMPT, SKILL_GAP_PROMPT,
  ROADMAP_PROMPT, INTERVIEW_QUESTIONS_PROMPT, INTERVIEW_EVALUATION_PROMPT,
  COVER_LETTER_PROMPT, LINKEDIN_SUMMARY_PROMPT, CAREER_CHAT_SYSTEM_PROMPT,
} from "./prompts";
import { extractJsonFromText, parseJsonSafe } from "@/lib/utils";

export async function analyzeResume(text: string) {
  const result = await getGeminiModel().generateContent(RESUME_ANALYSIS_PROMPT(text));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    score: 0, atsScore: 0, readabilityScore: 0, structureScore: 0,
    strengths: [], weaknesses: [], recommendations: [], missingKeywords: [],
    technicalSkills: [], softSkills: [], formattingIssues: [], grammarIssues: [], summary: "",
  });
}

export async function generateATSScore(text: string, role?: string) {
  const result = await getGeminiModel().generateContent(ATS_SCORE_PROMPT(text, role));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    atsScore: 0, keywordMatchScore: 0, structureScore: 0, readabilityScore: 0,
    matchedKeywords: [], missingKeywords: [], recommendations: [], summary: "",
  });
}

export async function generateJobMatch(text: string, role: string, level: string, location: string, jd?: string) {
  const result = await getGeminiModel().generateContent(JOB_MATCH_PROMPT(text, role, level, location, jd));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    matchPercentage: 0, jobTitle: role, matchedSkills: [], missingSkills: [],
    recommendedSkills: [], insights: [], summary: "",
  });
}

export async function generateSkillGap(text: string, role: string, skills?: string[]) {
  const result = await getGeminiProModel().generateContent(SKILL_GAP_PROMPT(text, role, skills));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    currentSkills: [], requiredSkills: [], missingSkills: [], learningPriorities: [],
    recommendedResources: [], estimatedLearningTime: "Unknown", summary: "",
  });
}

export async function generateRoadmap(role: string, level: string, hours: number, text?: string) {
  const result = await getGeminiProModel().generateContent(ROADMAP_PROMPT(role, level, hours, text));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    title: `Roadmap to ${role}`, weeklyPlan: [], monthlyPlan: [],
    resources: [], projects: [], estimatedCompletion: "Unknown",
  });
}

export async function generateInterviewQuestions(role: string, type: string, n: number) {
  const result = await getGeminiProModel().generateContent(INTERVIEW_QUESTIONS_PROMPT(role, type, n));
  return parseJsonSafe<{ questions: unknown[] }>(extractJsonFromText(result.response.text()), { questions: [] });
}

export async function evaluateInterview(qas: { question: string; answer: string }[]) {
  const result = await getGeminiProModel().generateContent(INTERVIEW_EVALUATION_PROMPT(qas));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    overallScore: 0, communicationScore: 0, technicalScore: 0, confidenceScore: 0,
    feedback: "", improvements: [], strengths: [], questionEvaluations: [],
  });
}

export async function generateCoverLetter(title: string, company: string, text: string, jd: string, tone: string) {
  const result = await getGeminiProModel().generateContent(COVER_LETTER_PROMPT(title, company, text, jd, tone));
  return result.response.text();
}

export async function generateLinkedInSummary(text: string, role?: string, achievements?: string) {
  const result = await getGeminiProModel().generateContent(LINKEDIN_SUMMARY_PROMPT(text, role, achievements));
  return parseJsonSafe(extractJsonFromText(result.response.text()), {
    headline: "", aboutSection: "", skills: [], recruiterKeywords: [],
  });
}

export async function streamCareerChat(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  userMessage: string
) {
  const model = getGeminiModel();
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: CAREER_CHAT_SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "I'm CareerAI! How can I help you today?" }] },
      ...history,
    ],
    generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
  });
  return await chat.sendMessageStream(userMessage);
}
