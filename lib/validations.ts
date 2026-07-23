import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

export const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  headline: z.string().max(220).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  website_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  years_of_experience: z.number().min(0).max(50),
  current_role: z.string().max(100).optional(),
  target_role: z.string().max(100).optional(),
  skills: z.array(z.string()).optional(),
});

export const jobMatchSchema = z.object({
  target_role: z.string().min(2, "Target role is required").max(100),
  experience_level: z.enum(["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"]),
  location: z.string().max(100).optional(),
  job_description: z.string().max(5000).optional(),
});

export const skillGapSchema = z.object({
  target_role: z.string().min(2, "Target role is required").max(100),
  current_skills: z.array(z.string()).optional(),
});

export const roadmapSchema = z.object({
  target_role: z.string().min(2, "Target role is required").max(100),
  current_level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  available_hours_per_week: z.number().min(1).max(80),
});

export const interviewSchema = z.object({
  target_role: z.string().min(2, "Target role is required").max(100),
  interview_type: z.enum(["HR", "TECHNICAL", "BEHAVIORAL", "SYSTEM_DESIGN"]),
  num_questions: z.number().min(3).max(20),
});

export const coverLetterSchema = z.object({
  job_title: z.string().min(2).max(100),
  company_name: z.string().min(2).max(100),
  job_description: z.string().max(5000).optional(),
  tone: z.enum(["professional", "friendly", "enthusiastic", "formal"]),
  resume_id: z.string().uuid().optional(),
});

export const linkedInSchema = z.object({
  target_role: z.string().max(100).optional(),
  resume_id: z.string().uuid().optional(),
  key_achievements: z.string().max(2000).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  session_id: z.string().uuid().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type ProfileSchema = z.infer<typeof profileSchema>;
export type JobMatchSchema = z.infer<typeof jobMatchSchema>;
export type SkillGapSchema = z.infer<typeof skillGapSchema>;
export type RoadmapSchema = z.infer<typeof roadmapSchema>;
export type InterviewSchema = z.infer<typeof interviewSchema>;
export type CoverLetterSchema = z.infer<typeof coverLetterSchema>;
export type LinkedInSchema = z.infer<typeof linkedInSchema>;
