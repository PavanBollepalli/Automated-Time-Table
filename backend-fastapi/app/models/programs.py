from typing import List, Optional
from beanie import Document, Link
from pydantic import BaseModel, Field

class Semester(Document):
    name: str  # e.g., "Sem 1", "Sem 2"
    number: int
    is_active: bool = True
    
    class Settings:
        name = "semesters"

class Batch(Document):
    name: str # e.g., "2024-2028"
    start_year: int
    end_year: int
    current_semester: Optional[Link[Semester]] = None
    
    class Settings:
        name = "batches"

class Program(Document):
    name: str # e.g., "B.Tech Computer Science", "B.Ed"
    code: str # e.g., "BTCS", "BED"
    type: str # "UG", "PG", "FYUP", "ITE"
    duration_years: int
    batches: List[Link[Batch]] = []
    
    class Settings:
        name = "programs"
