"""
AI-powered endpoints using Groq LLM for timetable intelligence.
Provides:
  - Chat: context-aware Q&A about timetables, faculty, rooms, courses
  - Analysis: AI quality report on a generated timetable
  - Insights: Smart suggestions for the admin dashboard
"""

from typing import Any, List, Optional
import logging
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api import deps
from app.core.config import settings
from app.models.users import User
from app.models.faculty import Faculty
from app.models.courses import Course
from app.models.infrastructure import Room
from app.models.programs import Program, Batch, Semester, Section
from app.models.timetable import Timetable

router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


# ─── Schemas ───

class ChatRequest(BaseModel):
    message: str
    timetable_id: Optional[str] = None  # optional: scope chat to a specific timetable

class ChatResponse(BaseModel):
    reply: str

class AnalysisRequest(BaseModel):
    timetable_id: str

class AnalysisResponse(BaseModel):
    analysis: str

class InsightItem(BaseModel):
    category: str        # e.g. "Data Quality", "Resource Optimization", "Faculty Workload", "Scheduling", "Quick Win"
    icon: str            # e.g. "alert", "bar-chart", "users", "calendar", "zap"
    title: str
    description: str
    priority: str        # "high", "medium", "low"

class InsightsResponse(BaseModel):
    insights: List[InsightItem]


# ─── Helpers ───

async def _get_groq_api_key() -> str:
    key = getattr(settings, "GROQ_API_KEY", None)
    if not key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")
    return key


async def _call_groq(system_prompt: str, user_message: str) -> str:
    """Call the Groq API and return the assistant's reply."""
    api_key = await _get_groq_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            logging.exception("Groq API error")
            raise HTTPException(status_code=502, detail=f"AI service error: {e.response.text[:200]}")
        except Exception as e:
            logging.exception("Groq call failed")
            raise HTTPException(status_code=502, detail=f"AI service unavailable: {str(e)}")


async def _build_timetable_context(timetable_id: Optional[str] = None) -> str:
    """Build a compact text summary of the current data for the LLM."""
    parts: List[str] = []

    # Faculty summary
    faculty = await Faculty.find_all().to_list()
    if faculty:
        fac_lines = []
        for f in faculty:
            busy = len(f.busy_slots) if f.busy_slots else 0
            fac_lines.append(f"  - {f.name} ({f.designation}, {f.department}), max load: {f.max_load_hours}h, busy slots: {busy}")
        parts.append("FACULTY:\n" + "\n".join(fac_lines))

    # Courses summary
    courses = await Course.find_all().to_list()
    if courses:
        course_lines = []
        for c in courses:
            ltp = f"{c.components.lecture}-{c.components.tutorial}-{c.components.practical}" if c.components else "0-0-0"
            course_lines.append(f"  - {c.code} {c.name} ({c.credits} credits, {c.type}, L-T-P: {ltp})")
        parts.append("COURSES:\n" + "\n".join(course_lines))

    # Rooms summary
    rooms = await Room.find_all().to_list()
    if rooms:
        room_lines = [f"  - {r.name} (type: {r.type or 'General'}, capacity: {r.capacity})" for r in rooms]
        parts.append("ROOMS:\n" + "\n".join(room_lines))

    # Programs/Batches
    programs = await Program.find_all().to_list()
    if programs:
        prog_lines = []
        for p in programs:
            batch_count = len(p.batches) if p.batches else 0
            prog_lines.append(f"  - {p.name} ({p.code}, {p.type}, {p.duration_years}yr, {batch_count} batches)")
        parts.append("PROGRAMS:\n" + "\n".join(prog_lines))

    # Timetable entries (specific or all)
    from beanie.odm.fields import PydanticObjectId
    all_timetables = []
    if timetable_id:
        tt = await Timetable.get(PydanticObjectId(timetable_id))
        if tt and tt.entries:
            label = await _timetable_label(tt)
            _append_timetable_entries(parts, tt, label)
            all_timetables.append((tt, label))
    else:
        timetables = await Timetable.find_all().to_list()
        for tt in timetables[:5]:  # up to 5
            label = await _timetable_label(tt)
            _append_timetable_entries(parts, tt, label)
            all_timetables.append((tt, label))

    # Faculty-centric schedule (combined across all timetables)
    if all_timetables:
        faculty_schedule = _build_faculty_schedule(all_timetables)
        if faculty_schedule:
            parts.append(faculty_schedule)

    return "\n\n".join(parts)


