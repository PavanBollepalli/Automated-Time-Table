"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getPrograms, getCourses, getFaculty, getRooms, getTimetables, getCurrentUser } from "@/lib/api";
import { Loader2, BookOpen, Users, Building, Calendar, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function DeoDashboard() {
  const [stats, setStats] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCurrentUser().catch(() => null),
      getPrograms().catch(() => []),
      getCourses().catch(() => []),
      getFaculty().catch(() => []),
      getRooms().catch(() => []),
      getTimetables().catch(() => []),
    ]).then(([u, p, c, f, r, t]) => {
      setUser(u);
      setStats({ programs: p.length, courses: c.length, faculty: f.length, rooms: r.length, timetables: t.length });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Programs", count: stats.programs, icon: GraduationCap, href: "/deo/programs" },
    { label: "Courses", count: stats.courses, icon: BookOpen, href: "/deo/courses" },
    { label: "Faculty", count: stats.faculty, icon: Users, href: "/deo/faculty" },
    { label: "Rooms", count: stats.rooms, icon: Building, href: "/deo/rooms" },
    { label: "Timetables", count: stats.timetables, icon: Calendar, href: "/deo/timetables" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DEO Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back{user?.full_name ? `, ${user.full_name}` : ""}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6 text-center">
                <c.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{c.count}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
