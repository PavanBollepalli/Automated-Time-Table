from typing import List, Optional, Any
from pydantic import BaseModel
from beanie.odm.fields import PydanticObjectId
from app.models.faculty import Faculty
from app.models.courses import Course
from app.models.infrastructure import Room
from app.models.timetable import BreakSlot


class TimetableEntryUpdate(BaseModel):
    entry_id: str # The unique ID of the timetable entry to update
    day: str
    period: int
    room_id: PydanticObjectId

class TimetableUpdateRequest(BaseModel):
    action: str # "move_entry"
    payload: TimetableEntryUpdate

class TimetableGenerateRequest(BaseModel):
    program_id: PydanticObjectId
    batch_id: PydanticObjectId
    semester_id: PydanticObjectId
    section_ids: Optional[List[str]] = None  # If None, generate for all sections in the batch

class TimetableEntryOut(BaseModel):
    entry_id: Optional[str] = None
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

class TimetableOut(BaseModel):
    id: str
    program_id: str
    batch_id: str
    semester_id: str
    section_id: str = ""
    program_name: str = ""
    batch_name: str = ""
    semester_name: str = ""
    section_name: str = ""
    entries: List[TimetableEntryOut] = []
    is_draft: bool = True

    class Config:
        from_attributes = True

class SimulationRequest(BaseModel):
    """
    Defines the payload for a 'what-if' simulation.
    Allows providing hypothetical new or modified entities.
    """
    hypothetical_faculty: List[Faculty] = []
    hypothetical_courses: List[Course] = []
    hypothetical_rooms: List[Room] = []


# ─── Schedule Config Schemas ───

class BreakSlotSchema(BaseModel):
    after_period: int
    duration_minutes: int
    name: str = "Break"

class ScheduleConfigCreate(BaseModel):
    semester_id: Optional[str] = None
    name: str = "Default Schedule"
    start_time: str = "09:00"
    period_duration_minutes: int = 60
    periods_per_day: int = 8
    breaks: List[BreakSlotSchema] = []
    working_days: List[str] = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]

class ScheduleConfigOut(BaseModel):
    id: str
    semester_id: Optional[str] = None
    semester_name: Optional[str] = None
    name: str
    start_time: str
    period_duration_minutes: int
    periods_per_day: int
    breaks: List[BreakSlotSchema] = []
    working_days: List[str] = []
