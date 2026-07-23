"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Plus, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/chat-store";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface ChatSession { id: string; title: string; message_count: number; updated_at: string }
interface ChatMessage { id: string; role: "USER" | "ASSISTANT"; content: string; created_at: string }

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then((res) => { if (res.success) setSessions(res.data || []); }).finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamContent]);

  const loadSession = async (id: string) => {
    setActiveSession(id);
    const res = await fetch(`/api/chat?session_id=${id}`);
    const data = await res.json();
    if (data.success) setMessages(data.data || []);
  };

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "USER", content: userMsg, created_at: new Date().toISOString() }]);
    setStreaming(true); setStreamContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, session_id: activeSession }),
      });

      if (!res.ok) throw new Error("Chat failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let sessionId = activeSession;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const dataText = line.trim().slice(6);
              const json = JSON.parse(dataText);
              if (json.text) { fullText += json.text; setStreamContent(fullText); }
              if (json.done) {
                sessionId = json.session_id;
                setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ASSISTANT", content: fullText, created_at: new Date().toISOString() }]);
                setStreamContent("");
                if (!activeSession && json.session_id) {
                  setActiveSession(json.session_id);
                  const sessRes = await fetch("/api/chat");
                  const sessData = await sessRes.json();
                  if (sessData.success) setSessions(sessData.data || []);
                } else {
                  setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, message_count: s.message_count + 2, updated_at: new Date().toISOString() } : s));
                }
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err) {
      toast.error("Chat failed. Please try again.");
      setStreamContent("");
    } finally { setStreaming(false); }
  };

  const handleNewChat = () => { setActiveSession(null); setMessages([]); setStreamContent(""); };

  const handleDeleteSession = async (id: string) => {
    await fetch("/api/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id }) });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession === id) { setActiveSession(null); setMessages([]); }
    toast.success("Chat deleted");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar */}
      <div className="w-64 hidden lg:flex flex-col gap-2">
        <Button onClick={handleNewChat} className="w-full"><Plus className="w-4 h-4" />New Chat</Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingSessions && <div className="text-center text-sm text-muted-foreground p-4">Loading chats…</div>}
          {sessions.map((session) => (
            <div key={session.id} className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer text-sm transition-colors ${activeSession === session.id ? "bg-accent" : "hover:bg-muted"}`} onClick={() => loadSession(session.id)}>
              <Bot className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0"><p className="truncate font-medium">{session.title || "New Chat"}</p><p className="text-xs text-muted-foreground">{formatRelativeTime(session.updated_at)}</p></div>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
          {sessions.length === 0 && !loadingSessions && <p className="text-center text-sm text-muted-foreground p-4">No chats yet. Start a conversation!</p>}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center"><Bot className="w-5 h-5 text-primary-foreground" /></div>
          <div><p className="font-semibold">CareerAI Assistant</p><p className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Online · Powered by Gemini</p></div>
          <Button variant="ghost" size="sm" className="ml-auto lg:hidden" onClick={handleNewChat}><Plus className="w-4 h-4" />New</Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && !streaming && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-8 h-8 text-primary" /></div>
              <div><p className="font-medium">How can I help your career today?</p><p className="text-sm mt-1">Ask me about resume tips, interview prep, career guidance, and more.</p></div>
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-sm">
                {["How do I improve my ATS score?","What skills should I learn for React?","Help me prepare for a behavioral interview","Review my career transition plan"].map((q) => (
                  <button key={q} className="text-left p-2.5 rounded-lg border text-xs hover:bg-accent transition-colors" onClick={() => { setInput(q); }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.role === "USER" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "USER" ? "bg-primary" : "bg-muted"}`}>
                  {msg.role === "USER" ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-foreground" />}
                </div>
                <div className={`max-w-[75%] rounded-xl p-3 text-sm leading-relaxed ${msg.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4" /></div>
                <div className="max-w-[75%] bg-muted rounded-xl p-3 text-sm">
                  {streamContent ? <pre className="whitespace-pre-wrap font-sans">{streamContent}<span className="animate-pulse">▌</span></pre> : <div className="flex gap-1.5 items-center p-1">{[0,1,2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input placeholder="Ask me anything about your career..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} disabled={streaming} className="flex-1" />
            <Button onClick={handleSend} disabled={streaming || !input.trim()} size="icon">{streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">AI responses may contain inaccuracies. Always verify important information.</p>
        </div>
      </Card>
    </div>
  );
}
