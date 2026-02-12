"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrograms, createProgram, createBatch, createSemester, getCourses, getSemesters, deleteProgram, deleteBatch, deleteSemester, createSection, deleteSection } from "@/lib/api";
import { Loader2, Plus, GraduationCap, BookOpen, ChevronDown, ChevronUp, Trash2, Users } from "lucide-react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<"program" | "batch" | "semester" | "section" | null>(null);
  const [form, setForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getPrograms(), getCourses(), getSemesters()])
      .then(([p, c, s]) => { setPrograms(p); setCourses(c); setSemesters(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
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
      setShowForm(null); setForm({}); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create semester");
    } finally { setSubmitting(false); }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program and all its batches?")) return;
    setDeleting(id);
    try {
      await deleteProgram(id);
      setPrograms((prev) => prev.filter((p) => (p.id || p._id) !== id));
      if (expandedProgram === id) setExpandedProgram(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete program");
    }
    setDeleting(null);
  };

  const handleDeleteBatch = async (programId: string, batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    setDeleting(batchId);
    try {
      await deleteBatch(programId, batchId);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete batch");
    }
    setDeleting(null);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createSection(selectedProgramId, selectedBatchId, {
        name: form.name,
        student_count: parseInt(form.student_count) || 0,
      });
      setShowForm(null); setForm({}); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create section");
    } finally { setSubmitting(false); }
  };

  const handleDeleteSection = async (programId: string, batchId: string, sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    setDeleting(sectionId);
    try {
      await deleteSection(programId, batchId, sectionId);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete section");
    }
    setDeleting(null);
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

      {showForm === "section" && (
        <Card>
          <CardHeader><CardTitle>Add Section to Batch</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSection} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Section Name</Label><Input placeholder="A" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Student Count</Label><Input type="number" placeholder="60" value={form.student_count || ""} onChange={(e) => setForm({ ...form, student_count: e.target.value })} /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Section</Button>
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
        <div className="grid gap-4">
          {programs.map((p: any) => {
            const pid = p.id || p._id;
            const isExpanded = expandedProgram === pid;
            // Get courses belonging to this program
            const programCourses = courses.filter((c: any) => c.program_id === pid);
            // Group by semester
            const semCourseMap: Record<string, any[]> = {};
            const unassigned: any[] = [];
            for (const c of programCourses) {
              if (c.semester_id) {
                if (!semCourseMap[c.semester_id]) semCourseMap[c.semester_id] = [];
                semCourseMap[c.semester_id].push(c);
              } else {
                unassigned.push(c);
              }
            }
            // Sort semesters by number
            const sortedSemIds = Object.keys(semCourseMap).sort((a, b) => {
              const sa = semesters.find((s: any) => (s.id || s._id) === a);
              const sb = semesters.find((s: any) => (s.id || s._id) === b);
              return (sa?.number || 0) - (sb?.number || 0);
            });
            const getSemName = (sid: string) => {
              const s = semesters.find((s: any) => (s.id || s._id) === sid);
              return s ? `${s.name} (Sem ${s.number})` : sid;
            };

            return (
              <Card key={pid} className="border-border/60 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{p.code} &middot; {p.type} &middot; {p.duration_years} years</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">{p.type}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeleteProgram(pid)} disabled={deleting === pid}>
                        {deleting === pid ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <div><span className="text-muted-foreground">Batches:</span> <span className="font-medium">{p.batches?.length || 0}</span></div>
                    <div><span className="text-muted-foreground">Courses:</span> <span className="font-medium">{programCourses.length}</span></div>
                  </div>
                  {p.batches?.length > 0 && (
                    <div className="space-y-2">
                      {p.batches.map((b: any) => (
                        <div key={b.id} className="border rounded-lg p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{b.name} ({b.start_year}–{b.end_year})</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setSelectedProgramId(pid); setSelectedBatchId(b.id); setShowForm("section"); setForm({}); setError(""); }}>
                                <Plus className="h-2.5 w-2.5 mr-1" /> Section
                              </Button>
                              <button
                                type="button"
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-full p-0.5 transition-colors disabled:opacity-50"
                                onClick={() => handleDeleteBatch(pid, b.id)}
                                disabled={deleting === b.id}
                              >
                                {deleting === b.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
                              </button>
                            </div>
                          </div>
                          {b.sections?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {b.sections.map((s: any) => (
                                <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-background border px-2 py-1 rounded-full">
                                  <Users className="h-2.5 w-2.5 text-muted-foreground" />
                                  Section {s.name} {s.student_count > 0 && <span className="text-muted-foreground">({s.student_count})</span>}
                                  <button
                                    type="button"
                                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-full p-0.5 transition-colors disabled:opacity-50"
                                    onClick={() => handleDeleteSection(pid, b.id, s.id)}
                                    disabled={deleting === s.id}
                                  >
                                    {deleting === s.id ? <Loader2 className="h-2 w-2 animate-spin" /> : <Trash2 className="h-2 w-2" />}
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No sections — add sections to enable per-section timetables</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedProgramId(pid); setShowForm("batch"); setForm({}); setError(""); }}>
                      <Plus className="h-3 w-3 mr-1" /> Add Batch
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExpandedProgram(isExpanded ? null : pid)}>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Curriculum
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      <h4 className="font-semibold text-sm flex items-center gap-1"><BookOpen className="h-4 w-4" /> Semester-wise Curriculum</h4>
                      {programCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No courses linked to this program yet. Go to Courses page to add courses with this program and semester.</p>
                      ) : (
                        <>
                          {sortedSemIds.map((sid) => (
                            <div key={sid} className="space-y-2">
                              <h5 className="text-sm font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-md">{getSemName(sid)} &mdash; {semCourseMap[sid].length} course(s), {semCourseMap[sid].reduce((sum: number, c: any) => sum + (c.credits || 0), 0)} credits</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead><tr className="border-b bg-muted/40">
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Credits</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">L-T-P</th>
                                  </tr></thead>
                                  <tbody>
                                    {semCourseMap[sid].map((c: any) => (
                                      <tr key={c.id || c._id} className="border-b hover:bg-muted/20">
                                        <td className="py-2 px-3 font-mono font-medium">{c.code}</td>
                                        <td className="py-2 px-3">{c.name}</td>
                                        <td className="py-2 px-3">{c.credits}</td>
                                        <td className="py-2 px-3"><span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{c.type}</span></td>
                                        <td className="py-2 px-3 font-mono">{c.components?.lecture || 0}-{c.components?.tutorial || 0}-{c.components?.practical || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                          {unassigned.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md">No Semester Assigned &mdash; {unassigned.length} course(s)</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead><tr className="border-b bg-muted/40">
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Credits</th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                                  </tr></thead>
                                  <tbody>
                                    {unassigned.map((c: any) => (
                                      <tr key={c.id || c._id} className="border-b hover:bg-muted/20">
                                        <td className="py-2 px-3 font-mono">{c.code}</td>
                                        <td className="py-2 px-3">{c.name}</td>
                                        <td className="py-2 px-3">{c.credits}</td>
                                        <td className="py-2 px-3"><span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{c.type}</span></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
