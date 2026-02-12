"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrograms, createProgram, createBatch, createSemester } from "@/lib/api";
import { Loader2, Plus, GraduationCap } from "lucide-react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<"program" | "batch" | "semester" | null>(null);
  const [form, setForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const load = () => {
    setLoading(true);
    getPrograms().then(setPrograms).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createProgram({ name: form.name, code: form.code, type: form.type, duration_years: parseInt(form.duration_years) });
      setShowForm(null); setForm({}); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create program");
    } finally { setSubmitting(false); }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createBatch(selectedProgramId, { name: form.name, start_year: parseInt(form.start_year), end_year: parseInt(form.end_year) });
      setShowForm(null); setForm({}); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create batch");
    } finally { setSubmitting(false); }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createSemester({ name: form.name, number: parseInt(form.number) });
      setShowForm(null); setForm({});
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create semester");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground mt-1">Manage academic programs, batches, and semesters</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowForm("semester"); setForm({}); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Semester</Button>
          <Button onClick={() => { setShowForm("program"); setForm({}); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Program</Button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}

      {showForm === "program" && (
        <Card>
          <CardHeader><CardTitle>Add New Program</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProgram} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Program Name</Label><Input placeholder="B.Tech Computer Science" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Code</Label><Input placeholder="BTCS" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="UG">UG</option><option value="PG">PG</option><option value="FYUP">FYUP</option><option value="ITE">ITE</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Duration (Years)</Label><Input type="number" placeholder="4" value={form.duration_years || ""} onChange={(e) => setForm({ ...form, duration_years: e.target.value })} required /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Program</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm === "semester" && (
        <Card>
          <CardHeader><CardTitle>Add New Semester</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSemester} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Semester Name</Label><Input placeholder="Sem 1" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Number</Label><Input type="number" placeholder="1" value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Semester</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm === "batch" && (
        <Card>
          <CardHeader><CardTitle>Add Batch to Program</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBatch} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Batch Name</Label><Input placeholder="2024-2028" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Start Year</Label><Input type="number" placeholder="2024" value={form.start_year || ""} onChange={(e) => setForm({ ...form, start_year: e.target.value })} required /></div>
              <div className="space-y-2"><Label>End Year</Label><Input type="number" placeholder="2028" value={form.end_year || ""} onChange={(e) => setForm({ ...form, end_year: e.target.value })} required /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Batch</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {programs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No programs yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Create your first program to get started</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p: any) => (
            <Card key={p.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">{p.type}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Code</span><span className="font-medium">{p.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span><span className="font-medium">{p.duration_years} years</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Batches</span><span className="font-medium">{p.batches?.length || 0}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelectedProgramId(p.id); setShowForm("batch"); setForm({}); setError(""); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add Batch
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
