"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, CheckCircle2, Cpu, Zap, Sparkles, Shield, Users, Calendar,
  Clock, BookOpen, Building2, GraduationCap, ChevronDown, BarChart3,
  Layers, Brain, MousePointerClick, Star, Quote, Play,
} from "lucide-react";
import { useState } from "react";

/* ═══════════════════════════════════════════════════
   LANDING PAGE — IntelliScheduler
   Sections: Nav • Hero • Stats • Features • How It Works
             • Role Cards • Testimonials • FAQ • CTA • Footer
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 selection:bg-indigo-100">

      {/* ─── Navigation ─── */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg shadow-sm group-hover:shadow-indigo-500/25 transition-shadow" />
            <span className="font-bold text-xl tracking-tight">IntelliScheduler</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">For Everyone</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 shadow-lg shadow-indigo-600/20">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-indigo-50/80 via-blue-50/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-100/40 rounded-full blur-3xl" />
          <div className="absolute top-40 left-0 w-56 h-56 bg-blue-100/30 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Fully NEP 2020 Compliant · AI Powered
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight max-w-5xl leading-[1.08]">
            Generate Optimized Schedules{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500">
              in Minutes
            </span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-slate-500 leading-relaxed mt-6">
            The intelligent platform that eliminates scheduling conflicts, optimizes resource allocation,
            and handles complex constraints — so you can focus on education, not spreadsheets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link href="/signup">
              <Button size="lg" className="h-13 px-8 text-base bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 border-t border-white/20">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="h-13 px-8 text-base border-slate-300 hover:bg-slate-50">
                <Play className="mr-2 h-4 w-4" /> See How It Works
              </Button>
            </Link>
          </div>

          {/* Hero image — dashboard mockup */}
          <div className="mt-16 md:mt-20 w-full max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
                <div className="ml-4 h-5 w-48 bg-slate-200 rounded-full" />
              </div>
              <div className="grid grid-cols-[200px_1fr] divide-x divide-slate-100">
                {/* Sidebar mockup */}
                <div className="p-4 space-y-2 bg-slate-50/50">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-8 rounded-lg ${i === 0 ? "bg-indigo-100" : "bg-slate-100"} w-full`} />
                  ))}
                </div>
                {/* Content mockup */}
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex-1 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/60" />
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className={`h-12 rounded-lg ${
                        i % 7 === 0 ? "bg-indigo-50 border border-indigo-100" :
                        i % 5 === 0 ? "bg-blue-50 border border-blue-100" :
                        "bg-slate-50 border border-slate-100"
                      }`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10x", label: "Faster Than Manual" },
            { value: "100%", label: "Conflict-Free" },
            { value: "NEP 2020", label: "Fully Compliant" },
            { value: "AI", label: "Powered Insights" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-black text-indigo-600">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">
              Everything you need to schedule smarter
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-4">
              A complete platform designed for modern, multi-disciplinary institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap,           title: "Conflict-Free Generation",   desc: "AI engine considers faculty, rooms, and student batches to eliminate all scheduling clashes automatically." },
              { icon: Cpu,           title: "Complex Constraint Solving",  desc: "Handle NEP 2020 requirements, credit hours, L-T-P splits, and any custom institutional constraints." },
              { icon: MousePointerClick, title: "Drag-and-Drop Editing",  desc: "Manually adjust generated timetables with real-time conflict detection and instant validation." },
              { icon: Brain,         title: "AI-Powered Chatbot",          desc: "Ask questions about schedules in natural language — get instant answers about faculty loads, room usage, and more." },
              { icon: Clock,         title: "Flexible Timings",            desc: "Configure start times, period durations, breaks, and lunch — different settings for each semester." },
              { icon: BarChart3,     title: "Smart Analytics",             desc: "AI quality analysis, resource utilization insights, and optimization suggestions at your fingertips." },
              { icon: Users,         title: "Multi-Role Access",           desc: "Admin, DEO, Faculty, and Student dashboards — each with tailored views and permissions." },
              { icon: Shield,        title: "Auto Account Creation",       desc: "Adding a faculty member automatically creates their login — no extra steps needed." },
              { icon: Layers,        title: "Section & Batch Support",     desc: "Manage multiple programs, batches, semesters, sections, and course assignments with ease." },
            ].map((f) => (
              <Card key={f.title} className="group relative bg-white border-slate-200/80 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
                <CardContent className="pt-6">
                  <div className="h-11 w-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center mb-4 transition-colors">
                    <f.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-slate-50/50 border-y border-slate-200/60">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">
              From data to timetable in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Add Your Data",     desc: "Set up programs, courses, faculty, rooms, and sections. Bulk import or add one by one.", icon: BookOpen },
              { step: "02", title: "Configure Schedule", desc: "Set timings, breaks, working days, and constraints for each semester.", icon: Clock },
              { step: "03", title: "Generate",           desc: "Our genetic algorithm generates an optimized, conflict-free timetable in under a minute.", icon: Cpu },
              { step: "04", title: "Review & Publish",   desc: "Fine-tune with drag-and-drop, run AI analysis, then publish to all stakeholders.", icon: CheckCircle2 },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-indigo-200" />
                )}
                <div className="relative z-10 h-20 w-20 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <s.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step {s.step}</span>
                <h3 className="text-lg font-bold mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role Cards ─── */}
      <section id="roles" className="py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Built for Everyone</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">
              Tailored dashboards for every role
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-4">
              Every user gets a purpose-built experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "Admin",   icon: Shield,        color: "from-indigo-600 to-indigo-700", features: ["Full system control", "Manage all users", "AI-powered insights", "Generate timetables"] },
              { role: "DEO",     icon: GraduationCap, color: "from-blue-600 to-blue-700",     features: ["Data entry & management", "Add programs & courses", "Faculty management", "Schedule configuration"] },
              { role: "Faculty", icon: Users,          color: "from-violet-600 to-violet-700", features: ["Today's schedule view", "Full week timetable", "Day-highlighted view", "Personal dashboard"] },
              { role: "Student", icon: Calendar,       color: "from-cyan-600 to-cyan-700",     features: ["View timetable", "Section-wise schedule", "Clean weekly view", "Mobile-friendly"] },
            ].map((r) => (
              <Card key={r.role} className="overflow-hidden border-slate-200/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className={`h-2 bg-gradient-to-r ${r.color}`} />
                <CardContent className="pt-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <r.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{r.role}</h3>
                  <ul className="space-y-2">
                    {r.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 md:py-32 bg-slate-50/50 border-y border-slate-200/60">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">
              Trusted by educators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Dr. Anita Sharma",  role: "Dean, Engineering", quote: "What used to take our team 2 weeks of back-and-forth now happens in minutes. The AI suggestions are incredibly helpful." },
              { name: "Prof. Rajesh Kumar", role: "HOD, Computer Science", quote: "The NEP 2020 compliance is seamless. Multi-section support and flexible timings have been a game-changer for our department." },
              { name: "Priya Menon",        role: "Academic Coordinator", quote: "Faculty members love seeing their today's schedule right on their dashboard. The chatbot answering schedule queries saves us hours." },
            ].map((t) => (
              <Card key={t.name} className="bg-white border-slate-200/80">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-indigo-200 mb-4" />
                  <p className="text-slate-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">{t.name[0]}{t.name.split(" ").pop()?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 md:py-32">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "How does the timetable generation algorithm work?", a: "We use a genetic algorithm (evolutionary optimization) that evolves a population of candidate timetables over 500+ generations. It considers faculty availability, room capacity, course requirements, and section constraints to produce an optimal, conflict-free schedule." },
              { q: "Is it compliant with NEP 2020?",                    a: "Yes. The system supports multi-disciplinary programs, credit-based courses, L-T-P (Lecture-Tutorial-Practical) components, and flexible semester structures required by the National Education Policy 2020." },
              { q: "Can different semesters have different timings?",    a: "Absolutely. The Schedule Settings feature lets you configure different start times, period durations, breaks, and working days for each semester independently." },
              { q: "Do faculty members get their own login?",            a: "Yes. When an admin adds a faculty member, a login account is automatically created. Faculty can then view their personalized dashboard showing today's classes, weekly timetable, and more." },
              { q: "Can I edit a generated timetable manually?",         a: "Yes. After generation, you can drag-and-drop entries, swap slots, or make manual adjustments with real-time conflict checking." },
              { q: "What about the AI chatbot?",                         a: "The built-in AI assistant can answer natural language questions about schedules — like 'What classes does Dr. Kumar have on Monday?' or 'Which rooms are free during period 3?' — using live data from your system." },
            ].map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 px-8 py-16 md:py-20 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto">
                Ready to transform your scheduling workflow?
              </h2>
              <p className="text-indigo-200 text-lg mt-4 max-w-xl mx-auto">
                Join institutions that have eliminated scheduling headaches forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <Link href="/signup">
                  <Button size="lg" className="h-13 px-8 text-base bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl font-semibold">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-13 px-8 text-base border-white/30 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg" />
                <span className="font-bold text-lg">IntelliScheduler</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                The intelligent platform for automated academic timetable generation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Access</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-slate-900 transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} IntelliScheduler. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-600 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-600 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all duration-200 ${open ? "border-indigo-200 bg-indigo-50/30 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-semibold text-sm pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-indigo-600" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

