"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrograms, createProgram, createBatch, createSemester } from "@/lib/api";
import { Loader2, Plus, GraduationCap } from "lucide-react";

export default function DeoProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState<string | null>(null);
  const [showSemForm, setShowSemForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [batchForm, setBatchForm] = useState<any>({});
  const [semForm, setSemForm] = useState<any>({});

  const load = () => { setLoading(true); getPrograms().then(setPrograms).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try { await createProgram({ name: form.name, code: form.code, type: form.type, duration_years: parseInt(form.duration_years) }); setShowForm(false); setForm({}); load(); }
    catch (err: any) { setError(err?.response?.data?.detail || "Failed"); } finally { setSubmitting(false); }
  };
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try { await createBatch(showBatchForm!, { name: batchForm.name, start_year: parseInt(batchForm.start_year), end_year: parseInt(batchForm.end_year) }); setShowBatchForm(null); setBatchForm({}); load(); }
    catch (err: any) { setError(err?.response?.data?.detail || "Failed"); } finally { setSubmitting(false); }
  };
  const handleCreateSem = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try { await createSemester({ name: semForm.name, number: parseInt(semForm.number) }); setShowSemForm(false); setSemForm({}); }
    catch (err: any) { setError(err?.response?.data?.detail || "Failed"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-3xl font-bold tracking-tight">Programs</h1><p className="text-muted-foreground mt-1">Manage academic programs</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowSemForm(true); setError(""); }}>Add Semester</Button>
          <Button onClick={() => { setShowForm(true); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Add Program</Button>
        </div>
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}
      {showSemForm && (
        <Card><CardHeader><CardTitle>Add Semester</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleCreateSem} className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1"><Label>Name</Label><Input placeholder="Semester 1" value={semForm.name||""} onChange={e=>setSemForm({...semForm,name:e.target.value})} required /></div>
            <div className="space-y-1"><Label>Number</Label><Input type="number" placeholder="1" value={semForm.number||""} onChange={e=>setSemForm({...semForm,number:e.target.value})} required /></div>
            <Button type="submit" disabled={submitting}>{submitting?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:null}Create</Button>
            <Button type="button" variant="outline" onClick={()=>setShowSemForm(false)}>Cancel</Button>
          </form>
        </CardContent></Card>
      )}
      {showForm && (
        <Card><CardHeader><CardTitle>Add New Program</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleCreateProgram} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input placeholder="B.Tech Computer Science" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div className="space-y-2"><Label>Code</Label><Input placeholder="BTCS" value={form.code||""} onChange={e=>setForm({...form,code:e.target.value})} required /></div>
            <div className="space-y-2"><Label>Type</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type||""} onChange={e=>setForm({...form,type:e.target.value})} required>
                <option value="">Select</option><option value="UG">UG</option><option value="PG">PG</option><option value="Diploma">Diploma</option><option value="PhD">PhD</option>
              </select></div>
            <div className="space-y-2"><Label>Duration (years)</Label><Input type="number" placeholder="4" value={form.duration_years||""} onChange={e=>setForm({...form,duration_years:e.target.value})} required /></div>
            <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={submitting}>{submitting?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:null}Create</Button><Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
      {showBatchForm && (
        <Card><CardHeader><CardTitle>Add Batch</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleCreateBatch} className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1"><Label>Batch Name</Label><Input placeholder="2024-28" value={batchForm.name||""} onChange={e=>setBatchForm({...batchForm,name:e.target.value})} required /></div>
            <div className="space-y-1"><Label>Start Year</Label><Input type="number" placeholder="2024" value={batchForm.start_year||""} onChange={e=>setBatchForm({...batchForm,start_year:e.target.value})} required /></div>
            <div className="space-y-1"><Label>End Year</Label><Input type="number" placeholder="2028" value={batchForm.end_year||""} onChange={e=>setBatchForm({...batchForm,end_year:e.target.value})} required /></div>
            <Button type="submit" disabled={submitting}>{submitting?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:null}Create</Button>
            <Button type="button" variant="outline" onClick={()=>setShowBatchForm(null)}>Cancel</Button>
          </form>
        </CardContent></Card>
      )}
      {programs.length===0?(
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-semibold">No programs yet</h3><p className="text-muted-foreground text-sm mt-1">Add your first program</p>
        </CardContent></Card>
      ):(
        <div className="grid md:grid-cols-2 gap-4">{programs.map((p:any)=>(
          <Card key={p.id||p._id} className="hover:shadow-md transition-shadow"><CardContent className="pt-6">
            <div className="flex items-start justify-between"><div><h3 className="font-semibold text-lg">{p.name}</h3><p className="text-sm text-muted-foreground font-mono">{p.code}</p></div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.type}</span></div>
            <p className="text-sm text-muted-foreground mt-2">{p.duration_years} years</p>
            {p.batches?.length>0&&(<div className="mt-3"><p className="text-xs font-medium text-muted-foreground mb-1">Batches:</p><div className="flex flex-wrap gap-1">{p.batches.map((b:any)=>(<span key={b.id||b._id} className="text-xs bg-muted px-2 py-0.5 rounded">{b.name}</span>))}</div></div>)}
            <Button variant="outline" size="sm" className="mt-3" onClick={()=>{setShowBatchForm(p.id||p._id);setError("")}}>+ Add Batch</Button>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
