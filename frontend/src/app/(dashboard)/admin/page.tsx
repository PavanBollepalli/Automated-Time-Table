"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrograms, getCourses, getFaculty, getRooms, getTimetables, aiInsights } from "@/lib/api";
import {
  GraduationCap, BookOpen, Users, Building2, Calendar, Loader2,
  Sparkles, RefreshCw, AlertTriangle, BarChart3, Zap, Bot,
} from "lucide-react";

interface InsightItem {
  category: string;
  icon: string;
  title: string;
  description: string;
  priority: string;
}

const ICON_MAP: Record<string, typeof AlertTriangle> = {
  alert: AlertTriangle,
  "bar-chart": BarChart3,
  users: Users,
  calendar: Calendar,
  zap: Zap,
};

const PRIORITY_STYLES: Record<string, { border: string; badge: string; badgeText: string }> = {
  high:   { border: "border-l-red-500",    badge: "bg-red-100 text-red-700",      badgeText: "High" },
  medium: { border: "border-l-amber-500",  badge: "bg-amber-100 text-amber-700",  badgeText: "Medium" },
  low:    { border: "border-l-emerald-500", badge: "bg-emerald-100 text-emerald-700", badgeText: "Low" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Data Quality":          { bg: "bg-red-50",     text: "text-red-600" },
  "Resource Optimization": { bg: "bg-blue-50",    text: "text-blue-600" },
  "Faculty Workload":      { bg: "bg-violet-50",  text: "text-violet-600" },
  "Scheduling":            { bg: "bg-orange-50",  text: "text-orange-600" },
  "Quick Win":             { bg: "bg-emerald-50", text: "text-emerald-600" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ programs: 0, courses: 0, faculty: 0, rooms: 0, timetables: 0 });
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightItem[] | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(false);

  useEffect(() => {
    Promise.all([getPrograms(), getCourses(), getFaculty(), getRooms(), getTimetables()])
      .then(([p, c, f, r, t]) => setStats({ programs: p.length, courses: c.length, faculty: f.length, rooms: r.length, timetables: t.length }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(false);
    try {
      const res = await aiInsights();
      setInsights(res.insights);
    } catch {
      setInsightsError(true);
      setInsights(null);
    }
    setLoadingInsights(false);
  };

  useEffect(() => {
    if (!loading && stats.courses > 0) {
      fetchInsights();
    }
  }, [loading]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Programs", value: stats.programs, icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Faculty", value: stats.faculty, icon: Users, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Rooms", value: stats.rooms, icon: Building2, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Timetables", value: stats.timetables, icon: Calendar, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your institution&apos;s scheduling system</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">AI Insights</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Bot className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Powered by IntelliScheduler AI</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loadingInsights} className="gap-1.5">
            {loadingInsights ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>

        {loadingInsights && !insights ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-violet-400 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Analyzing your data with AI...</p>
                <p className="text-xs text-muted-foreground">This may take a few seconds</p>
              </div>
            </CardContent>
          </Card>
        ) : insightsError ? (
          <Card className="border-dashed border-red-200 bg-red-50/30">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <p className="text-sm text-red-600 font-medium">Unable to generate insights right now</p>
                <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-2">Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : insights && insights.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((item, idx) => {
              const IconComp = ICON_MAP[item.icon] || Zap;
              const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;
              const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Quick Win"];

              return (
                <Card
                  key={idx}
                  className={`border-l-4 ${priority.border} hover:shadow-md transition-shadow duration-200`}
                >
                  <CardContent className="pt-5 pb-4 px-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catColor.bg}`}>
                        <IconComp className={`h-4.5 w-4.5 ${catColor.text}`} />
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priority.badge}`}>
                        {priority.badgeText}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight mb-1.5">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <div className="mt-3 pt-2.5 border-t border-border/50">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${catColor.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${catColor.bg} ring-2 ring-offset-1 ${catColor.text.replace("text-", "ring-")}`} />
                        {item.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Click Refresh to generate AI insights about your system</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
