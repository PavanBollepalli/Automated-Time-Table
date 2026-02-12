from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.models.faculty import TimeSlot

class FacultyCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    max_load_hours: int = 18
    can_teach_course_ids: List[str] = []
    busy_slots: List[TimeSlot] = []

class FacultyOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: str
    designation: str
    max_load_hours: int
    current_load_hours: int
    busy_slots: List[TimeSlot]
    # can_teach details would be fetched separately or populated
