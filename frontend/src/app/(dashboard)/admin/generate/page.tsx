"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getPrograms, getSemesters, generateTimetable } from "@/lib/api";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";

export default function GeneratePage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [programId, setProgramId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  useEffect(() => {
    Promise.all([getPrograms(), getSemesters()])
      .then(([p, s]) => { setPrograms(p); setSemesters(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedProgram = programs.find((p: any) => (p.id || p._id) === programId);
  const batches: any[] = selectedProgram?.batches || [];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true); setError(""); setSuccess("");
    try {
      const result = await generateTimetable(programId, batchId, semesterId);
      setSuccess("Timetable generated successfully! You can view it in the Timetables section.");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail) || "Generation failed. Make sure courses, faculty, and rooms are configured.");
    } finally { setGenerating(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Timetable</h1>
        <p className="text-muted-foreground mt-1">Use the genetic algorithm to automatically create an optimized timetable</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Generation Parameters</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Program</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={programId} onChange={(e) => { setProgramId(e.target.value); setBatchId(""); }} required>
                <option value="">Select program</option>
                {programs.map((p: any) => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.code})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Batch</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={batchId} onChange={(e) => setBatchId(e.target.value)} required disabled={!programId}>
                <option value="">{programId ? "Select batch" : "Select a program first"}</option>
                {batches.map((b: any) => <option key={b.id || b._id} value={b.id || b._id}>{b.name} ({b.start_year}–{b.end_year})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required>
                <option value="">Select semester</option>
                {semesters.map((s: any) => <option key={s.id || s._id} value={s.id || s._id}>{s.name} (Sem {s.number})</option>)}
              </select>
              {semesters.length === 0 && !loading && <p className="text-xs text-muted-foreground">No semesters found. Create semesters in the Programs section first.</p>}
            </div>

            <Button type="submit" disabled={generating || !programId || !batchId || !semesterId} className="w-full">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : <><Zap className="h-4 w-4 mr-2" />Generate Timetable</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
              <h4 className="font-semibold">Initialization</h4>
              <p className="text-muted-foreground">Random timetable chromosomes are created with valid course-faculty-room assignments.</p>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
              <h4 className="font-semibold">Evolution</h4>
              <p className="text-muted-foreground">Crossover and mutation operators evolve the population over multiple generations to minimize conflicts.</p>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
              <h4 className="font-semibold">Result</h4>
              <p className="text-muted-foreground">The best conflict-free timetable is saved and ready for review, editing, and export.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
