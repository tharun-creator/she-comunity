"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (authError) {
      // Generic message regardless of cause — a wrong password and a
      // nonexistent email must look identical, or the form becomes an
      // email-enumeration oracle.
      setError("Invalid email or password.");
      return;
    }

    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-heading">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to your SheStays account.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {isSubmitting ? "Signing in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
