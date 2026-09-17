"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Suspense } from "react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const nextPath = searchParams.get("next") || "/";
  const { verifyOtp, refreshProfile } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/auth/signin");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || token.length !== 6) return;

    setLoading(true);
    const { error } = await verifyOtp(email, token.trim());

    if (error) {
      toast.error(error.message);
      setToken("");
    } else {
      toast.success("Signed in successfully");
      await refreshProfile();
      router.push(nextPath);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    const { signIn } = useAuth();
    setResendCooldown(60);
    const { error } = await signIn(email);
    if (error) toast.error(error.message);
    else toast.success("New code sent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token">Verification code</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="pl-9 text-center text-2xl tracking-widest"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading || token.length !== 6}>
              {loading ? "Verifying…" : "Verify code"}
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive a code? Resend"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Not yours? <a href="/auth/signin" className="underline hover:text-primary">Sign in with a different email</a></p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={null}><VerifyContent /></Suspense>;
}