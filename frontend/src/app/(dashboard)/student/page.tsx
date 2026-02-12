"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getTimetables } from "@/lib/api";
import { Loader2, Calendar, User, GraduationCap } from "lucide-react";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCurrentUser().catch(() => null),
      getTimetables().catch(() => []),
    ]).then(([u, t]) => {
      setUser(u); setTimetables(t);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
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
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold capitalize">{user?.role || "student"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Timetables</p>
              <p className="font-semibold">{timetables.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Access</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use the sidebar to navigate to your timetables.</p>
        </CardContent>
      </Card>
    </div>
  );
}
