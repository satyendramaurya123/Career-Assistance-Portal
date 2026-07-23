import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export function getGeminiModel(modelName = "gemini-2.5-flash") {
  return genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  });
}

export function getGeminiProModel() {
  // Note: gemini-2.5-pro has a 0 free-tier quota (Google requires billing enabled
  // for Pro-tier access). Using gemini-2.5-flash here instead so this works on a
  // free API key. If you enable billing later, you can change "gemini-2.5-flash"
  // below back to "gemini-2.5-pro" for higher-quality output on these features.
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings,
    generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
  });
}

export { genAI };
