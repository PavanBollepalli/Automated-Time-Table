"use client";

import { useState } from "react";
import { signupUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signupUser(email, password, fullName, role);
      router.push("/login?registered=true");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
          <p className="text-muted-foreground">Get started with IntelliScheduler</p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-primary/5 bg-card/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-8 px-8">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-sm font-medium text-destructive border border-destructive/20 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" className="h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="name@institution.edu" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 6 characters" className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm your password" className="h-12" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <select id="role" className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none cursor-pointer" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="deo">Department Admin (DEO)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="absolute right-3 top-4 pointer-events-none opacity-50">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>
              <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create account"}
              </Button>
            </CardContent>
            <CardFooter className="justify-center border-t border-border/50 pt-6 pb-6 bg-muted/20 rounded-b-xl">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
