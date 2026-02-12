"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCourses, createCourse, getPrograms, getSemesters, deleteCourse } from "@/lib/api";
import { Loader2, Plus, BookOpen, Trash2 } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({ components: { lecture: 3, tutorial: 1, practical: 0 } });
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getCourses(), getPrograms(), getSemesters()])
      .then(([c, p, s]) => { setCourses(c); setPrograms(p); setSemesters(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createCourse({
        code: form.code, name: form.name, credits: parseInt(form.credits), type: form.type,
        components: { lecture: parseInt(form.components.lecture) || 0, tutorial: parseInt(form.components.tutorial) || 0, practical: parseInt(form.components.practical) || 0 },
        program_id: form.program_id || undefined, semester_id: form.semester_id || undefined,
        is_elective: form.is_elective === "true",
      });
      setShowForm(false); setForm({ components: { lecture: 3, tutorial: 1, practical: 0 } }); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create course");
    } finally { setSubmitting(false); }
  };

  // Helper to get program/semester names for display
  const getProgramName = (id: string | null) => { if (!id) return "—"; const p = programs.find((p: any) => (p.id || p._id) === id); return p ? `${p.name} (${p.code})` : id; };
  const getSemesterName = (id: string | null) => { if (!id) return "—"; const s = semesters.find((s: any) => (s.id || s._id) === id); return s ? s.name : id; };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    setDeleting(id);
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => (c.id || c._id) !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete course");
    }
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Courses</h1><p className="text-muted-foreground mt-1">Manage course catalog</p></div>
        <Button onClick={() => { setShowForm(true); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Add Course</Button>
      </div>

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add New Course</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Course Code</Label><Input placeholder="CS101" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Course Name</Label><Input placeholder="Data Structures" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Credits</Label><Input type="number" placeholder="4" value={form.credits || ""} onChange={(e) => setForm({ ...form, credits: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="Major">Major</option><option value="Minor">Minor</option><option value="Value-Added">Value-Added</option>
                  <option value="Skill-Enhancement">Skill-Enhancement</option><option value="Ability-Enhancement">Ability-Enhancement</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.program_id || ""} onChange={(e) => setForm({ ...form, program_id: e.target.value })} required>
                  <option value="">Select program</option>
                  {programs.map((p: any) => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.semester_id || ""} onChange={(e) => setForm({ ...form, semester_id: e.target.value })} required>
                  <option value="">Select semester</option>
                  {semesters.map((s: any) => <option key={s.id || s._id} value={s.id || s._id}>{s.name} (Sem {s.number})</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Lectures/week</Label><Input type="number" value={form.components.lecture} onChange={(e) => setForm({ ...form, components: { ...form.components, lecture: e.target.value } })} /></div>
              <div className="space-y-2"><Label>Tutorials/week</Label><Input type="number" value={form.components.tutorial} onChange={(e) => setForm({ ...form, components: { ...form.components, tutorial: e.target.value } })} /></div>
              <div className="space-y-2"><Label>Practicals/week</Label><Input type="number" value={form.components.practical} onChange={(e) => setForm({ ...form, components: { ...form.components, practical: e.target.value } })} /></div>
              <div className="space-y-2">
                <Label>Is Elective?</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.is_elective || "false"} onChange={(e) => setForm({ ...form, is_elective: e.target.value })}>
                  <option value="false">No</option><option value="true">Yes</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Create Course</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No courses yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add your first course to get started</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Program</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Semester</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Credits</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">L-T-P</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Elective</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {courses.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">{c.code}</td>
                  <td className="py-3 px-4">{c.name}</td>
                  <td className="py-3 px-4 text-xs">{getProgramName(c.program_id)}</td>
                  <td className="py-3 px-4 text-xs">{getSemesterName(c.semester_id)}</td>
                  <td className="py-3 px-4">{c.credits}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.type}</span></td>
                  <td className="py-3 px-4 font-mono">{c.components?.lecture || 0}-{c.components?.tutorial || 0}-{c.components?.practical || 0}</td>
                  <td className="py-3 px-4">{c.is_elective ? "Yes" : "No"}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(c.id || c._id)} disabled={deleting === (c.id || c._id)}>
                      {deleting === (c.id || c._id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
