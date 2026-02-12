"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrograms, getCourses, getFaculty, getRooms, getTimetables } from "@/lib/api";
import { GraduationCap, BookOpen, Users, Building2, Calendar, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ programs: 0, courses: 0, faculty: 0, rooms: 0, timetables: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPrograms(), getCourses(), getFaculty(), getRooms(), getTimetables()])
      .then(([p, c, f, r, t]) => setStats({ programs: p.length, courses: c.length, faculty: f.length, rooms: r.length, timetables: t.length }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
