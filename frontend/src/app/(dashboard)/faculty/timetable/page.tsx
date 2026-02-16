"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyTimetable } from "@/lib/api";
import TimetableGrid from "@/components/TimetableGrid";
import TimetableListView from "@/components/TimetableListView";
import { Loader2, Calendar } from "lucide-react";

export default function FacultyTimetablePage() {
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTimetable()
      .then((data) => {
        // API returns array directly
        if (Array.isArray(data)) {
          setMyEntries(data);
        } else if (data?.entries) {
          setMyEntries(data.entries);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetables</h1>
        <p className="text-muted-foreground mt-1">Your schedule and all published timetables</p>
      </div>

      {/* Personal Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>My Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myEntries.length > 0 ? (
            <TimetableGrid entries={myEntries} highlightToday />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No timetable assigned</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Your timetable will appear here once generated
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Timetables — same view as other roles */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">All Timetables</h2>
        <TimetableListView />
      </div>
    </div>
  );
}
