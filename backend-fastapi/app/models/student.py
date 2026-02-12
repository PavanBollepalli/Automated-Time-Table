from typing import List, Optional
from beanie import Document, Link
from pydantic import Field

from app.models.programs import Batch
from app.models.courses import Course

class Student(Document):
    name: str
    student_id: str = Field(..., unique=True)
    
    # Relationships
    batch: Link[Batch]
    chosen_electives: List[Link[Course]] = []
    
    class Settings:
        name = "students"