def _extract_link_id(link_field):
    """Extract the string ID from a Beanie Link or document."""
    if link_field is None:
        return None
    if hasattr(link_field, "id"):
        return str(link_field.id)
    if hasattr(link_field, "ref") and link_field.ref:
        return str(link_field.ref.id)
    return None


async def _timetable_label(tt: Timetable) -> str:
    """Build a human-readable label like 'B.Tech CSE – Sem 3 – Section A' for a timetable."""
    from beanie.odm.fields import PydanticObjectId
    label_parts = []
    try:
        pid = _extract_link_id(tt.program)
        if pid:
            prog = await Program.get(PydanticObjectId(pid))
            if prog:
                label_parts.append(prog.name)
    except Exception:
        pass
    try:
        sid = _extract_link_id(tt.semester)
        if sid:
            sem = await Semester.get(PydanticObjectId(sid))
            if sem:
                label_parts.append(f"Sem {sem.number}" if hasattr(sem, "number") and sem.number else sem.name)
    except Exception:
        pass
    try:
        sec_id = _extract_link_id(tt.section)
        if sec_id:
            sec = await Section.get(PydanticObjectId(sec_id))
            if sec:
                label_parts.append(f"Section {sec.name}")
    except Exception:
        pass
    return " – ".join(label_parts) if label_parts else f"Timetable {tt.id}"


def _append_timetable_entries(parts: list, tt, label: str):
    """Format timetable entries as a compact day-wise table per section."""
    if not tt.entries:
        return
    day_groups: dict[str, list] = {}
    for e in tt.entries:
        day_groups.setdefault(e.day, []).append(e)
    formatted = []
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
        if day not in day_groups:
            continue
        entries_sorted = sorted(day_groups[day], key=lambda x: x.period)
        slots = [f"P{e.period}-{e.course_name}({e.faculty_name},{e.room_name})" for e in entries_sorted]
        formatted.append(f"  {day}: {' | '.join(slots)}")
    parts.append(f"[{label}]:\n" + "\n".join(formatted))


def _build_faculty_schedule(timetables_with_labels: list) -> str:
    """Build a faculty-centric combined schedule across all timetables.
    
    Output format per faculty:
      FACULTY SCHEDULE: Dr. X
        Monday: P2-Os-B201-Sec B | P5-ES-B201-Sec A | ...
        Tuesday: ...
        Free periods: Monday(P1,P3,P6,P7), Tuesday(...)
    """
    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    # Collect: faculty_name -> day -> list of (period, course, room, section_label)
    fac_map: dict[str, dict[str, list]] = {}
    # Figure out max period across all entries
    max_period = 8
    
    for tt, label in timetables_with_labels:
        if not tt.entries:
            continue
        # Extract short section label from timetable label, e.g. "Section A" -> "Sec A"
        sec_short = ""
        if "Section" in label:
            sec_short = label.split("Section")[-1].strip()
            sec_short = f"Sec {sec_short}"
        elif "Sec" in label:
            sec_short = label.split("–")[-1].strip() if "–" in label else ""
        else:
            sec_short = label.split("–")[-1].strip() if "–" in label else label
        
        for e in tt.entries:
            fname = e.faculty_name.strip()
            if not fname:
                continue
            if fname not in fac_map:
                fac_map[fname] = {}
            if e.day not in fac_map[fname]:
                fac_map[fname][e.day] = []
            fac_map[fname][e.day].append((e.period, e.course_name, e.room_name, sec_short))
            if e.period > max_period:
                max_period = e.period
    
    if not fac_map:
        return ""
    
    lines = ["FACULTY SCHEDULES (combined across all sections):"]
    for fname in sorted(fac_map.keys()):
        lines.append(f"\n  {fname}:")
        occupied_by_day: dict[str, set] = {}
        for day in DAYS:
            if day not in fac_map[fname]:
                continue
            entries = sorted(fac_map[fname][day], key=lambda x: x[0])
            occupied_by_day[day] = {e[0] for e in entries}
            slots = [f"P{p}-{course}({room},{sec})" for p, course, room, sec in entries]
            lines.append(f"    {day}: {' | '.join(slots)}")
        # Free periods
        all_periods = set(range(1, max_period + 1))
        free_parts = []
        for day in DAYS:
            occupied = occupied_by_day.get(day, set())
            free = sorted(all_periods - occupied)
            if free and day in occupied_by_day:
                free_str = ",".join(f"P{p}" for p in free)
                free_parts.append(f"{day}({free_str})")
        if free_parts:
            lines.append(f"    Free: {' | '.join(free_parts)}")
    
    return "\n".join(lines)


