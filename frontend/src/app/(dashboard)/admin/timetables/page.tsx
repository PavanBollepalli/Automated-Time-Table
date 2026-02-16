"use client";

import TimetableListView from "@/components/TimetableListView";

export default function TimetablesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetables</h1>
        <p className="text-muted-foreground mt-1">View and manage all generated timetables</p>
      </div>
      <TimetableListView canDelete canAnalyze />
    </div>
  );
}
