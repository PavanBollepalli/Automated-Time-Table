"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Cpu, Zap, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-orange-400 rounded-lg shadow-sm" />
            <span className="font-bold text-xl tracking-tight text-foreground">IntelliScheduler</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-semibold px-6">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16 md:pb-32">
        <section className="container mx-auto max-w-7xl px-6 flex flex-col items-center text-center space-y-10">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-xl transition-colors hover:bg-primary/10">
            <Sparkles className="w-4 h-4 mr-2" />
            Fully NEP 2020 Compliant
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground max-w-5xl leading-[1.05]">
            Generate Optimized Schedules <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">
              in Minutes, Not Weeks
            </span>
          </h1>

          <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
            The modern operating system for academic scheduling. Eliminate conflicts, optimize resource allocation, and adapt to complex constraints with an intelligent, AI-powered platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg shadow-xl shadow-primary/25 border-t border-white/20">
                Generate First Timetable <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg bg-background active:scale-95 border-muted-foreground/20">
                How it Works
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="container mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">The Future of Academic Scheduling</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Powerful features designed for the complexity of modern, multidisciplinary education.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-orange-500" />}
              title="Conflict-Free Generation"
              description="Our AI engine considers faculty availability, room capacity, and student batches to eliminate all clashes."
            />
            <FeatureCard
              icon={<Cpu className="h-6 w-6 text-orange-600" />}
              title="Complex Constraint Solving"
              description="Handle NEP 2020 requirements, credit hours, practical/lecture splits, and custom constraints with ease."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6 text-orange-400" />}
              title="Dynamic & Editable"
              description="Instantly simulate scenarios or make manual edits to generated timetables with real-time conflict checking."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="h-6 w-6 bg-primary rounded" />
            <span className="font-semibold text-lg">IntelliScheduler</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 IntelliScheduler Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="group relative overflow-hidden bg-card hover:bg-gradient-to-br from-white to-orange-50/50 border-border/60 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1">
      <CardHeader>
        <div className="h-14 w-14 rounded-2xl bg-orange-50 group-hover:bg-white flex items-center justify-center mb-4 border border-orange-100 group-hover:border-primary/20 transition-colors shadow-sm">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-muted-foreground text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
