-- Row Level Security Policies
-- Run AFTER schema.sql

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true); END; $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Resumes
CREATE POLICY "resumes_select" ON public.resumes FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "resumes_insert" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_update" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "resumes_delete" ON public.resumes FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Resume Analysis
CREATE POLICY "ra_select" ON public.resume_analysis FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "ra_insert" ON public.resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ra_update" ON public.resume_analysis FOR UPDATE USING (auth.uid() = user_id);

-- Apply similar policies for all other tables
CREATE POLICY "ats_select" ON public.ats_reports FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "ats_insert" ON public.ats_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jm_select" ON public.job_matches FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "jm_insert" ON public.job_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sg_select" ON public.skill_gap_analysis FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "sg_insert" ON public.skill_gap_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rm_select" ON public.roadmaps FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "rm_insert" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rm_update" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "iv_select" ON public.interviews FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "iv_insert" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "iv_update" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ir_select" ON public.interview_results FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "ir_insert" ON public.interview_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cl_select" ON public.cover_letters FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cl_insert" ON public.cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cl_update" ON public.cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "li_select" ON public.linkedin_summaries FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "li_insert" ON public.linkedin_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_select" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cs_insert" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_update" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cs_delete" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cm_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cm_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "al_select" ON public.admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "al_insert" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin() AND auth.uid() = admin_id);

-- Storage
CREATE POLICY "resume_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resume_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resume_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
