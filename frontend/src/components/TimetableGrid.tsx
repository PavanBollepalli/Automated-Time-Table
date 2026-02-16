"use client";

import { useMemo } from "react";
import type { ScheduleConfig, BreakSlot } from "@/lib/api";

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_NAMES: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

interface Entry {
  day: string;
  period: number;
  course_name?: string;
  faculty_name?: string;
  room_name?: string;
  batch_id?: string;
  course_id?: string;
  faculty_id?: string;
  room_id?: string;
}

interface TimetableGridProps {
  entries: Entry[];
  compact?: boolean;
  scheduleConfig?: ScheduleConfig | null;
  highlightToday?: boolean;
}

/** Compute start/end time for a period given schedule config */
function computePeriodTimes(
  periodNum: number,
  startTime: string,
  durationMins: number,
  breaks: BreakSlot[]
): { start: string; end: string } {
  const [startH, startM] = startTime.split(":").map(Number);
  let currentMins = startH * 60 + startM;

  for (let p = 1; p <= periodNum; p++) {
    if (p === periodNum) {
      const start = formatTime(currentMins);
      const end = formatTime(currentMins + durationMins);
      return { start, end };
    }
    currentMins += durationMins;
    // Check if there's a break after this period
    const brk = breaks.find((b) => b.after_period === p);
    if (brk) {
      currentMins += brk.duration_minutes;
    }
  }
  return { start: startTime, end: startTime };
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getTodayName(): string {
  return DAY_NAMES[new Date().getDay()] || "";
}

export default function TimetableGrid({
  entries,
  compact = false,
  scheduleConfig,
  highlightToday = false,
}: TimetableGridProps) {
  const today = getTodayName();

  const days = useMemo(
    () => scheduleConfig?.working_days?.length ? scheduleConfig.working_days : DEFAULT_DAYS,
    [scheduleConfig]
  );

  const periods = useMemo(
    () => scheduleConfig?.periods_per_day
      ? Array.from({ length: scheduleConfig.periods_per_day }, (_, i) => i + 1)
      : DEFAULT_PERIODS,
    [scheduleConfig]
  );

  const breaks = useMemo(
    () => scheduleConfig?.breaks || [],
    [scheduleConfig]
  );

  const hasConfig = !!scheduleConfig && !!scheduleConfig.start_time;

  // Compute time labels for each period
  const periodLabels = useMemo(() => {
    if (!hasConfig) return periods.map((p) => ({ period: p, label: `P${p}`, sub: "" }));
    return periods.map((p) => {
      const times = computePeriodTimes(
        p,
        scheduleConfig!.start_time,
        scheduleConfig!.period_duration_minutes,
        breaks
      );
      return { period: p, label: `P${p}`, sub: `${times.start} – ${times.end}` };
    });
  }, [periods, hasConfig, scheduleConfig, breaks]);

  // Get break info: which periods have a break after them
  const breakAfterPeriod = useMemo(() => {
    const map: Record<number, BreakSlot> = {};
    for (const b of breaks) map[b.after_period] = b;
    return map;
  }, [breaks]);

  const getEntry = (day: string, period: number) =>
    entries.find((e) => e.day === day && e.period === period);

  // Build column groups: interleave periods and break columns
  const columns: { type: "period"; period: number }[] | { type: "break"; brk: BreakSlot }[] = [];
  const allColumns: Array<{ type: "period"; period: number } | { type: "break"; brk: BreakSlot }> = [];
  for (const p of periods) {
    allColumns.push({ type: "period", period: p });
    if (breakAfterPeriod[p]) {
      allColumns.push({ type: "break", brk: breakAfterPeriod[p] });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground w-28">
              Day / Period
            </th>
            {allColumns.map((col, idx) =>
              col.type === "period" ? (
                <th
                  key={`p-${col.period}`}
                  className="border bg-muted/50 px-2 py-1.5 text-center font-medium text-muted-foreground min-w-[100px]"
                >
                  <div>{periodLabels.find((l) => l.period === col.period)?.label}</div>
                  {hasConfig && (
                    <div className="text-[10px] font-normal text-muted-foreground/70">
                      {periodLabels.find((l) => l.period === col.period)?.sub}
                    </div>
                  )}
                </th>
              ) : (
                <th
                  key={`brk-${idx}`}
                  className="border bg-amber-50 px-1 py-1.5 text-center font-medium text-amber-700 min-w-[60px] text-[10px]"
                >
                  <div className="font-semibold">{col.brk.name}</div>
                  <div className="font-normal">{col.brk.duration_minutes} min</div>
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const isToday = highlightToday && day === today;
            return (
              <tr key={day} className={isToday ? "bg-primary/5 ring-1 ring-primary/20" : ""}>
                <td
                  className={`border px-3 py-2 font-medium text-sm ${
                    isToday
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-muted/30"
                  }`}
                >
                  {compact ? day.slice(0, 3) : day}
                  {isToday && (
                    <span className="ml-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-normal">
                      Today
                    </span>
                  )}
                </td>
                {allColumns.map((col, idx) =>
                  col.type === "period" ? (
                    <td
                      key={`${day}-p-${col.period}`}
                      className={`border px-2 py-1.5 text-center align-top ${
                        getEntry(day, col.period)
                          ? isToday
                            ? "bg-primary/10"
                            : "bg-primary/5"
                          : ""
                      }`}
                    >
                      {(() => {
                        const entry = getEntry(day, col.period);
                        return entry ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-xs text-primary truncate">
                              {entry.course_name || "—"}
                            </div>
                            {!compact && (
                              <div className="text-xs text-muted-foreground truncate">
                                {entry.faculty_name || ""}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground/80 truncate">
                              {entry.room_name || ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        );
                      })()}
                    </td>
                  ) : (
                    <td
                      key={`${day}-brk-${idx}`}
                      className="border bg-amber-50/50 px-1 py-1.5 text-center"
                    >
                      <span className="text-[10px] text-amber-600/50">☕</span>
                    </td>
                  )
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
