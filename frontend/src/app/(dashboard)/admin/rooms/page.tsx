"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRooms, createRoom, deleteRoom } from "@/lib/api";
import { Loader2, Plus, Building, Trash2 } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getRooms().then(setRooms).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    setDeleting(id);
    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => (r.id || r._id) !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete room");
    }
    setDeleting(null);
  };

  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await createRoom({
        name: form.name,
        capacity: parseInt(form.capacity),
        type: form.type || "Lecture",
        features,
      });
      setShowForm(false); setForm({}); setFeatures([]); load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add room");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Rooms</h1><p className="text-muted-foreground mt-1">Manage classrooms & labs</p></div>
        <Button onClick={() => { setShowForm(true); setError(""); }}><Plus className="h-4 w-4 mr-1" /> Add Room</Button>
      </div>

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">{error}</div>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add New Room</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Room Name</Label><Input placeholder="LH-101" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" placeholder="60" value={form.capacity || ""} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type || "Lecture"} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="Lecture">Lecture Hall</option><option value="Lab">Laboratory</option><option value="Tutorial">Tutorial Room</option>
                  <option value="Seminar">Seminar Room</option><option value="Auditorium">Auditorium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input placeholder="Projector, AC…" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                  <Button type="button" variant="outline" onClick={addFeature}>Add</Button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {features.map((f) => (
                      <span key={f} className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                        {f}
                        <button type="button" onClick={() => setFeatures(features.filter((x) => x !== f))} className="text-muted-foreground hover:text-foreground">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Add Room</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No rooms yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add rooms to enable timetable generation</p>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r: any) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{r.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.type}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(r.id || r._id)} disabled={deleting === (r.id || r._id)}>
                      {deleting === (r.id || r._id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">Capacity: <span className="text-foreground font-medium">{r.capacity} seats</span></div>
                {r.features?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.features.map((f: string) => <span key={f} className="text-xs bg-muted px-2 py-0.5 rounded">{f}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
