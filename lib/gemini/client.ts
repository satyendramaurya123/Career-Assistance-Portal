import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export function getGeminiModel(modelName = "gemini-2.5-flash-lite") {
  return genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  });
}

export function getGeminiProModel() {
  // Note: gemini-2.5-pro is paid-tier only (Google requires billing enabled for
  // Pro-tier access as of April 2026). Using gemini-2.5-flash-lite here instead —
  // it has the highest free-tier daily quota of the available models, which
  // matters most for these AI-heavy features (skill gap, roadmap, interview,
  // cover letter, LinkedIn summary). If you enable billing later, you can change
  // "gemini-2.5-flash-lite" below to "gemini-2.5-pro" for higher-quality output.
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    safetySettings,
    generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  });
}

export { genAI };
