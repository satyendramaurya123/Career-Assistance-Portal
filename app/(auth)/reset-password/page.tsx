"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordSchema } from "@/lib/validations";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordSchema>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordSchema) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully!");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Set new password</h1><p className="text-muted-foreground mt-1">Choose a strong password for your account</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" {...register("password")} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input id="confirm_password" type="password" placeholder="Repeat your new password" {...register("confirm_password")} />
          {errors.confirm_password && <p className="text-destructive text-xs">{errors.confirm_password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Update Password</Button>
      </form>
    </div>
  );
}
