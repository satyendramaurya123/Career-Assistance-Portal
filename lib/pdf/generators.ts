import { PDFReportBuilder, COLORS } from "./kit";
import { formatDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Resume Analysis                                                    */
/* ------------------------------------------------------------------ */

export interface ResumeAnalysisPDFData {
  overall_score: number;
  ats_score: number;
  readability_score: number;
  structure_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missing_keywords: string[];
  technical_skills: string[];
  soft_skills: string[];
  formatting_issues: string[];
  grammar_issues: string[];
  raw_analysis?: { summary?: string };
  created_at: string;
  resume_name?: string;
}

export async function generateResumeAnalysisPDF(data: ResumeAnalysisPDFData): Promise<Uint8Array> {
  const b = await PDFReportBuilder.create("Resume Analysis Report", data.resume_name ? `Resume: ${data.resume_name}` : undefined);
  b.keyValueRow("Generated on", formatDate(data.created_at));
  b.spacer(6);

  b.sectionTitle("Score Overview");
  b.scoreCard([
    { label: "Overall", value: data.overall_score },
    { label: "ATS", value: data.ats_score },
    { label: "Readability", value: data.readability_score },
    { label: "Structure", value: data.structure_score },
  ]);

  if (data.raw_analysis?.summary) {
    b.sectionTitle("AI Summary");
    b.paragraph(data.raw_analysis.summary);
  }

  b.sectionTitle("Strengths");
  b.bulletList(data.strengths, { bulletColor: COLORS.success, emptyText: "No strengths identified." });

  b.sectionTitle("Weaknesses");
  b.bulletList(data.weaknesses, { bulletColor: COLORS.danger, emptyText: "No weaknesses identified." });

  b.sectionTitle("Recommendations");
  b.bulletList(data.recommendations, { bulletColor: COLORS.warning, emptyText: "No recommendations." });

  b.sectionTitle("Technical Skills");
  b.badgeRow(data.technical_skills);

  b.sectionTitle("Soft Skills");
  b.badgeRow(data.soft_skills);

  b.sectionTitle("Missing Keywords");
  b.badgeRow(data.missing_keywords, { fill: undefined });

  if (data.formatting_issues?.length) {
    b.sectionTitle("Formatting Issues");
    b.bulletList(data.formatting_issues, { bulletColor: COLORS.danger });
  }
  if (data.grammar_issues?.length) {
    b.sectionTitle("Grammar Issues");
    b.bulletList(data.grammar_issues, { bulletColor: COLORS.danger });
  }

  return b.toBytes();
}

/* ------------------------------------------------------------------ */
/*  ATS Report                                                         */
/* ------------------------------------------------------------------ */

export interface ATSReportPDFData {
  ats_score: number;
  keyword_match_score: number;
  structure_score: number;
  readability_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  target_role?: string | null;
  recommendations: string[];
  raw_report?: { summary?: string };
  created_at: string;
}

export async function generateATSReportPDF(data: ATSReportPDFData): Promise<Uint8Array> {
  const b = await PDFReportBuilder.create("ATS Compatibility Report", data.target_role ? `Target Role: ${data.target_role}` : undefined);
  b.keyValueRow("Generated on", formatDate(data.created_at));
  b.spacer(6);

  b.sectionTitle("Score Overview");
  b.scoreCard([
    { label: "ATS Score", value: data.ats_score },
    { label: "Keyword Match", value: data.keyword_match_score },
    { label: "Structure", value: data.structure_score },
    { label: "Readability", value: data.readability_score },
  ]);

  if (data.raw_report?.summary) {
    b.sectionTitle("Summary");
    b.paragraph(data.raw_report.summary);
  }

  b.sectionTitle("Matched Keywords");
  b.badgeRow(data.matched_keywords, { fill: undefined });

  b.sectionTitle("Missing Keywords");
  b.badgeRow(data.missing_keywords, { fill: undefined });

  b.sectionTitle("Recommendations");
  b.bulletList(data.recommendations, { bulletColor: COLORS.warning });

  return b.toBytes();
}

/* ------------------------------------------------------------------ */
/*  Cover Letter                                                       */
/* ------------------------------------------------------------------ */

export interface CoverLetterPDFData {
  job_title: string;
  company_name: string;
  content: string;
  tone: string;
  created_at: string;
  applicant_name?: string | null;
}

export async function generateCoverLetterPDF(data: CoverLetterPDFData): Promise<Uint8Array> {
  const b = await PDFReportBuilder.create("Cover Letter", `${data.job_title} \u00b7 ${data.company_name}`);
  b.keyValueRow("Applicant", data.applicant_name || "—");
  b.keyValueRow("Tone", data.tone.charAt(0).toUpperCase() + data.tone.slice(1));
  b.keyValueRow("Generated on", formatDate(data.created_at));
  b.spacer(10);
  b.divider();

  for (const para of data.content.split(/\n{2,}/)) {
    if (para.trim()) b.paragraph(para.trim(), { size: 10.5 });
  }

  return b.toBytes();
}

/* ------------------------------------------------------------------ */
/*  Roadmap                                                             */
/* ------------------------------------------------------------------ */

export interface RoadmapPDFData {
  title: string;
  target_role: string;
  current_level?: string | null;
  estimated_completion?: string | null;
  weekly_plan: { week: number; title: string; tasks: string[]; skills: string[]; hours: number }[];
  monthly_plan: { month: number; title: string; goals: string[]; milestones: string[] }[];
  projects: { title: string; description: string; skills: string[]; difficulty: string; estimated_hours: number }[];
  created_at: string;
}

export async function generateRoadmapPDF(data: RoadmapPDFData): Promise<Uint8Array> {
  const b = await PDFReportBuilder.create(data.title || "Career Roadmap", `Target Role: ${data.target_role}`);
  b.keyValueRow("Current Level", data.current_level || "—");
  b.keyValueRow("Estimated Completion", data.estimated_completion || "—");
  b.keyValueRow("Generated on", formatDate(data.created_at));
  b.spacer(6);

  b.sectionTitle("Weekly Plan");
  for (const week of data.weekly_plan || []) {
    b.paragraph(`Week ${week.week}: ${week.title}  (${week.hours}h)`, { bold: true, size: 11 });
    if (week.tasks?.length) b.bulletList(week.tasks);
    if (week.skills?.length) b.badgeRow(week.skills);
    b.spacer(4);
  }

  b.sectionTitle("Monthly Plan");
  for (const month of data.monthly_plan || []) {
    b.paragraph(`Month ${month.month}: ${month.title}`, { bold: true, size: 11 });
    if (month.goals?.length) b.bulletList(month.goals);
    if (month.milestones?.length) b.bulletList(month.milestones, { bulletColor: COLORS.success });
    b.spacer(4);
  }

  if (data.projects?.length) {
    b.sectionTitle("Suggested Projects");
    for (const p of data.projects) {
      b.paragraph(`${p.title} (${p.difficulty}, ~${p.estimated_hours}h)`, { bold: true, size: 10.5 });
      b.paragraph(p.description, { color: COLORS.muted });
      if (p.skills?.length) b.badgeRow(p.skills);
      b.spacer(4);
    }
  }

  return b.toBytes();
}

/* ------------------------------------------------------------------ */
/*  LinkedIn Summary                                                    */
/* ------------------------------------------------------------------ */

export interface LinkedInSummaryPDFData {
  headline?: string | null;
  about_section?: string | null;
  skills: string[];
  recruiter_keywords: string[];
  created_at: string;
}

export async function generateLinkedInSummaryPDF(data: LinkedInSummaryPDFData): Promise<Uint8Array> {
  const b = await PDFReportBuilder.create("LinkedIn Summary", "Optimized profile content");
  b.keyValueRow("Generated on", formatDate(data.created_at));
  b.spacer(6);

  if (data.headline) {
    b.sectionTitle("Professional Headline");
    b.paragraph(data.headline, { bold: true, size: 12 });
  }

  if (data.about_section) {
    b.sectionTitle("About Section");
    for (const para of data.about_section.split(/\n{2,}/)) {
      if (para.trim()) b.paragraph(para.trim());
    }
  }

  b.sectionTitle("Suggested Skills");
  b.badgeRow(data.skills);

  b.sectionTitle("Recruiter Keywords");
  b.badgeRow(data.recruiter_keywords);

  return b.toBytes();
}
