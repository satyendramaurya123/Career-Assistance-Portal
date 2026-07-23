"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, Upload, FileText, BarChart3, Briefcase, TrendingUp, Map, MessageSquareMore, Mail, Bot, Shield, User, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Linkedin } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Resume", href: "/resume-upload", icon: Upload },
  { title: "Resume Analysis", href: "/resume-analysis", icon: FileText },
  { title: "ATS Score", href: "/ats-score", icon: BarChart3 },
  { title: "Job Match", href: "/job-match", icon: Briefcase },
  { title: "Skill Gap", href: "/skill-gap", icon: TrendingUp },
  { title: "Roadmap", href: "/roadmap", icon: Map },
  { title: "Mock Interview", href: "/mock-interview", icon: MessageSquareMore },
  { title: "Cover Letter", href: "/cover-letter", icon: Mail },
  { title: "LinkedIn Summary", href: "/linkedin-summary", icon: Linkedin },
  { title: "AI Chat", href: "/ai-chat", icon: Bot },
];

interface SidebarProps { userRole: string; }

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();

  const allItems = [...navItems, ...(userRole === "ADMIN" ? [{ title: "Admin Panel", href: "/admin", icon: Shield }] : []), { title: "Profile", href: "/profile", icon: User }];

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full border-r bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 lg:relative lg:z-auto",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && <span className="whitespace-nowrap font-bold text-lg overflow-hidden">CareerAI</span>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 hidden lg:flex" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
            {allItems.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              const link = (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", sidebarCollapsed && "justify-center px-2")}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
                </Link>
              );
              if (sidebarCollapsed) return (
                <Tooltip key={item.href}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{item.title}</TooltipContent></Tooltip>
              );
              return link;
            })}
          </nav>
        </TooltipProvider>
      </aside>
    </>
  );
}
