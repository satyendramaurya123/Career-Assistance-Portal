import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Target, TrendingUp, MessageSquare, Award, ArrowRight, CheckCircle, Zap, Shield, Star } from "lucide-react";

const features = [
  { icon: FileText, title: "Resume Analyzer", desc: "AI-powered resume analysis with ATS scoring, strengths, weaknesses, and actionable recommendations.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: Target, title: "ATS Score", desc: "Get your resume's ATS compatibility score with keyword matching, structure analysis, and optimization tips.", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  { icon: TrendingUp, title: "Job Match", desc: "Compare your resume against target roles and get a match percentage with missing skill recommendations.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { icon: Brain, title: "Skill Gap Analysis", desc: "Identify skill gaps between your current profile and target job requirements with learning resources.", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { icon: Award, title: "AI Mock Interview", desc: "Practice with AI-generated interview questions, submit answers, and get detailed feedback and scoring.", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { icon: MessageSquare, title: "Career Chatbot", desc: "Chat with your personal AI career advisor for resume tips, job search guidance, and career coaching.", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareerAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign In</Link></Button>
            <Button asChild><Link href="/register">Get Started <ArrowRight className="w-4 h-4" /></Link></Button>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Powered by Google Gemini AI
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Land Your Dream Job with{" "}
            <span className="text-primary">AI Career Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Optimize your resume, ace interviews, close skill gaps, and navigate your career path with AI-powered insights tailored just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/register">Start Free Today <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {["No credit card required", "Free to get started"].map((t) => (
              <div key={t} className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />{t}</div>
            ))}
            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" />Enterprise security</div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[["50K+","Resumes Analyzed"],["10K+","Interview Questions"],["25K+","Career Roadmaps"],["94%","Success Rate"]].map(([v, l]) => (
            <div key={l}><div className="text-3xl font-bold text-primary">{v}</div><div className="text-sm text-muted-foreground mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Advance Your Career</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A complete AI-powered suite of tools to optimize your job search, preparation, and career development.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border p-6 hover:shadow-md transition-shadow bg-card">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">Loved by Job Seekers</h2></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "CareerAI helped me optimize my resume and I landed interviews at 3 FAANG companies within a week!", name: "Sarah K.", role: "Software Engineer" },
              { quote: "The mock interview feature is incredible. It prepared me perfectly and I got the job on my first try.", name: "Marcus T.", role: "Product Manager" },
              { quote: "My ATS score went from 45% to 92% after following the recommendations. Game changer!", name: "Priya M.", role: "Data Scientist" },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-xl border p-6">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-sm text-muted-foreground mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div><p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Accelerate Your Career?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of professionals using AI to land better jobs faster.</p>
          <Button size="lg" className="text-base px-10" asChild>
            <Link href="/register">Get Started Free <ArrowRight className="w-5 h-5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center"><Brain className="w-4 h-4 text-primary-foreground" /></div>
            <span className="font-semibold">CareerAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
