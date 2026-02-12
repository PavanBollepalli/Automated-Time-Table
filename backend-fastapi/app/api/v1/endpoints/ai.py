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
from app.models.programs import Program, Batch, Semester
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
    if timetable_id:
        from beanie.odm.fields import PydanticObjectId
        tt = await Timetable.get(PydanticObjectId(timetable_id))
        if tt and tt.entries:
            _append_timetable_entries(parts, tt, "SELECTED TIMETABLE")
    else:
        timetables = await Timetable.find_all().to_list()
        for tt in timetables[:3]:  # limit to 3 most recent
            _append_timetable_entries(parts, tt, f"TIMETABLE {tt.id}")

    return "\n\n".join(parts)


def _append_timetable_entries(parts: list, tt, label: str):
    """Format timetable entries compactly."""
    if not tt.entries:
        return
    lines = [f"  {e.day} P{e.period}: {e.course_name} by {e.faculty_name} in {e.room_name}" for e in tt.entries]
    # Group by day for readability
    day_groups = {}
    for e in tt.entries:
        day_groups.setdefault(e.day, []).append(f"P{e.period}: {e.course_name} ({e.faculty_name}, {e.room_name})")
    formatted = []
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
        if day in day_groups:
            formatted.append(f"  {day}: " + " | ".join(sorted(day_groups[day])))
    parts.append(f"{label} ({len(tt.entries)} entries):\n" + "\n".join(formatted))


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

    system_prompt = f"""You are IntelliScheduler AI, an intelligent assistant for a university timetable management system.
You have access to the following LIVE DATA from the system:

{context}

Rules:
- Answer questions accurately based on the data above.
- If asked about something not in the data, say so honestly.
- Be concise and helpful. Use bullet points for lists.
- For scheduling questions, reference specific days, periods, rooms, and faculty.
- You can suggest improvements or flag potential issues you notice.
- Format responses in clean markdown.
- Never make up data that isn't provided above."""

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
