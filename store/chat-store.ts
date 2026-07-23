"use client";
import { create } from "zustand";

interface ChatMessage { id: string; session_id: string; role: "USER" | "ASSISTANT"; content: string; created_at: string; }
interface ChatSession { id: string; title: string; message_count: number; updated_at: string; }

interface ChatState {
  sessions: ChatSession[]; activeSession: ChatSession | null; messages: ChatMessage[];
  isStreaming: boolean; streamingContent: string; isLoading: boolean;
  setSessions: (s: ChatSession[]) => void; addSession: (s: ChatSession) => void;
  setActiveSession: (s: ChatSession | null) => void; setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void; setStreaming: (v: boolean) => void;
  setStreamingContent: (v: string) => void; appendStreamingContent: (chunk: string) => void;
  setLoading: (v: boolean) => void; clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [], activeSession: null, messages: [], isStreaming: false, streamingContent: "", isLoading: false,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  setActiveSession: (activeSession) => set({ activeSession }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], streamingContent: "" }),
}));
