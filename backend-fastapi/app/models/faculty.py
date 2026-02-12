from typing import List, Optional
from beanie import Document, Link
from pydantic import BaseModel, EmailStr, Field
from app.models.courses import Course

class TimeSlot(BaseModel):
    day: str # "Monday", "Tuesday", etc.
    periods: List[int] # [1, 2, 3]

class Faculty(Document):
    name: str
    email: EmailStr
    department: str
    designation: str # "Professor", "Assistant Professor"
    
    # Workload Constraints
    max_load_hours: int = 18
    current_load_hours: int = 0
    
    # Expertise
    can_teach: List[Link[Course]] = []
    
    # Availability (Busy slots or preferred slots)
    busy_slots: List[TimeSlot] = []
    
    class Settings:
        name = "faculty"
