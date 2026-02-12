"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.access_token, data.role, data.email, data.full_name);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-primary/5 bg-card/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-8 px-8">
              {registered && (
                <div className="p-3 rounded-lg bg-green-50 text-sm font-medium text-green-700 border border-green-200 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  Account created successfully! Please sign in.
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-sm font-medium text-destructive border border-destructive/20 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="name@institution.edu" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in"}
              </Button>
            </CardContent>
            <CardFooter className="justify-center border-t border-border/50 pt-6 pb-6 bg-muted/20 rounded-b-xl">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">Create one</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
