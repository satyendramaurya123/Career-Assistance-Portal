"use client";
import { create } from "zustand";

interface Resume { id: string; file_name: string; file_size: number; status: string; created_at: string; extracted_text: string | null; is_primary: boolean; }

interface ResumeState {
  resumes: Resume[]; selectedResume: Resume | null; isUploading: boolean; uploadProgress: number;
  setResumes: (resumes: Resume[]) => void; addResume: (resume: Resume) => void;
  setSelectedResume: (resume: Resume | null) => void; setUploading: (v: boolean) => void;
  setUploadProgress: (v: number | ((prev: number) => number)) => void; removeResume: (id: string) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumes: [], selectedResume: null, isUploading: false, uploadProgress: 0,
  setResumes: (resumes) => set({ resumes }),
  addResume: (resume) => set((s) => ({ resumes: [resume, ...s.resumes] })),
  setSelectedResume: (selectedResume) => set({ selectedResume }),
  setUploading: (isUploading) => set({ isUploading }),
  setUploadProgress: (v) => set((s) => ({ uploadProgress: typeof v === "function" ? v(s.uploadProgress) : v })),
  removeResume: (id) => set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id), selectedResume: s.selectedResume?.id === id ? null : s.selectedResume })),
}));
