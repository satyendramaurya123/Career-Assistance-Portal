"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordSchema>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    setSuccess(true);
  };

  if (success) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"><Mail className="w-8 h-8 text-primary" /></div>
      <h2 className="text-2xl font-bold">Check your email</h2>
      <p className="text-muted-foreground">We&apos;ve sent a password reset link. Check your inbox and follow the instructions.</p>
      <Button asChild variant="outline" className="w-full"><Link href="/login"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Forgot password?</h1><p className="text-muted-foreground mt-1">Enter your email and we&apos;ll send you a reset link</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Send Reset Link</Button>
      </form>
      <Button asChild variant="ghost" className="w-full"><Link href="/login"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link></Button>
    </div>
  );
}
