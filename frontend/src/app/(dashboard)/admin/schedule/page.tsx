"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getScheduleConfigs,
  createScheduleConfig,
  updateScheduleConfig,
  deleteScheduleConfig,
  getSemesters,
  type ScheduleConfig,
  type BreakSlot,
} from "@/lib/api";
import {
  Loader2, Plus, Clock, Trash2, Save, Coffee, Calendar, Settings2,
} from "lucide-react";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface BreakForm {
  after_period: number;
  duration_minutes: number;
  name: string;
}

export default function ScheduleSettingsPage() {
  const [configs, setConfigs] = useState<ScheduleConfig[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("Default Schedule");
  const [formSemId, setFormSemId] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formPeriodDuration, setFormPeriodDuration] = useState(60);
  const [formPeriodsPerDay, setFormPeriodsPerDay] = useState(8);
  const [formWorkingDays, setFormWorkingDays] = useState<string[]>([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  ]);
  const [formBreaks, setFormBreaks] = useState<BreakForm[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([getScheduleConfigs(), getSemesters()])
      .then(([c, s]) => {
        setConfigs(c);
        setSemesters(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setFormName("Default Schedule");
    setFormSemId("");
    setFormStartTime("09:00");
    setFormPeriodDuration(60);
    setFormPeriodsPerDay(8);
    setFormWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setFormBreaks([]);
    setEditingId(null);
    setError("");
  };

  const startEdit = (config: ScheduleConfig) => {
    setEditingId(config.id);
    setFormName(config.name);
    setFormSemId(config.semester_id || "");
    setFormStartTime(config.start_time);
    setFormPeriodDuration(config.period_duration_minutes);
    setFormPeriodsPerDay(config.periods_per_day);
    setFormWorkingDays(config.working_days?.length ? config.working_days : ALL_DAYS.slice(0, 5));
    setFormBreaks(
      config.breaks?.map((b) => ({
        after_period: b.after_period,
        duration_minutes: b.duration_minutes,
        name: b.name,
      })) || []
    );
    setShowForm(true);
    setError("");
  };

  const toggleDay = (day: string) => {
    setFormWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addBreak = () => {
    setFormBreaks((prev) => [
      ...prev,
      { after_period: prev.length > 0 ? prev[prev.length - 1].after_period + 2 : 2, duration_minutes: 15, name: "Break" },
    ]);
  };

  const removeBreak = (idx: number) => {
    setFormBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBreak = (idx: number, field: keyof BreakForm, value: string | number) => {
    setFormBreaks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      name: formName,
      semester_id: formSemId || undefined,
      start_time: formStartTime,
      period_duration_minutes: formPeriodDuration,
      periods_per_day: formPeriodsPerDay,
      breaks: formBreaks.map((b) => ({
        after_period: Number(b.after_period),
        duration_minutes: Number(b.duration_minutes),
        name: b.name,
      })),
      working_days: formWorkingDays,
    };

    try {
      if (editingId) {
        await updateScheduleConfig(editingId, payload);
      } else {
        await createScheduleConfig(payload);
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save schedule config");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule configuration?")) return;
    setDeleting(id);
    try {
      await deleteScheduleConfig(id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete");
    }
    setDeleting(null);
  };

  // Compute period time preview
  const computePreview = () => {
    const [h, m] = formStartTime.split(":").map(Number);
    let current = h * 60 + m;
    const rows: { period: number; start: string; end: string }[] = [];
    const breakRows: { afterPeriod: number; name: string; start: string; end: string }[] = [];

    for (let p = 1; p <= formPeriodsPerDay; p++) {
      const start = fmtTime(current);
      current += formPeriodDuration;
      const end = fmtTime(current);
      rows.push({ period: p, start, end });

      const brk = formBreaks.find((b) => Number(b.after_period) === p);
      if (brk) {
        const bStart = fmtTime(current);
        current += Number(brk.duration_minutes);
        const bEnd = fmtTime(current);
        breakRows.push({ afterPeriod: p, name: brk.name, start: bStart, end: bEnd });
      }
    }
    return { rows, breakRows, endTime: fmtTime(current) };
  };

  const fmtTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const preview = showForm ? computePreview() : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure timetable timings, breaks, and working days per semester
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> New Config
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Create"} Schedule Config</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Config Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Morning Shift"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Semester (optional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formSemId}
                    onChange={(e) => setFormSemId(e.target.value)}
                  >
                    <option value="">All Semesters (Global)</option>
                    {semesters.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Sem {s.number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={120}
                    value={formPeriodDuration}
                    onChange={(e) => setFormPeriodDuration(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Periods per Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={formPeriodsPerDay}
                    onChange={(e) => setFormPeriodsPerDay(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        formWorkingDays.includes(day)
                          ? "bg-primary text-white border-primary"
                          : "bg-muted/40 hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" /> Breaks & Lunch
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBreak}>
                    <Plus className="h-3 w-3 mr-1" /> Add Break
                  </Button>
                </div>
                {formBreaks.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No breaks configured. Students will have consecutive periods.
                  </p>
                )}
                {formBreaks.map((brk, idx) => (
                  <div
                    key={idx}
                    className="flex items-end gap-3 p-3 border rounded-lg bg-amber-50/30"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={brk.name}
                        onChange={(e) => updateBreak(idx, "name", e.target.value)}
                        placeholder="Lunch"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">After Period</Label>
                      <Input
                        type="number"
                        min={1}
                        max={formPeriodsPerDay}
                        value={brk.after_period}
                        onChange={(e) =>
                          updateBreak(idx, "after_period", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Duration (min)</Label>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        value={brk.duration_minutes}
                        onChange={(e) =>
                          updateBreak(idx, "duration_minutes", Number(e.target.value))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeBreak(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {preview && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Schedule Preview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {preview.rows.map((r) => (
                      <div
                        key={r.period}
                        className="flex items-center gap-2 p-2 bg-background rounded border"
                      >
                        <span className="font-bold text-primary">P{r.period}</span>
                        <span className="text-muted-foreground">
                          {r.start} – {r.end}
                        </span>
                      </div>
                    ))}
                    {preview.breakRows.map((b, i) => (
                      <div
                        key={`brk-${i}`}
                        className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200"
                      >
                        <Coffee className="h-3 w-3 text-amber-600" />
                        <span className="text-amber-700">
                          {b.name}: {b.start} – {b.end}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    College ends at: <span className="font-semibold">{preview.endTime}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {editingId ? "Update" : "Create"} Config
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Existing Configs ── */}
      {configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No schedule configs yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create a schedule configuration to define timings, breaks, and working days.
              <br />
              The default is 8 periods from 9:00 AM with no breaks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {configs.map((config) => (
            <Card key={config.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{config.name}</h3>
                    {config.semester_name ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {config.semester_name}
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Global
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(config)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(config.id)}
                      disabled={deleting === config.id}
                    >
                      {deleting === config.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>{" "}
                    <span className="font-medium">{config.start_time}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    <span className="font-medium">{config.period_duration_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Periods:</span>{" "}
                    <span className="font-medium">{config.periods_per_day}/day</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days:</span>{" "}
                    <span className="font-medium">{config.working_days?.length || 0}</span>
                  </div>
                </div>

                {config.breaks && config.breaks.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Coffee className="h-3 w-3" /> Breaks:
                    </p>
                    {config.breaks.map((b, i) => (
                      <div
                        key={i}
                        className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded inline-block mr-2"
                      >
                        {b.name} ({b.duration_minutes}min after P{b.after_period})
                      </div>
                    ))}
                  </div>
                )}

                {config.working_days && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-wrap gap-1">
                      {config.working_days.map((d) => (
                        <span
                          key={d}
                          className="text-[10px] bg-muted px-2 py-0.5 rounded-full"
                        >
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>
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
