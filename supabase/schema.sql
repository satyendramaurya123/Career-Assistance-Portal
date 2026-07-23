-- AI Career Assistant Platform - Database Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE resume_status AS ENUM ('UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE interview_type AS ENUM ('HR', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN');
CREATE TYPE interview_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- USERS
CREATE TABLE public.users (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL UNIQUE, full_name TEXT, avatar_url TEXT, role user_role NOT NULL DEFAULT 'USER', is_active BOOLEAN NOT NULL DEFAULT true, is_email_verified BOOLEAN NOT NULL DEFAULT false, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- PROFILES
CREATE TABLE public.profiles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE, headline TEXT, bio TEXT, location TEXT, phone TEXT, website_url TEXT, linkedin_url TEXT, github_url TEXT, years_of_experience INTEGER DEFAULT 0, "current_role" TEXT, target_role TEXT, skills TEXT[] DEFAULT '{}', industries TEXT[] DEFAULT '{}', education JSONB DEFAULT '[]', experience JSONB DEFAULT '[]', certifications JSONB DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- RESUMES
CREATE TABLE public.resumes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, file_name TEXT NOT NULL, file_path TEXT NOT NULL, file_size INTEGER NOT NULL, file_url TEXT, extracted_text TEXT, status resume_status NOT NULL DEFAULT 'UPLOADING', is_primary BOOLEAN DEFAULT false, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

-- RESUME_ANALYSIS
CREATE TABLE public.resume_analysis (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE UNIQUE, overall_score INTEGER, ats_score INTEGER, readability_score INTEGER, structure_score INTEGER, strengths TEXT[] DEFAULT '{}', weaknesses TEXT[] DEFAULT '{}', recommendations TEXT[] DEFAULT '{}', missing_keywords TEXT[] DEFAULT '{}', technical_skills TEXT[] DEFAULT '{}', soft_skills TEXT[] DEFAULT '{}', formatting_issues TEXT[] DEFAULT '{}', grammar_issues TEXT[] DEFAULT '{}', raw_analysis JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_resume_analysis_user_id ON public.resume_analysis(user_id);

-- ATS_REPORTS
CREATE TABLE public.ats_reports (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE, ats_score INTEGER, keyword_match_score INTEGER, structure_score INTEGER, readability_score INTEGER, matched_keywords TEXT[] DEFAULT '{}', missing_keywords TEXT[] DEFAULT '{}', target_role TEXT, recommendations TEXT[] DEFAULT '{}', raw_report JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_ats_reports_user_id ON public.ats_reports(user_id);

-- JOB_MATCHES
CREATE TABLE public.job_matches (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL, target_role TEXT NOT NULL, experience_level TEXT, location TEXT, match_percentage INTEGER, matched_skills TEXT[] DEFAULT '{}', missing_skills TEXT[] DEFAULT '{}', recommended_skills TEXT[] DEFAULT '{}', job_description TEXT, analysis JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- SKILL_GAP_ANALYSIS
CREATE TABLE public.skill_gap_analysis (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL, target_role TEXT NOT NULL, current_skills TEXT[] DEFAULT '{}', required_skills TEXT[] DEFAULT '{}', missing_skills TEXT[] DEFAULT '{}', learning_priorities JSONB DEFAULT '[]', recommended_resources JSONB DEFAULT '[]', estimated_learning_time TEXT, raw_analysis JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- ROADMAPS
CREATE TABLE public.roadmaps (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, title TEXT NOT NULL, target_role TEXT NOT NULL, current_level TEXT, weekly_plan JSONB DEFAULT '[]', monthly_plan JSONB DEFAULT '[]', resources JSONB DEFAULT '[]', projects JSONB DEFAULT '[]', estimated_completion TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

-- INTERVIEWS
CREATE TABLE public.interviews (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, title TEXT NOT NULL, target_role TEXT NOT NULL, interview_type interview_type NOT NULL DEFAULT 'HR', status interview_status NOT NULL DEFAULT 'PENDING', questions JSONB DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

-- INTERVIEW_RESULTS
CREATE TABLE public.interview_results (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, answers JSONB DEFAULT '[]', overall_score INTEGER, communication_score INTEGER, technical_score INTEGER, confidence_score INTEGER, feedback TEXT, improvements JSONB DEFAULT '[]', strengths JSONB DEFAULT '[]', raw_evaluation JSONB DEFAULT '{}', completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- COVER_LETTERS
CREATE TABLE public.cover_letters (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL, job_title TEXT NOT NULL, company_name TEXT NOT NULL, job_description TEXT, content TEXT NOT NULL, tone TEXT DEFAULT 'professional', version INTEGER DEFAULT 1, is_favorite BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

-- LINKEDIN_SUMMARIES
CREATE TABLE public.linkedin_summaries (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL, headline TEXT, about_section TEXT, skills TEXT[] DEFAULT '{}', recruiter_keywords TEXT[] DEFAULT '{}', is_active BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

-- CHAT_SESSIONS
CREATE TABLE public.chat_sessions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, title TEXT DEFAULT 'New Chat', context JSONB DEFAULT '{}', is_active BOOLEAN DEFAULT true, message_count INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- CHAT_MESSAGES
CREATE TABLE public.chat_messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, role message_role NOT NULL, content TEXT NOT NULL, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);

-- ADMIN_LOGS
CREATE TABLE public.admin_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, action TEXT NOT NULL, target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, target_resource TEXT, target_resource_id UUID, details JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
CREATE TRIGGER update_users_upd BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_resumes_upd BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- AUTO-CREATE USER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, is_email_verified) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url', 'USER', COALESCE((NEW.email_confirmed_at IS NOT NULL), false));
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']) ON CONFLICT (id) DO NOTHING;