# ─── Endpoints ───

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    req: ChatRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    AI-powered chat about timetable data. Answers queries about schedules,
    faculty availability, room usage, courses, and more.
    """
    context = await _build_timetable_context(req.timetable_id)

    system_prompt = f"""You are IntelliScheduler AI, a university timetable assistant.

LIVE DATA:
{context}

RESPONSE RULES:
1. Answer ONLY from the data above. If data is missing, say so.
2. NEVER show database IDs. Use the full timetable labels from the data (e.g. "Computer Science and Engineering - AI & ML – Sem 3 – Section A").
3. Keep responses clear and structured.

FORMATTING FOR FACULTY SCHEDULE QUESTIONS:
When asked about a teacher's classes on a specific day, respond with a bullet list. Each bullet should follow this EXACT format:
• CourseName (in room RoomName) during period P# for FullTimetableLabel

Example:
Dr. X has the following classes on Monday:
• Os (in room B-201) during period P2 for CSE AI&ML – Sem 3 – Section B
• DSA (in room A-102) during period P4 for CSE AI&ML – Sem 3 – Section A

Then on a new line:
Free periods: P1, P3, P5, P6, P7

IMPORTANT:
- Use the timetable label from the data (the text in square brackets like [Computer Science and Engineering - AI & ML – Sem 3 – Section B]). Remove the square brackets but SHORTEN the program name to its abbreviation (e.g. "Computer Science and Engineering - AI & ML" becomes "CSE AI&ML", "Mechanical Engineering" becomes "ME", "Electronics and Communication Engineering" becomes "ECE"). Keep Sem and Section in full.
- Example shortened label: "CSE AI&ML – Sem 3 – Section B"
- Do NOT use tables for faculty schedule questions. Use bullet points only.
- Sort the bullets by period number.

FOR OTHER QUESTIONS:
- Use markdown tables for tabular data when appropriate.
- Use bullet points for lists. Keep it concise.
- Bold key information.
- You may suggest improvements or flag issues you notice."""

    reply = await _call_groq(system_prompt, req.message)
    return {"reply": reply}


@router.post("/analyze", response_model=AnalysisResponse)
async def ai_analyze_timetable(
    req: AnalysisRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    AI-powered quality analysis of a specific timetable.
    Returns faculty workload balance, room utilization, day distribution, and suggestions.
    """
    context = await _build_timetable_context(req.timetable_id)

    system_prompt = f"""You are a timetable quality analyst for a university scheduling system.
Analyze the following timetable data and provide a comprehensive quality report.

{context}

Your analysis should cover:
1. **Faculty Workload** — Is the teaching load balanced? Any overloaded / underutilized faculty?
2. **Room Utilization** — Are rooms efficiently used? Any over/under-used rooms? Are lab courses in lab rooms?
3. **Day Distribution** — Are classes spread evenly across the week? Any heavy/light days?
4. **Student Experience** — Are there long gaps or too many consecutive classes?
5. **Suggestions** — 3-5 actionable improvements.

Use clean markdown formatting with headers and bullet points. Be specific with names and numbers."""

    analysis = await _call_groq(system_prompt, "Please analyze this timetable and provide a quality report.")
    return {"analysis": analysis}


