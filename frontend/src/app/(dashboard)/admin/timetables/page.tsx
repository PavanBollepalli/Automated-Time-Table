"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTimetables, getTimetable } from "@/lib/api";
import TimetableGrid from "@/components/TimetableGrid";
import { Loader2, Calendar, Eye, X } from "lucide-react";

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTT, setSelectedTT] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    getTimetables().then(setTimetables).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const viewDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const tt = await getTimetable(id);
      setSelectedTT(tt);
    } catch {}
    setLoadingDetail(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetables</h1>
        <p className="text-muted-foreground mt-1">View all generated timetables</p>
      </div>

      {selectedTT && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Timetable Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTT(null)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div><span className="text-muted-foreground">Program:</span> <span className="font-medium">{selectedTT.program_name || "—"}</span></div>
              <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{selectedTT.batch_name || "—"}</span></div>
              <div><span className="text-muted-foreground">Semester:</span> <span className="font-medium">{selectedTT.semester_name || "—"}</span></div>
              <div><span className="text-muted-foreground">Entries:</span> <span className="font-medium">{selectedTT.entries?.length || 0}</span></div>
              {selectedTT.is_draft && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Draft</span>}
            </div>
            {selectedTT.entries?.length > 0 ? (
              <TimetableGrid entries={selectedTT.entries} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No entries in this timetable</p>
            )}
          </CardContent>
        </Card>
      )}

      {timetables.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No timetables yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Generate your first timetable from the Generate page</p>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetables.map((t: any) => (
            <Card key={t.id || t._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Program: {t.program_name || "—"}</h3>
                    <p className="text-sm text-muted-foreground">Batch: {t.batch_name || "—"}</p>
                    <p className="text-sm text-muted-foreground">Semester: {t.semester_name || "—"}</p>
                  </div>
                  {t.is_draft && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Draft</span>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.entries?.length || 0} entries</span>
                  <Button variant="outline" size="sm" onClick={() => viewDetail(t.id || t._id)} disabled={loadingDetail}>
                    {loadingDetail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />} View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
