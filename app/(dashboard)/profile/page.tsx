"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { profileSchema, type ProfileSchema } from "@/lib/validations";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileSchema>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((res) => {
      if (res.success && res.data) {
        const { users, skills: s, ...profile } = res.data;
        reset({ full_name: users?.full_name || "", ...profile });
        setSkills(s || []);
      }
    }).finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileSchema) => {
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, skills }) });
    const json = await res.json();
    if (json.success) { toast.success("Profile updated!"); }
    else { toast.error(json.error || "Update failed"); }
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) { setSkills([...skills, skillInput.trim()]); }
    setSkillInput("");
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Profile</h1><p className="text-muted-foreground mt-1">Manage your career profile and preferences</p></div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Personal Information</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input placeholder="John Doe" {...register("full_name")} />
              {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Professional Headline</Label>
              <Input placeholder="Senior Software Engineer at Google" {...register("headline")} />
            </div>
            <div className="space-y-1.5">
              <Label>Current Role</Label>
              <Input placeholder="Software Engineer" {...register("current_role")} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Role</Label>
              <Input placeholder="Senior Software Engineer" {...register("target_role")} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 (555) 000-0000" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Input type="number" min={0} max={50} {...register("years_of_experience", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea placeholder="Tell us about yourself..." rows={3} {...register("bio")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Online Presence</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Website</Label><Input placeholder="https://yoursite.com" {...register("website_url")} /></div>
            <div className="space-y-1.5"><Label>LinkedIn</Label><Input placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} /></div>
            <div className="space-y-1.5"><Label>GitHub</Label><Input placeholder="https://github.com/..." {...register("github_url")} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Skills</CardTitle><CardDescription>Add your key technical and professional skills</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="e.g. React, Python, Leadership" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => setSkills(skills.filter((s) => s !== skill))}>{skill} ×</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Profile</>}</Button>
      </form>
    </div>
  );
}
