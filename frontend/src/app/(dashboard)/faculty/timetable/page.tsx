"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyTimetable } from "@/lib/api";
import TimetableGrid from "@/components/TimetableGrid";
import { Loader2, Calendar } from "lucide-react";

export default function FacultyTimetablePage() {
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTimetable().then(setTimetable).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
        <p className="text-muted-foreground mt-1">Your weekly teaching schedule</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Weekly Schedule</CardTitle></CardHeader>
        <CardContent>
          {timetable?.entries?.length > 0 ? (
            <TimetableGrid entries={timetable.entries} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No timetable assigned</h3>
              <p className="text-muted-foreground text-sm mt-1">Your timetable will appear here once generated</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
