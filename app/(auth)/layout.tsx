import { Brain } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold">CareerAI</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Your AI-Powered Career Partner</h2>
          <p className="text-white/80 text-lg">Optimize your resume, ace interviews, and land your dream job with the power of AI.</p>
          <div className="space-y-3">
            {["AI Resume Analysis & ATS Optimization","Mock Interview with Real-time Feedback","Personalized Career Roadmaps","Skill Gap Analysis & Learning Paths","Cover Letter & LinkedIn Generator"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-white/90 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/60 text-sm">© 2026 CareerAI. All rights reserved.</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
              <span className="text-xl font-bold">CareerAI</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
