"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User { id: string; email: string; full_name: string | null; avatar_url: string | null; role: string; is_active: boolean; }
interface Profile { id: string; user_id: string; headline: string | null; target_role: string | null; skills: string[]; }

interface AuthState {
  user: User | null; profile: Profile | null; isLoading: boolean; isAuthenticated: boolean;
  setUser: (user: User | null) => void; setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void; clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, profile: null, isLoading: true, isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, profile: null, isAuthenticated: false, isLoading: false }),
    }),
    { name: "auth-storage", storage: createJSONStorage(() => sessionStorage), partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
