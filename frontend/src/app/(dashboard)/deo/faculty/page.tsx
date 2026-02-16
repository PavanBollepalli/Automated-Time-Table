"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFaculty, createFaculty, getCourses } from "@/lib/api";
import { Loader2, Plus, Users } from "lucide-react";

export default function DeoFacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const load = () => { setLoading(true); Promise.all([getFaculty(), getCourses()]).then(([f, c]) => { setFaculty(f); setCourses(c); }).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggleCourse = (id: string) => { setSelectedCourses((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const result = await createFaculty({ name: form.name, email: form.email, department: form.department, designation: form.designation, max_load_hours: parseInt(form.max_load_hours) || 18, can_teach_course_ids: selectedCourses, busy_slots: [] });
      if (result?.default_password) {
        setCreatedPassword(result.default_password);
      }
      setShowForm(false); setForm({}); setSelectedCourses([]); load();
    } catch (err: any) { setError(err?.response?.data?.detail || "Failed"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Faculty</h1><p className="text-muted-foreground mt-1">Manage faculty members</p></div>
        <Button onClick={() => { setShowForm(true); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Add Faculty</Button>
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}
      {createdPassword && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm">
          <p className="font-semibold text-green-800 mb-1">Faculty account created successfully!</p>
          <p className="text-green-700">
            Default login password: <code className="bg-green-100 px-2 py-0.5 rounded font-mono font-bold text-green-900">{createdPassword}</code>
          </p>
          <p className="text-green-600 text-xs mt-1">Please share these credentials with the faculty member.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setCreatedPassword(null)}>Dismiss</Button>
        </div>
      )}
      {showForm && (
        <Card><CardHeader><CardTitle>Add New Faculty</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Dr. Jane Smith" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="jane@uni.edu" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
            <div className="space-y-2"><Label>Department</Label><Input placeholder="Computer Science" value={form.department||""} onChange={e=>setForm({...form,department:e.target.value})} required /></div>
            <div className="space-y-2"><Label>Designation</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.designation||""} onChange={e=>setForm({...form,designation:e.target.value})} required>
                <option value="">Select</option><option value="Professor">Professor</option><option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option><option value="Lecturer">Lecturer</option>
              </select></div>
            <div className="space-y-2"><Label>Max Load Hours/week</Label><Input type="number" placeholder="18" value={form.max_load_hours||""} onChange={e=>setForm({...form,max_load_hours:e.target.value})} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Can Teach Courses</Label>
              {courses.length===0?<p className="text-sm text-muted-foreground">No courses available.</p>:(
                <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                  {courses.map((c:any)=>(
                    <button type="button" key={c.id} onClick={()=>toggleCourse(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCourses.includes(c.id)?"bg-primary text-white border-primary":"bg-muted/40 hover:bg-muted"}`}>
                      {c.code} – {c.name}
                    </button>))}
                </div>)}
            </div>
            <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={submitting}>{submitting?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:null}Add Faculty</Button><Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
      {faculty.length===0?(
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-semibold">No faculty yet</h3>
        </CardContent></Card>
      ):(
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{faculty.map((f:any)=>(
          <Card key={f.id} className="hover:shadow-md transition-shadow"><CardContent className="pt-6">
            <div className="flex items-start justify-between"><div><h3 className="font-semibold text-lg">{f.name}</h3><p className="text-muted-foreground text-sm">{f.email}</p></div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.designation}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Dept:</span> {f.department}</div>
              <div><span className="text-muted-foreground">Max:</span> {f.max_load_hours}h</div>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
