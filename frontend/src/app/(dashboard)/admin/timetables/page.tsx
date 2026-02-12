"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTimetables, getTimetable, deleteTimetable, aiAnalyze } from "@/lib/api";
import TimetableGrid from "@/components/TimetableGrid";
import { Loader2, Calendar, Eye, X, Trash2, Sparkles } from "lucide-react";

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTT, setSelectedTT] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = () => {
    setLoading(true);
    getTimetables().then(setTimetables).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id: string) => {
    setLoadingDetail(true);
    setAnalysis(null);
    try {
      const tt = await getTimetable(id);
      setSelectedTT(tt);
    } catch {}
    setLoadingDetail(false);
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await aiAnalyze(id);
      setAnalysis(res.analysis);
    } catch {
      setAnalysis("Failed to generate analysis. Please try again.");
    }
    setAnalyzing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteTimetable(id);
      if (selectedTT?.id === id) setSelectedTT(null);
      setTimetables((prev) => prev.filter((t) => (t.id || t._id) !== id));
    } catch {}
    setDeleting(null);
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
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleAnalyze(selectedTT.id)} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Analysis
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTT(null); setAnalysis(null); }}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div><span className="text-muted-foreground">Program:</span> <span className="font-medium">{selectedTT.program_name || "—"}</span></div>
              <div><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{selectedTT.batch_name || "—"}</span></div>
              <div><span className="text-muted-foreground">Semester:</span> <span className="font-medium">{selectedTT.semester_name || "—"}</span></div>
              {selectedTT.section_name && <div><span className="text-muted-foreground">Section:</span> <span className="font-medium">{selectedTT.section_name}</span></div>}
              <div><span className="text-muted-foreground">Entries:</span> <span className="font-medium">{selectedTT.entries?.length || 0}</span></div>
              {selectedTT.is_draft && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Draft</span>}
            </div>

            {analysis && (
              <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-orange-50 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm text-primary">AI Quality Analysis</h4>
                </div>
                <div className="text-sm leading-relaxed prose prose-sm max-w-none whitespace-pre-wrap">{analysis}</div>
              </div>
            )}

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
                    <p className="text-sm text-muted-foreground">Batch: {t.batch_name || "—"}{t.section_name ? ` · Section ${t.section_name}` : ""}</p>
                    <p className="text-sm text-muted-foreground">Semester: {t.semester_name || "—"}</p>
                  </div>
                  {t.is_draft && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Draft</span>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.entries?.length || 0} entries</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => viewDetail(t.id || t._id)} disabled={loadingDetail}>
                      {loadingDetail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />} View
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(t.id || t._id)} disabled={deleting === (t.id || t._id)}>
                      {deleting === (t.id || t._id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
