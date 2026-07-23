export type UserRole = "USER" | "ADMIN";
export type ResumeStatus = "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type InterviewType = "HR" | "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN";
export type InterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface User { id: string; email: string; full_name: string | null; avatar_url: string | null; role: UserRole; is_active: boolean; is_email_verified: boolean; last_login_at: string | null; created_at: string; updated_at: string }
export interface Profile { id: string; user_id: string; headline: string | null; bio: string | null; location: string | null; phone: string | null; website_url: string | null; linkedin_url: string | null; github_url: string | null; years_of_experience: number; current_role: string | null; target_role: string | null; skills: string[]; industries: string[]; created_at: string; updated_at: string }
export interface Resume { id: string; user_id: string; file_name: string; file_path: string; file_size: number; file_url: string | null; extracted_text: string | null; status: ResumeStatus; is_primary: boolean; metadata: Record<string, unknown>; created_at: string; updated_at: string }

export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; totalPages: number }
