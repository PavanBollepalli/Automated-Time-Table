from typing import List, Optional, Any
from beanie import Document, Link
from pydantic import BaseModel
from datetime import datetime
from app.models.programs import Program, Batch, Semester

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
    batch_id: str # For sectioning

class Timetable(Document):
    program: Link[Program]
    batch: Link[Batch]
    semester: Link[Semester]
    
    entries: List[TimetableEntry] = []
    
    is_draft: bool = True
    created_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "timetables"
