from typing import List, Optional, Any
from beanie import Document, Link
from pydantic import BaseModel
from datetime import datetime
from app.models.programs import Program, Batch, Semester, Section


class BreakSlot(BaseModel):
    """A break or lunch slot in the schedule."""
    after_period: int        # Break comes after this period number
    duration_minutes: int    # Duration in minutes
    name: str = "Break"      # e.g., "Lunch", "Tea Break"


class ScheduleConfig(Document):
    """
    Configurable schedule timings per semester.
    Different semesters can have different start times, period lengths, and break structures.
    """
    semester: Optional[Link[Semester]] = None
    name: str = "Default Schedule"
    start_time: str = "09:00"               # HH:MM format
    period_duration_minutes: int = 60       # Each period length
    periods_per_day: int = 8                # Total teaching periods per day
    breaks: List[BreakSlot] = []            # Breaks/lunch inserted between periods
    working_days: List[str] = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]

    class Settings:
        name = "schedule_configs"


class TimetableEntry(BaseModel):
    entry_id: str = ""
    day: str
    period: int
    course_id: str
    course_name: str
    faculty_id: str
    faculty_name: str
    room_id: str
    room_name: str
    batch_id: str
    section_id: str = ""
    section_name: str = ""


class Timetable(Document):
    program: Link[Program]
    batch: Link[Batch]
    semester: Link[Semester]
    section: Optional[Link[Section]] = None

    entries: List[TimetableEntry] = []

    is_draft: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "timetables"
