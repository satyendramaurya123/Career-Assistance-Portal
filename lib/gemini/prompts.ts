export const RESUME_ANALYSIS_PROMPT = (text: string) => `
You are an expert ATS specialist. Analyze this resume. Return ONLY valid JSON, no markdown.
Resume:
---
${text}
---
Return:
{"score":0,"atsScore":0,"readabilityScore":0,"structureScore":0,"strengths":[],"weaknesses":[],"recommendations":[],"missingKeywords":[],"technicalSkills":[],"softSkills":[],"formattingIssues":[],"grammarIssues":[],"summary":""}
`;

export const ATS_SCORE_PROMPT = (text: string, role?: string) => `
You are an ATS specialist. Analyze this resume for ATS compatibility${role ? ` targeting ${role}` : ""}. Return ONLY valid JSON.
Resume:
---
${text}
---
Return:
{"atsScore":0,"keywordMatchScore":0,"structureScore":0,"readabilityScore":0,"matchedKeywords":[],"missingKeywords":[],"recommendations":[],"summary":""}
`;

export const JOB_MATCH_PROMPT = (text: string, role: string, level: string, location: string, jd?: string) => `
You are a technical recruiter. Analyze this resume match for ${role} (${level}, ${location}). Return ONLY valid JSON.
Resume:
---
${text}
---
${jd ? `Job Description:\n${jd}` : ""}
Return:
{"matchPercentage":0,"jobTitle":"${role}","matchedSkills":[],"missingSkills":[],"recommendedSkills":[],"insights":[],"summary":""}
`;

export const SKILL_GAP_PROMPT = (text: string, role: string, skills?: string[]) => `
You are a career coach. Analyze the skill gap for ${role}. Return ONLY valid JSON.
Resume:
---
${text}
---
${skills?.length ? `Additional skills: ${skills.join(", ")}` : ""}
Return:
{"currentSkills":[],"requiredSkills":[],"missingSkills":[],"learningPriorities":[{"skill":"","priority":"HIGH","reason":""}],"recommendedResources":[{"title":"","type":"COURSE","url":null,"platform":"","duration":"","skill":""}],"estimatedLearningTime":"","summary":""}
`;

export const ROADMAP_PROMPT = (role: string, level: string, hours: number, text?: string) => `
You are a career coach. Create a learning roadmap for ${role} (${level}, ${hours}h/week). Return ONLY valid JSON.
${text ? `Background:\n---\n${text}\n---` : ""}
Return:
{"title":"Roadmap to ${role}","weeklyPlan":[{"week":1,"title":"","tasks":[],"skills":[],"hours":0}],"monthlyPlan":[{"month":1,"title":"","goals":[],"milestones":[]}],"resources":[{"title":"","type":"COURSE","url":null,"platform":"","duration":"","skill":""}],"projects":[{"title":"","description":"","skills":[],"difficulty":"BEGINNER","estimated_hours":0}],"estimatedCompletion":""}
Generate at least 8 weeks, 3 months.
`;

export const INTERVIEW_QUESTIONS_PROMPT = (role: string, type: string, n: number) => `
Generate ${n} ${type} interview questions for ${role}. Return ONLY valid JSON.
Return:
{"questions":[{"id":"q1","question":"","type":"${type}","difficulty":"MEDIUM","expected_answer":"","tips":[]}]}
`;

export const INTERVIEW_EVALUATION_PROMPT = (qas: { question: string; answer: string }[]) => `
Evaluate these interview answers. Return ONLY valid JSON.
${qas.map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`).join("\n\n")}
Return:
{"overallScore":0,"communicationScore":0,"technicalScore":0,"confidenceScore":0,"feedback":"","improvements":[],"strengths":[],"questionEvaluations":[{"questionId":"q1","score":0,"feedback":""}]}
`;

export const COVER_LETTER_PROMPT = (title: string, company: string, text: string, jd: string, tone: string) => `
Write a ${tone} cover letter for ${title} at ${company}. Use the resume and job description below.
Resume:
---
${text}
---
${jd ? `Job Description:\n${jd}` : ""}
Output ONLY the cover letter text. Include date, salutation, 3-4 body paragraphs, and closing.
`;

export const LINKEDIN_SUMMARY_PROMPT = (text: string, role?: string, achievements?: string) => `
Create an optimized LinkedIn profile from this resume. Return ONLY valid JSON.
Resume:
---
${text}
---
${role ? `Target Role: ${role}` : ""}${achievements ? `\nKey Achievements: ${achievements}` : ""}
Return:
{"headline":"","aboutSection":"","skills":[],"recruiterKeywords":[]}
`;

export const CAREER_CHAT_SYSTEM_PROMPT = `You are CareerAI, an expert AI career assistant. You help with resume writing, ATS optimization, interview prep, job search strategies, LinkedIn profiles, skill development, salary negotiation, and career transitions. Be concise, actionable, and encouraging.`;
