from typing import List, Optional, Any
from pydantic import BaseModel
from beanie.odm.fields import PydanticObjectId
from app.models.faculty import Faculty
from app.models.courses import Course
from app.models.infrastructure import Room


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

class TimetableOut(BaseModel):
    id: str
    program_id: str
    batch_id: str
    semester_id: str
    program_name: str = ""
    batch_name: str = ""
    semester_name: str = ""
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