@router.get("/insights", response_model=InsightsResponse)
async def ai_dashboard_insights(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    AI-generated smart insights for the admin dashboard.
    Flags issues like unassigned courses, underutilized resources, etc.
    Returns structured JSON array of insight objects.
    """
    context = await _build_timetable_context()

    # Also gather some stats
    faculty = await Faculty.find_all().to_list()
    courses = await Course.find_all().to_list()
    rooms = await Room.find_all().to_list()
    timetables = await Timetable.find_all().to_list()

    # Quick data checks
    stats_lines = []
    no_program_courses = [c for c in courses if not c.program]
    if no_program_courses:
        stats_lines.append(f"- {len(no_program_courses)} courses have no program assigned: {', '.join(c.name for c in no_program_courses[:5])}")

    no_semester_courses = [c for c in courses if not c.semester]
    if no_semester_courses:
        stats_lines.append(f"- {len(no_semester_courses)} courses have no semester assigned: {', '.join(c.name for c in no_semester_courses[:5])}")

    stats = "\n".join(stats_lines) if stats_lines else "No data issues detected."

    system_prompt = f"""You are IntelliScheduler AI providing dashboard insights for the admin of a university timetable system.

Current system data:
{context}

Data quality issues detected:
{stats}

Summary: {len(faculty)} faculty, {len(courses)} courses, {len(rooms)} rooms, {len(timetables)} timetables.

You MUST respond with ONLY a valid JSON array (no markdown, no explanation, no code fences).
Each element must be an object with exactly these fields:
- "category": one of "Data Quality", "Resource Optimization", "Faculty Workload", "Scheduling", "Quick Win"
- "icon": one of "alert", "bar-chart", "users", "calendar", "zap" (matching the category)
- "title": a short headline (max 10 words)
- "description": 1-2 sentence actionable insight with specific names/numbers from the data
- "priority": one of "high", "medium", "low"

Generate exactly 5 insight objects. Be specific with names and numbers from the data.
Example format:
[{{"category":"Data Quality","icon":"alert","title":"Missing Program Assignments","description":"3 courses have no program assigned...","priority":"high"}}]"""

    raw = await _call_groq(system_prompt, "Generate 5 structured dashboard insights as a JSON array.")

    # Parse the JSON response from the LLM
    try:
        # Strip potential markdown fences
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

        parsed = json.loads(cleaned)
        if not isinstance(parsed, list):
            parsed = [parsed]

        # Validate and build InsightItem list
        valid_categories = {"Data Quality", "Resource Optimization", "Faculty Workload", "Scheduling", "Quick Win"}
        valid_icons = {"alert", "bar-chart", "users", "calendar", "zap"}
        valid_priorities = {"high", "medium", "low"}

        items = []
        for obj in parsed[:6]:
            items.append(InsightItem(
                category=obj.get("category", "Quick Win") if obj.get("category") in valid_categories else "Quick Win",
                icon=obj.get("icon", "zap") if obj.get("icon") in valid_icons else "zap",
                title=obj.get("title", "Insight"),
                description=obj.get("description", ""),
                priority=obj.get("priority", "medium") if obj.get("priority") in valid_priorities else "medium",
            ))

        return {"insights": items}

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logging.warning(f"Failed to parse AI insights JSON: {e}. Raw: {raw[:300]}")
        # Fallback: return a single item with the raw text
        return {"insights": [InsightItem(
            category="Quick Win",
            icon="zap",
            title="AI Insights",
            description=raw[:500],
            priority="medium",
        )]}
