"use client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

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
}

export default function TimetableGrid({ entries, compact = false }: TimetableGridProps) {
  const getEntry = (day: string, period: number) =>
    entries.find((e) => e.day === day && e.period === period);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground w-28">Day / Period</th>
            {PERIODS.map((p) => (
              <th key={p} className="border bg-muted/50 px-3 py-2 text-center font-medium text-muted-foreground min-w-[100px]">
                P{p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="border bg-muted/30 px-3 py-2 font-medium text-sm">{compact ? day.slice(0, 3) : day}</td>
              {PERIODS.map((period) => {
                const entry = getEntry(day, period);
                return (
                  <td key={period} className={`border px-2 py-1.5 text-center align-top ${entry ? "bg-primary/5" : ""}`}>
                    {entry ? (
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-primary truncate">{entry.course_name || "—"}</div>
                        {!compact && <div className="text-xs text-muted-foreground truncate">{entry.faculty_name || ""}</div>}
                        <div className="text-[10px] text-muted-foreground/80 truncate">{entry.room_name || ""}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
