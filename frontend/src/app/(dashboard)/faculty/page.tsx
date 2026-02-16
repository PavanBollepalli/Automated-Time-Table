"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getMyTimetable } from "@/lib/api";
import TimetableGrid from "@/components/TimetableGrid";
import { Loader2, Calendar, User, Clock, MapPin, BookOpen } from "lucide-react";

const DAY_NAMES: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCurrentUser().catch(() => null),
      getMyTimetable().catch(() => null),
    ]).then(([u, t]) => {
      setUser(u);
      // getMyTimetable returns an array directly (not an object with entries)
      if (Array.isArray(t)) {
        setTimetable({ entries: t });
      } else {
        setTimetable(t);
      }
    }).finally(() => setLoading(false));
  }, []);

  const today = DAY_NAMES[new Date().getDay()] || "";
  const entries = timetable?.entries || [];

  // Today's classes sorted by period
  const todayClasses = useMemo(() => {
    return entries
      .filter((e: any) => e.day === today)
      .sort((a: any, b: any) => a.period - b.period);
  }, [entries, today]);

  // Count classes per day for stats
  const totalWeekClasses = entries.length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back{user?.full_name ? `, ${user.full_name}` : ""}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profile</p>
              <p className="font-semibold">{user?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today ({today})</p>
              <p className="font-semibold text-lg">{todayClasses.length} classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="font-semibold text-lg">{totalWeekClasses} classes total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Today's Classes ── */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today&apos;s Schedule — {today}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {todayClasses.map((cls: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    P{cls.period}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{cls.course_name || "—"}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{cls.room_name || "TBD"}</span>
                    </div>
                    {cls.section_name && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        <span>Section {cls.section_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No classes scheduled for today</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your free day!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Full Week Timetable ── */}
      <Card>
        <CardHeader><CardTitle>Full Week Timetable</CardTitle></CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <TimetableGrid entries={entries} highlightToday />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No timetable assigned</h3>
              <p className="text-muted-foreground text-sm mt-1">Your timetable will appear here once generated by the admin</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
